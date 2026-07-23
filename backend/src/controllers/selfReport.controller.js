const prisma = require('../config/db');

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

function todayAsDateOnly() {
  return new Date(new Date().toISOString().slice(0, 10));
}

function isNonNegativeInt(value) {
  return Number.isInteger(value) && value >= 0;
}

// Trainee submits their own performance metrics through the self-report link.
// Can submit multiple metrics at once.
async function submitDailyReport(req, res, next) {
  try {
    const traineeId = req.trainee.traineeId;
    const { snapCasesDone, medicalCasesDone, casesCertified, casesPending } = req.body;

    // Validate
    if (
      snapCasesDone === undefined ||
      medicalCasesDone === undefined ||
      casesCertified === undefined ||
      casesPending === undefined
    ) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (
      !Number.isInteger(snapCasesDone) ||
      !Number.isInteger(medicalCasesDone) ||
      !Number.isInteger(casesCertified) ||
      !Number.isInteger(casesPending) ||
      snapCasesDone < 0 ||
      medicalCasesDone < 0 ||
      casesCertified < 0 ||
      casesPending < 0
    ) {
      return res.status(400).json({ error: 'All values must be non-negative integers' });
    }

    const report = await prisma.dailySelfReport.create({
      data: {
        traineeId,
        reportDate: new Date().toISOString().split('T')[0],
        snapCasesDone,
        medicalCasesDone,
        casesCertified,
        casesPending,
      },
    });

    res.status(201).json(report);
  } catch (err) {
    next(err);
  }
}

// A trainee viewing their own recent reports (read-only, their own data only).
async function getMyReportHistory(req, res, next) {
  try {
    const traineeId = req.trainee.traineeId;
    const reports = await prisma.dailySelfReport.findMany({
      where: { traineeId },
      orderBy: { reportDate: 'desc' },
      take: 14,
    });
    res.status(200).json({ reports });
  } catch (err) {
    next(err);
  }
}

// Management viewing a specific trainee's full self-report history.
async function getTraineeReportHistory(req, res, next) {
  try {
    const { traineeId } = req.params;

    const traineeExists = await prisma.trainee.findUnique({ where: { id: traineeId } });
    if (!traineeExists) return res.status(404).json({ error: 'Trainee not found' });

    const reports = await prisma.dailySelfReport.findMany({
      where: { traineeId },
      orderBy: { reportDate: 'desc' },
    });

    res.status(200).json({ reports });
  } catch (err) {
    next(err);
  }
}

// Trainee marks their own course as complete
async function markCourseCompleteAsSelf(req, res, next) {
  try {
    const traineeId = req.trainee.traineeId;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: 'courseId is required' });
    }

    // Verify the trainee has this course assigned
    const completion = await prisma.courseCompletion.findUnique({
      where: { traineeId_courseId: { traineeId, courseId } },
    });

    if (!completion) {
      return res.status(404).json({ error: 'Course not assigned to you' });
    }

    // Mark as complete
    const updated = await prisma.courseCompletion.update({
      where: { traineeId_courseId: { traineeId, courseId } },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      include: {
        course: {
          include: { modules: { orderBy: { order: 'asc' } } },
        },
      },
    });

    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

module.exports = { submitDailyReport, getMyReportHistory, getTraineeReportHistory, getTraineeAssignedCourses, markCourseCompleteAsSelf };

// Get trainees assigned courses
async function getTraineeAssignedCourses(req, res, next) {
  try {
    const traineeId = req.trainee.traineeId;
    
    if (!traineeId) {
      return res.status(400).json({ error: 'Trainee ID not found in token' });
    }

    const completions = await prisma.courseCompletion.findMany({
      where: { traineeId },
      include: {
        course: {
          include: { 
            modules: { 
              orderBy: { order: 'asc' } 
            } 
          },
        },
      },
      orderBy: { recordedAt: 'desc' },
    });

    res.status(200).json({ courseCompletions: completions });
  } catch (err) {
    console.error('Error in getTraineeAssignedCourses:', err.message);
    res.status(500).json({ error: `Failed to load courses: ${err.message}` });
  }
}
