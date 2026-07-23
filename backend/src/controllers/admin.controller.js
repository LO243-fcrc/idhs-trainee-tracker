const prisma = require('../config/db');
const { hashPassword } = require('../utils/password');
const { deriveCaseTypeStatus, CASE_TYPES } = require('./caseType.controller');

// Fixed set of job-performance categories, independent of any course.
const METRIC_CATEGORIES = [
  'POLICY_EFFICIENCY',
  'IES_EFFICIENCY',
  'DATA_ENTRY_ACCURACY',
  'CASE_COMMENTS_QUALITY',
  'INTERVIEWING_IN_PERSON',
  'INTERVIEWING_PHONE',
  'TIMELINESS',
  'ELIGIBILITY_BENEFIT_ACCURACY',
  'VERIFICATION_THOROUGHNESS',
  'NOTICE_PROCEDURAL_ACCURACY',
];

// Optional tag on a metric entry: what kind of case action was the trainee
// handling when they were scored.
const CASE_ACTION_TYPES = ['INTAKE', 'CHANGE', 'ADD_MEMBER', 'ADD_PROGRAM', 'REDETERMINATION'];

// Shared by the matrix and the reports endpoint: collapses a trainee's
// per-module statuses within one course down to a single course-level status.
function deriveCourseStatus(moduleCount, statuses) {
  if (!statuses || statuses.length === 0) return 'NOT_STARTED';
  if (statuses.length >= moduleCount && statuses.every((s) => s === 'COMPLETED')) {
    return 'COMPLETED';
  }
  if (statuses.some((s) => s === 'IN_PROGRESS' || s === 'COMPLETED')) {
    return 'IN_PROGRESS';
  }
  return 'NOT_STARTED';
}

// Given metric records (each with traineeId, category, score, createdAt),
// returns only the most recent record per (traineeId, category) pair.
// Used by reports to average "current standing," not every historical entry.
function pickLatestPerTraineeCategory(records) {
  const latestByKey = {};
  for (const record of records) {
    const key = `${record.traineeId}|${record.category}`;
    const existing = latestByKey[key];
    if (!existing || new Date(record.createdAt) > new Date(existing.createdAt)) {
      latestByKey[key] = record;
    }
  }
  return Object.values(latestByKey);
}

// Matrix data: trainees as rows, courses as columns. Each cell is a single
// status derived from that trainee's per-module progress in that course.
async function getTraineesDashboard(req, res, next) {
  try {
    const [trainees, courses] = await Promise.all([
      prisma.trainee.findMany({
        where: { archivedAt: null },
        select: { id: true, name: true, email: true, employmentStartDate: true },
        orderBy: { name: 'asc' },
      }),
      prisma.course.findMany({
        select: { id: true, title: true, modules: { select: { id: true } } },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const progressRecords = await prisma.progress.findMany({
      where: { traineeId: { in: trainees.map((t) => t.id) } },
      select: { traineeId: true, status: true, module: { select: { courseId: true } } },
    });

    const progressLookup = {};
    for (const record of progressRecords) {
      const { traineeId, status, module } = record;
      const courseId = module.courseId;
      progressLookup[traineeId] ??= {};
      progressLookup[traineeId][courseId] ??= [];
      progressLookup[traineeId][courseId].push(status);
    }

    // Risk indicator: computed from each trainee's LATEST score per category
    // against the certification bar (>70 in every category) and how far
    // through the 12 months they are. NOT_SCORED = no metrics yet;
    // ON_TRACK = every scored category above 70; NEEDS_IMPROVEMENT = one or
    // more at/below 70; AT_RISK = same, but at month 9+ when time to fix
    // it is running out.
    const allMetrics = await prisma.performanceMetric.findMany({
      where: { traineeId: { in: trainees.map((t) => t.id) } },
      select: { traineeId: true, category: true, score: true, createdAt: true },
    });
    const latestMetrics = pickLatestPerTraineeCategory(allMetrics);

    function monthsElapsed(startDate) {
      if (!startDate) return null;
      const start = new Date(startDate);
      const now = new Date();
      let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
      if (now.getDate() < start.getDate()) months -= 1;
      return Math.max(0, months);
    }

    function deriveRiskStatus(traineeId, employmentStartDate) {
      const scores = latestMetrics.filter((m) => m.traineeId === traineeId);
      if (scores.length === 0) return 'NOT_SCORED';
      const belowBarCount = scores.filter((m) => m.score <= 70).length;
      if (belowBarCount === 0) return 'ON_TRACK';
      const months = monthsElapsed(employmentStartDate);
      return months !== null && months >= 9 ? 'AT_RISK' : 'NEEDS_IMPROVEMENT';
    }

    const matrix = trainees.map((trainee) => ({
      trainee: {
        id: trainee.id,
        name: trainee.name,
        email: trainee.email,
        employmentStartDate: trainee.employmentStartDate,
        riskStatus: deriveRiskStatus(trainee.id, trainee.employmentStartDate),
      },
      courseStatuses: courses.map((course) => ({
        courseId: course.id,
        status: deriveCourseStatus(course.modules.length, progressLookup[trainee.id]?.[course.id]),
      })),
    }));

    res.status(200).json({
      courses: courses.map((c) => ({ id: c.id, title: c.title })),
      matrix,
    });
  } catch (err) {
    next(err);
  }
}

// Full detail view for one trainee: course/module status, performance
// metrics, case-type authorization/review status, Highway Training
// completion, trainer/manager assignment, and recent self-reports/reviews.
async function getTraineeDetail(req, res, next) {
  try {
    const { traineeId } = req.params;

    const trainee = await prisma.trainee.findUnique({
      where: { id: traineeId },
      include: {
        trainer: { select: { id: true, name: true } },
        directManager: { select: { id: true, name: true } },
        backupManager: { select: { id: true, name: true } },
      },
    });
    if (!trainee) {
      return res.status(404).json({ error: 'Trainee not found' });
    }

    const [courses, progressRecords, metricRecords, caseTypeEvents, recentReports, recentReviews, courseCompletions] = await Promise.all([
      prisma.course.findMany({
        include: { modules: { orderBy: { order: 'asc' } } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.progress.findMany({ where: { traineeId } }),
      prisma.performanceMetric.findMany({ where: { traineeId }, orderBy: { createdAt: 'desc' } }),
      prisma.caseTypeEvent.findMany({ where: { traineeId }, orderBy: { createdAt: 'desc' } }),
      prisma.dailySelfReport.findMany({ where: { traineeId }, orderBy: { reportDate: 'desc' }, take: 5 }),
      prisma.secondPartyReview.findMany({
        where: { traineeId },
        include: { reviewedBy: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.courseCompletion.findMany({ where: { traineeId } }),
    ]);

    const statusByModule = Object.fromEntries(progressRecords.map((p) => [p.moduleId, p.status]));
    const courseProgress = courses.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      modules: course.modules.map((mod) => ({
        ...mod,
        status: statusByModule[mod.id] || 'NOT_STARTED',
      })),
    }));

    // Every metric category is always present, even if never scored yet.
    const entriesByCategory = {};
    for (const category of METRIC_CATEGORIES) entriesByCategory[category] = [];
    for (const record of metricRecords) entriesByCategory[record.category]?.push(record);

    const performanceMetrics = METRIC_CATEGORIES.map((category) => {
      const entries = entriesByCategory[category]; // already newest-first
      const latest = entries[0] || null;
      return {
        category,
        latestScore: latest?.score ?? null,
        latestNotes: latest?.notes ?? '',
        latestCaseActionType: latest?.caseActionType ?? null,
        latestRecordedAt: latest?.createdAt ?? null,
        entryCount: entries.length,
        recentHistory: entries.slice(0, 5),
        // Full score history (oldest-first), for trend charts and the
        // quarterly snapshot view. Score+date only - tiny records, so a
        // year of scoring stays a small payload.
        scoreHistory: [...entries].reverse().map((e) => ({ score: e.score, recordedAt: e.createdAt })),
      };
    });

    const caseTypeStatus = {};
    for (const caseType of CASE_TYPES) {
      const eventsForType = caseTypeEvents.filter((e) => e.caseType === caseType);
      caseTypeStatus[caseType] = deriveCaseTypeStatus(eventsForType);
    }

    res.status(200).json({
      trainee: {
        id: trainee.id,
        name: trainee.name,
        email: trainee.email,
        employmentStartDate: trainee.employmentStartDate,
        highwayTrainingStartDate: trainee.highwayTrainingStartDate,
        highwayTrainingEndDate: trainee.highwayTrainingEndDate,
        hasSelfReportLogin: Boolean(trainee.selfReportUsername),
        trainer: trainee.trainer,
        directManager: trainee.directManager,
        backupManager: trainee.backupManager,
      },
      courses: courseProgress,
      courseCompletions: courseCompletions.map((c) => ({ courseId: c.courseId, completedAt: c.completedAt })),
      performanceMetrics,
      caseTypeStatus,
      recentSelfReports: recentReports,
      recentSecondPartyReviews: recentReviews,
    });
  } catch (err) {
    next(err);
  }
}

// Management sets a trainee's status for a module directly - no locking,
// no self-reporting. Any module can be set to any status at any time.
async function updateTraineeProgress(req, res, next) {
  try {
    const { traineeId, moduleId } = req.params;
    const { status } = req.body;

    const validStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const [traineeExists, moduleExists] = await Promise.all([
      prisma.trainee.findUnique({ where: { id: traineeId } }),
      prisma.module.findUnique({ where: { id: moduleId } }),
    ]);
    if (!traineeExists) return res.status(404).json({ error: 'Trainee not found' });
    if (!moduleExists) return res.status(404).json({ error: 'Module not found' });

    const progress = await prisma.progress.upsert({
      where: { traineeId_moduleId: { traineeId, moduleId } },
      update: { status },
      create: { traineeId, moduleId, status },
    });

    res.status(200).json(progress);
  } catch (err) {
    next(err);
  }
}

// Sets (or corrects) a trainee's employment start date - important for
// trainees added to the system mid-program, so their 3/6/9/12-month
// schedule anchors to when they actually started, not when their record
// was created here. Open to any management account, same as other
// day-to-day trainee data.
async function setEmploymentStartDate(req, res, next) {
  try {
    const { traineeId } = req.params;
    const { employmentStartDate } = req.body;

    if (employmentStartDate !== null) {
      const parsed = new Date(employmentStartDate);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ error: 'employmentStartDate must be a valid date or null' });
      }
    }

    const traineeExists = await prisma.trainee.findUnique({ where: { id: traineeId } });
    if (!traineeExists) return res.status(404).json({ error: 'Trainee not found' });

    const updated = await prisma.trainee.update({
      where: { id: traineeId },
      data: { employmentStartDate: employmentStartDate === null ? null : new Date(employmentStartDate) },
    });

    res.status(200).json({ id: updated.id, employmentStartDate: updated.employmentStartDate });
  } catch (err) {
    next(err);
  }
}

// Records a new performance-metric entry - an append, never an overwrite.
async function recordTraineeMetric(req, res, next) {
  try {
    const { traineeId, category } = req.params;
    const { score, notes, caseActionType } = req.body;

    if (!METRIC_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'Invalid metric category' });
    }
    if (!Number.isInteger(score) || score < 0 || score > 100) {
      return res.status(400).json({ error: 'Score must be an integer between 0 and 100' });
    }
    if (caseActionType !== undefined && caseActionType !== null && !CASE_ACTION_TYPES.includes(caseActionType)) {
      return res.status(400).json({ error: 'Invalid case action type' });
    }

    const traineeExists = await prisma.trainee.findUnique({ where: { id: traineeId } });
    if (!traineeExists) return res.status(404).json({ error: 'Trainee not found' });

    const metric = await prisma.performanceMetric.create({
      data: { traineeId, category, score, notes: notes || null, caseActionType: caseActionType || null },
    });

    res.status(201).json(metric);
  } catch (err) {
    next(err);
  }
}

// Full history for one trainee+category, newest first.
async function getTraineeMetricHistory(req, res, next) {
  try {
    const { traineeId, category } = req.params;

    if (!METRIC_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'Invalid metric category' });
    }

    const traineeExists = await prisma.trainee.findUnique({ where: { id: traineeId } });
    if (!traineeExists) return res.status(404).json({ error: 'Trainee not found' });

    const history = await prisma.performanceMetric.findMany({
      where: { traineeId, category },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ category, history });
  } catch (err) {
    next(err);
  }
}

// Creates a course and its nested modules in a single transaction.
async function createCourse(req, res, next) {
  try {
    const { title, description, modules } = req.body;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Course title is required' });
    }
    if (!Array.isArray(modules) || modules.length === 0) {
      return res.status(400).json({ error: 'At least one module is required' });
    }

    const validContentTypes = ['VIDEO', 'PDF', 'TEXT'];
    for (const [index, mod] of modules.entries()) {
      if (!mod.title || !mod.contentUrl || !validContentTypes.includes(mod.contentType)) {
        return res.status(400).json({ error: `Module at position ${index} is invalid` });
      }
    }

    const course = await prisma.course.create({
      data: {
        title,
        description: description || null,
        createdBy: req.user.userId,
        modules: {
          create: modules.map((mod, index) => ({
            title: mod.title,
            contentType: mod.contentType,
            contentUrl: mod.contentUrl,
            order: mod.order ?? index,
          })),
        },
      },
      include: { modules: true },
    });

    res.status(201).json(course);
  } catch (err) {
    next(err);
  }
}

// ADMIN ONLY: creates a single Trainee record. A data record only - no
// login, no password, no account created (that's a separate step via
// issueSelfReportCredentials). Three distinct dates matter here:
// employmentStartDate anchors the 3/6/9/12-month schedule; the two Highway
// Training dates are tracked separately since that program has its own
// timeline, independent of when the trainee started their job.
function parseOptionalDate(value, fieldName, errors) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    errors.push(`${fieldName} must be a valid date`);
    return null;
  }
  return parsed;
}

async function createTrainee(req, res, next) {
  try {
    const { name, email, employmentStartDate, highwayTrainingStartDate, highwayTrainingEndDate } = req.body;

    const trimmedName = String(name || '').trim();
    if (!trimmedName) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const dateErrors = [];
    const parsedEmploymentStart = parseOptionalDate(employmentStartDate, 'employmentStartDate', dateErrors);
    const parsedHighwayStart = parseOptionalDate(highwayTrainingStartDate, 'highwayTrainingStartDate', dateErrors);
    const parsedHighwayEnd = parseOptionalDate(highwayTrainingEndDate, 'highwayTrainingEndDate', dateErrors);
    if (dateErrors.length > 0) {
      return res.status(400).json({ error: dateErrors.join('; ') });
    }

    const emailRaw = String(email || '').trim().toLowerCase();
    const normalizedEmail = emailRaw || null;
    if (normalizedEmail) {
      const existing = await prisma.trainee.findUnique({ where: { email: normalizedEmail } });
      if (existing) {
        return res.status(409).json({ error: 'A trainee with this email already exists' });
      }
    }

    const trainee = await prisma.trainee.create({
      data: {
        name: trimmedName,
        email: normalizedEmail,
        employmentStartDate: parsedEmploymentStart,
        highwayTrainingStartDate: parsedHighwayStart,
        highwayTrainingEndDate: parsedHighwayEnd,
      },
    });

    res.status(201).json(trainee);
  } catch (err) {
    next(err);
  }
}

// Edits a trainee's own identity fields (name/email). Open to any
// management account - "everyone except trainees" can add, edit, or
// archive a trainee.
async function updateTrainee(req, res, next) {
  try {
    const { traineeId } = req.params;
    const { name, email } = req.body;

    const existing = await prisma.trainee.findUnique({ where: { id: traineeId } });
    if (!existing) return res.status(404).json({ error: 'Trainee not found' });

    const data = {};
    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (!trimmedName) return res.status(400).json({ error: 'Name cannot be empty' });
      data.name = trimmedName;
    }
    if (email !== undefined) {
      const normalizedEmail = String(email || '').trim().toLowerCase() || null;
      if (normalizedEmail) {
        const emailTaken = await prisma.trainee.findFirst({
          where: { email: normalizedEmail, NOT: { id: traineeId } },
        });
        if (emailTaken) return res.status(409).json({ error: 'A trainee with this email already exists' });
      }
      data.email = normalizedEmail;
    }

    const updated = await prisma.trainee.update({ where: { id: traineeId }, data });
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

// Archives or restores a trainee - a soft archive, not a delete. Archived
// trainees keep all their history but drop out of the active dashboard.
// Open to any management account.
async function setTraineeArchived(req, res, next) {
  try {
    const { traineeId } = req.params;
    const { archived } = req.body;

    if (typeof archived !== 'boolean') {
      return res.status(400).json({ error: 'archived must be true or false' });
    }

    const existing = await prisma.trainee.findUnique({ where: { id: traineeId } });
    if (!existing) return res.status(404).json({ error: 'Trainee not found' });

    const updated = await prisma.trainee.update({
      where: { id: traineeId },
      data: { archivedAt: archived ? new Date() : null },
    });

    res.status(200).json({ id: updated.id, archivedAt: updated.archivedAt });
  } catch (err) {
    next(err);
  }
}

// Full trainee list for the Settings page - includes archived trainees
// (with a flag) so management can find and restore them, unlike the
// dashboard matrix which only ever shows active trainees.
async function listTrainees(req, res, next) {
  try {
    const trainees = await prisma.trainee.findMany({
      select: { id: true, name: true, email: true, archivedAt: true, employmentStartDate: true, highwayTrainingStartDate: true, highwayTrainingEndDate: true },
      orderBy: [{ archivedAt: 'asc' }, { name: 'asc' }],
    });
    res.status(200).json({ trainees });
  } catch (err) {
    next(err);
  }
}

// ADMIN ONLY: creates an additional management account.
async function createManagementUser(req, res, next) {
  try {
    const { email, name, password, role } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ error: 'Email, name, and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    const requestedRole = role === 'ADMIN' ? 'ADMIN' : 'MANAGEMENT';

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email: normalizedEmail, name, passwordHash, role: requestedRole },
    });

    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    next(err);
  }
}

// ADMIN ONLY: update a management user's name, email, and optionally password
async function updateManagementUser(req, res, next) {
  try {
    const { userId } = req.params;
    const { name, email, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (normalizedEmail !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existing) {
        return res.status(409).json({ error: 'An account with this email already exists' });
      }
    }

    const updateData = {
      name,
      email: normalizedEmail,
    };

    if (password) {
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }
      updateData.passwordHash = await hashPassword(password);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    res.json({ id: updated.id, name: updated.name, email: updated.email, role: updated.role });
  } catch (err) {
    next(err);
  }
}

// ADMIN ONLY: assigns which management account is the trainer / direct
// manager / backup manager for a trainee. Any field can be cleared by
// passing null. Manager and backup manager are specifically the two
// people who perform second-party review for this trainee. Every actual
// change (not just every call) is logged to AssignmentHistory - this is
// what makes handoff "streamlined": one action, with a record of who
// changed what, who did it, and why.
async function assignTraineeRelationships(req, res, next) {
  try {
    const { traineeId } = req.params;
    const { trainerId, directManagerId, backupManagerId, note } = req.body;

    const existingTrainee = await prisma.trainee.findUnique({ where: { id: traineeId } });
    if (!existingTrainee) return res.status(404).json({ error: 'Trainee not found' });

    const fieldsToCheck = [
      ['trainerId', trainerId, 'TRAINER', existingTrainee.trainerId],
      ['directManagerId', directManagerId, 'DIRECT_MANAGER', existingTrainee.directManagerId],
      ['backupManagerId', backupManagerId, 'BACKUP_MANAGER', existingTrainee.backupManagerId],
    ];

    for (const [label, id] of fieldsToCheck) {
      if (id !== undefined && id !== null) {
        const userExists = await prisma.user.findUnique({ where: { id } });
        if (!userExists) return res.status(400).json({ error: `${label} does not reference a real account` });
      }
    }

    const updated = await prisma.trainee.update({
      where: { id: traineeId },
      data: {
        ...(trainerId !== undefined ? { trainerId } : {}),
        ...(directManagerId !== undefined ? { directManagerId } : {}),
        ...(backupManagerId !== undefined ? { backupManagerId } : {}),
      },
      include: {
        trainer: { select: { id: true, name: true } },
        directManager: { select: { id: true, name: true } },
        backupManager: { select: { id: true, name: true } },
      },
    });

    // Log one history entry per field that actually changed - a field
    // that wasn't included in the request, or was sent but unchanged,
    // gets no entry.
    const historyEntries = [];
    for (const [, newValue, role, previousValue] of fieldsToCheck) {
      if (newValue !== undefined && newValue !== previousValue) {
        historyEntries.push({
          traineeId,
          role,
          previousUserId: previousValue || null,
          newUserId: newValue || null,
          changedById: req.user.userId,
          note: note || null,
        });
      }
    }
    if (historyEntries.length > 0) {
      await prisma.assignmentHistory.createMany({ data: historyEntries });
    }

    res.status(200).json({
      id: updated.id,
      trainer: updated.trainer,
      directManager: updated.directManager,
      backupManager: updated.backupManager,
    });
  } catch (err) {
    next(err);
  }
}

// Assignment history for a trainee, newest first, with previous/new user
// names resolved in one pass (previousUserId/newUserId aren't FK relations,
// so this batches a single lookup instead of a query per row).
async function getAssignmentHistory(req, res, next) {
  try {
    const { traineeId } = req.params;

    const traineeExists = await prisma.trainee.findUnique({ where: { id: traineeId } });
    if (!traineeExists) return res.status(404).json({ error: 'Trainee not found' });

    const history = await prisma.assignmentHistory.findMany({
      where: { traineeId },
      include: { changedBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const referencedUserIds = [
      ...new Set(history.flatMap((h) => [h.previousUserId, h.newUserId]).filter(Boolean)),
    ];
    const referencedUsers = referencedUserIds.length
      ? await prisma.user.findMany({ where: { id: { in: referencedUserIds } }, select: { id: true, name: true } })
      : [];
    const nameById = Object.fromEntries(referencedUsers.map((u) => [u.id, u.name]));

    const enriched = history.map((h) => ({
      ...h,
      previousUserName: h.previousUserId ? nameById[h.previousUserId] || 'Unknown' : null,
      newUserName: h.newUserId ? nameById[h.newUserId] || 'Unknown' : null,
    }));

    res.status(200).json({ history: enriched });
  } catch (err) {
    next(err);
  }
}

// ADMIN ONLY: issues (or replaces) a trainee's self-report login credentials.
async function issueSelfReportCredentials(req, res, next) {
  try {
    const { traineeId } = req.params;

    const traineeExists = await prisma.trainee.findUnique({ where: { id: traineeId } });
    if (!traineeExists) return res.status(404).json({ error: 'Trainee not found' });

    // Generate a unique, secure token (32 random hex characters)
    const token = require('crypto').randomBytes(16).toString('hex');
    console.log(`[TOKEN] Generated token for trainee ${traineeExists.name}: ${token.substring(0, 8)}...`);

    const updated = await prisma.trainee.update({
      where: { id: traineeId },
      data: { selfReportToken: token },
      select: { id: true, name: true, selfReportToken: true }
    });

    console.log(`[TOKEN] Saved to database. Verification: token=${updated.selfReportToken?.substring(0, 8)}...`);

    // Return token and the URL to share
    res.status(200).json({ 
      token,
      reportUrl: `/report?token=${token}`
    });
  } catch (err) {
    console.error('[TOKEN] Error generating token:', err.message);
    next(err);
  }
}

// Aggregate view: per-program completion, average of each trainee's most
// recent score per performance category, and a case-type authorization
// summary across all trainees.
// Aggregate reports, filterable by any combination of: traineeId, trainerId,
// directManagerId, courseId, caseType, dateFrom, dateTo. Filters narrow which
// trainees are included and, for the two time-series sections (performance
// averages, certification rate), which date range of records counts.
// Case-type authorization status is always "as of now" regardless of the
// date filter - a status like "currently authorized" isn't meaningful
// scoped to a past window the way a score or a case count is.
async function getReports(req, res, next) {
  try {
    const { traineeId, trainerId, directManagerId, courseId, caseType, dateFrom, dateTo } = req.query;

    const traineeWhere = { archivedAt: null };
    if (traineeId) traineeWhere.id = traineeId;
    if (trainerId) traineeWhere.trainerId = trainerId;
    if (directManagerId) traineeWhere.directManagerId = directManagerId;

    const trainees = await prisma.trainee.findMany({ where: traineeWhere, select: { id: true } });
    const traineeIds = trainees.map((t) => t.id);
    const totalTrainees = trainees.length;

    const courseWhere = courseId ? { id: courseId } : {};
    const courses = await prisma.course.findMany({
      where: courseWhere,
      select: { id: true, title: true, modules: { select: { id: true } } },
      orderBy: { createdAt: 'asc' },
    });

    const dateRange = {};
    if (dateFrom) dateRange.gte = new Date(dateFrom);
    if (dateTo) dateRange.lte = new Date(dateTo);
    const hasDateRange = Object.keys(dateRange).length > 0;

    const [progressRecords, metricRecords, caseTypeEvents, selfReports] = await Promise.all([
      prisma.progress.findMany({
        where: { traineeId: { in: traineeIds } },
        select: { traineeId: true, status: true, module: { select: { courseId: true } } },
      }),
      prisma.performanceMetric.findMany({
        where: { traineeId: { in: traineeIds }, ...(hasDateRange ? { createdAt: dateRange } : {}) },
        select: { traineeId: true, category: true, score: true, createdAt: true },
      }),
      prisma.caseTypeEvent.findMany({
        where: { traineeId: { in: traineeIds } },
        select: { traineeId: true, caseType: true, eventType: true, createdAt: true },
      }),
      prisma.dailySelfReport.findMany({
        where: { traineeId: { in: traineeIds }, ...(hasDateRange ? { reportDate: dateRange } : {}) },
        select: { casesCertified: true, casesPending: true },
      }),
    ]);

    const progressLookup = {};
    for (const record of progressRecords) {
      const { traineeId: tId, status, module } = record;
      progressLookup[tId] ??= {};
      progressLookup[tId][module.courseId] ??= [];
      progressLookup[tId][module.courseId].push(status);
    }

    const programMetrics = courses.map((course) => {
      const counts = { NOT_STARTED: 0, IN_PROGRESS: 0, COMPLETED: 0 };
      for (const trainee of trainees) {
        const status = deriveCourseStatus(course.modules.length, progressLookup[trainee.id]?.[course.id]);
        counts[status] += 1;
      }
      const completionRate = totalTrainees === 0 ? 0 : Math.round((counts.COMPLETED / totalTrainees) * 100);
      return { courseId: course.id, title: course.title, totalTrainees, ...counts, completionRate };
    });

    const latestMetrics = pickLatestPerTraineeCategory(metricRecords);
    
    // Performance averages based on current filters
    const performanceAverages = METRIC_CATEGORIES.map((category) => {
      const scores = latestMetrics
        .filter((m) => m.category === category && (!traineeId || m.traineeId === traineeId))
        .map((m) => m.score);
      const averageScore =
        scores.length === 0 ? null : Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
      const scoredCount = scores.length;
      return { category, averageScore, scoredCount, totalTrainees };
    });

    // Overall performance averages across ALL trainees (no filters except date)
    const allTraineeIds = (await prisma.trainee.findMany({ where: { archivedAt: null }, select: { id: true } })).map((t) => t.id);
    const allMetricRecords = await prisma.performanceMetric.findMany({
      where: { traineeId: { in: allTraineeIds }, ...(hasDateRange ? { createdAt: dateRange } : {}) },
      select: { traineeId: true, category: true, score: true },
    });
    const allLatestMetrics = pickLatestPerTraineeCategory(allMetricRecords);
    const overallPerformanceAverages = METRIC_CATEGORIES.map((category) => {
      const scores = allLatestMetrics.filter((m) => m.category === category).map((m) => m.score);
      const averageScore =
        scores.length === 0 ? null : Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
      return { category, averageScore, scoredCount: scores.length, totalTrainees: allTraineeIds.length };
    });

    const caseTypesToReport = caseType ? [caseType] : CASE_TYPES;
    const caseTypeSummary = caseTypesToReport.map((ct) => {
      let authorizedCount = 0;
      let reviewIndependentCount = 0;
      for (const trainee of trainees) {
        const eventsForTrainee = caseTypeEvents.filter((e) => e.traineeId === trainee.id && e.caseType === ct);
        const status = deriveCaseTypeStatus(eventsForTrainee);
        if (status.authorized) authorizedCount += 1;
        if (status.reviewIndependent) reviewIndependentCount += 1;
      }
      return { caseType: ct, authorizedCount, reviewIndependentCount, totalTrainees };
    });

    const totalCertified = selfReports.reduce((sum, r) => sum + r.casesCertified, 0);
    const totalPending = selfReports.reduce((sum, r) => sum + r.casesPending, 0);
    const totalReported = totalCertified + totalPending;
    const certificationRate = totalReported === 0 ? null : Math.round((totalCertified / totalReported) * 100);

    res.status(200).json({
      appliedFilters: { traineeId, trainerId, directManagerId, courseId, caseType, dateFrom, dateTo },
      programMetrics,
      performanceAverages,
      overallPerformanceAverages,
      caseTypeSummary,
      selfReportSummary: { totalCertified, totalPending, certificationRate },
    });
  } catch (err) {
    next(err);
  }
}

// Lists management accounts (id, name, role only) - used to populate the
// trainer/direct-manager assignment pickers. Open to any management
// account, same as viewing trainee data generally.
async function listManagementUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, archivedAt: true },
      orderBy: [{ archivedAt: 'asc' }, { name: 'asc' }],
    });
    res.status(200).json({ users });
  } catch (err) {
    next(err);
  }
}

async function deleteManagementUser(req, res, next) {
  try {
    const { userId } = req.params;

    // Can't delete your own account
    if (req.user.userId === userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Can't delete if it's the only admin (safety check)
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    const userToDelete = await prisma.user.findUnique({ where: { id: userId } });

    if (userToDelete?.role === 'ADMIN' && adminCount === 1) {
      return res.status(400).json({ error: 'Cannot delete the only administrator account' });
    }

    await prisma.user.delete({ where: { id: userId } });
    res.status(200).json({ deleted: true });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    next(err);
  }
}


// Permanently delete a trainee - hard delete, not soft archive. 
// Only use if the record was entered by mistake or if the trainee
// never actually started. For most cases, archive (soft delete) is safer.
async function deleteTrainee(req, res, next) {
  try {
    const { traineeId } = req.params;

    const trainee = await prisma.trainee.findUnique({ where: { id: traineeId } });
    if (!trainee) {
      return res.status(404).json({ error: 'Trainee not found' });
    }

    // Hard delete - cascade will remove all related records
    await prisma.trainee.delete({ where: { id: traineeId } });
    res.status(200).json({ deleted: true });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Trainee not found' });
    }
    next(err);
  }
}

// Archive or restore a management user (soft archive, like trainees).
// Archived users keep all their history but drop out of the active users list.
async function setUserArchived(req, res, next) {
  try {
    const { userId } = req.params;
    const { archived } = req.body;

    if (archived === undefined) {
      return res.status(400).json({ error: 'archived field is required' });
    }

    // Can't archive yourself
    if (req.user.userId === userId) {
      return res.status(400).json({ error: 'Cannot archive your own account' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Can't archive if it's the only admin
    if (user.role === 'ADMIN' && archived) {
      const adminCount = await prisma.user.count({ 
        where: { role: 'ADMIN', archivedAt: null } 
      });
      if (adminCount === 1) {
        return res.status(400).json({ error: 'Cannot archive the only active administrator' });
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { archivedAt: archived ? new Date() : null },
    });

    res.status(200).json({ id: updated.id, archivedAt: updated.archivedAt });
  } catch (err) {
    next(err);
  }
}


module.exports = {
  getTraineesDashboard,
  getTraineeDetail,
  updateTraineeProgress,
  setEmploymentStartDate,
  recordTraineeMetric,
  getTraineeMetricHistory,
  getReports,
  createCourse,
  createTrainee,
  updateTrainee,
  setTraineeArchived,
  listTrainees,
  createManagementUser,
  updateManagementUser,
  assignTraineeRelationships,
  issueSelfReportCredentials,
  listManagementUsers,
  deleteManagementUser,
  setUserArchived,
  deleteTrainee,
  getAssignmentHistory,
  changePassword,
  listCourses,
  deleteCourse,
  updateCourse,
  updateCourseModules,
  assignCourseToTrainee,
  unassignCourseFromTrainee,
};

// Any logged-in user can change their own password
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'New password must be different from current password' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isCorrect = await verifyPassword(currentPassword, user.passwordHash);
    if (!isCorrect) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password and update
    const newPasswordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

// Get all courses created by any user
async function listCourses(req, res, next) {
  try {
    const courses = await prisma.course.findMany({
      include: { modules: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json({ courses });
  } catch (err) {
    next(err);
  }
}

// Delete a course (admin only)
async function deleteCourse(req, res, next) {
  try {
    const { courseId } = req.params;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    await prisma.course.delete({ where: { id: courseId } });
    res.status(200).json({ deleted: true });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Course not found' });
    }
    next(err);
  }
}

// Update course title and description (admin only)
async function updateCourse(req, res, next) {
  try {
    const { courseId } = req.params;
    const { title, description } = req.body;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Course title is required' });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const updated = await prisma.course.update({
      where: { id: courseId },
      data: { title, description: description || null },
      include: { modules: true },
    });

    res.status(200).json(updated);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Course not found' });
    }
    next(err);
  }
}

// Update course modules (replace all modules for a course)
async function updateCourseModules(req, res, next) {
  try {
    const { courseId } = req.params;
    const { modules } = req.body;

    if (!Array.isArray(modules)) {
      return res.status(400).json({ error: 'Modules must be an array' });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Delete old modules
    await prisma.courseModule.deleteMany({ where: { courseId } });

    // Create new modules
    const validContentTypes = ['VIDEO', 'PDF', 'TEXT'];
    for (const [index, mod] of modules.entries()) {
      if (!mod.title || !mod.contentUrl || !validContentTypes.includes(mod.contentType)) {
        return res.status(400).json({ error: `Module at position ${index} is invalid` });
      }
    }

    const created = await Promise.all(
      modules.map((mod, idx) =>
        prisma.courseModule.create({
          data: {
            courseId,
            title: mod.title,
            contentType: mod.contentType,
            contentUrl: mod.contentUrl,
            order: mod.order ?? idx,
          },
        })
      )
    );

    res.status(200).json({ modules: created });
  } catch (err) {
    next(err);
  }
}

// Assign course to trainee
async function assignCourseToTrainee(req, res, next) {
  try {
    const { traineeId } = req.params;
    const { courseId } = req.body;

    if (!traineeId || !courseId) {
      return res.status(400).json({ error: 'Trainee ID and Course ID are required' });
    }

    const trainee = await prisma.trainee.findUnique({ where: { id: traineeId } });
    if (!trainee) {
      return res.status(404).json({ error: 'Trainee not found' });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check if already assigned
    const existing = await prisma.courseCompletion.findUnique({
      where: { traineeId_courseId: { traineeId, courseId } },
    });

    if (existing) {
      return res.status(400).json({ error: 'Course already assigned to this trainee' });
    }

    const assignment = await prisma.courseCompletion.create({
      data: {
        traineeId,
        courseId,
        status: 'NOT_STARTED',
      },
    });

    console.log(`Course ${courseId} assigned to trainee ${traineeId}`);
    res.status(201).json(assignment);
  } catch (err) {
    console.error('Error in assignCourseToTrainee:', err.message);
    res.status(500).json({ error: `Failed to assign course: ${err.message}` });
  }
}

// Unassign course from trainee
async function unassignCourseFromTrainee(req, res, next) {
  try {
    const { traineeId, courseId } = req.params;

    const assignment = await prisma.courseCompletion.findUnique({
      where: { traineeId_courseId: { traineeId, courseId } },
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Course not assigned to this trainee' });
    }

    await prisma.courseCompletion.delete({
      where: { traineeId_courseId: { traineeId, courseId } },
    });

    res.status(200).json({ unassigned: true });
  } catch (err) {
    next(err);
  }
}
