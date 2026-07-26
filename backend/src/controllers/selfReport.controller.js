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
  // Get today's date in CENTRAL TIME (Illinois/DFCS)
  // Central Time is UTC-5 (CDT) in summer, UTC-6 (CST) in winter
  // Create UTC date, then subtract 5 hours to get Central Time
  const utcNow = new Date();
  const centralTime = new Date(utcNow.getTime() - (5 * 60 * 60 * 1000)); // UTC-5 for CDT
  
  const year = centralTime.getUTCFullYear();
  const month = String(centralTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(centralTime.getUTCDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;
  
  console.log(`[SELF-REPORT] Central Time (UTC-5) date:`, dateString);
  return new Date(dateString);
}

function isNonNegativeInt(value) {
  return Number.isInteger(value) && value >= 0;
}

// Trainee submits their own performance metrics through the self-report link.
// Can submit multiple metrics at once.
async function submitDailyReport(req, res, next) {
  try {
    const traineeId = req.trainee.traineeId;
    const { snapCasesDone, medicalCasesDone, casesCertified, casesPending, helpNeededAreaId } = req.body;

    console.log(`[SELF-REPORT] Received submission for trainee ${traineeId}:`, { snapCasesDone, medicalCasesDone, casesCertified, casesPending, helpNeededAreaId });

    // Validate
    if (
      snapCasesDone === undefined ||
      medicalCasesDone === undefined ||
      casesCertified === undefined ||
      casesPending === undefined
    ) {
      console.error('[SELF-REPORT] Validation failed: Missing required fields');
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
      console.error('[SELF-REPORT] Validation failed: Invalid values', { snapCasesDone, medicalCasesDone, casesCertified, casesPending });
      return res.status(400).json({ error: 'All values must be non-negative integers' });
    }

    const reportDate = todayAsDateOnly();
    console.log(`[SELF-REPORT] Creating/updating report with reportDate:`, reportDate);

    // Check if a report already exists for today
    const existingReport = await prisma.dailySelfReport.findFirst({
      where: { traineeId, reportDate },
    });

    let report;
    if (existingReport) {
      // Update existing report
      console.log(`[SELF-REPORT] Report exists for today, updating:`, existingReport.id);
      report = await prisma.dailySelfReport.update({
        where: { id: existingReport.id },
        data: {
          snapCasesDone,
          medicalCasesDone,
          casesCertified,
          casesPending,
          ...(helpNeededAreaId && { helpNeededAreaId }),
        },
      });
    } else {
      // Create new report
      report = await prisma.dailySelfReport.create({
        data: {
          traineeId,
          reportDate,
          snapCasesDone,
          medicalCasesDone,
          casesCertified,
          casesPending,
          ...(helpNeededAreaId && { helpNeededAreaId }),
        },
      });
    }

    console.log(`[SELF-REPORT] Report saved successfully:`, report.id);
    res.status(201).json(report);
  } catch (err) {
    console.error('[SELF-REPORT] Error creating report:', err.message, err.code);
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
    const { courseId } = req.params;

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
