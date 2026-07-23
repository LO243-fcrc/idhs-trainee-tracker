const prisma = require('../config/db');

// Get daily report submission rate analytics
async function getSubmissionRateAnalytics(req, res, next) {
  try {
    // Get all active trainees
    const trainees = await prisma.trainee.findMany({
      where: { archivedAt: null },
      select: { id: true, name: true },
    });

    // For each trainee, get their report submission stats
    const submissionData = await Promise.all(
      trainees.map(async (trainee) => {
        // Get all reports for this trainee (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const totalDaysInPeriod = 30;
        const reports = await prisma.dailySelfReport.count({
          where: {
            traineeId: trainee.id,
            reportDate: { gte: thirtyDaysAgo },
          },
        });

        const submissionRate = Math.round((reports / totalDaysInPeriod) * 100);

        // Get days without report
        const lastReport = await prisma.dailySelfReport.findFirst({
          where: { traineeId: trainee.id },
          orderBy: { reportDate: 'desc' },
          select: { reportDate: true },
        });

        const daysSinceLastReport = lastReport
          ? Math.floor((new Date() - new Date(lastReport.reportDate)) / (1000 * 60 * 60 * 24))
          : null;

        return {
          traineeId: trainee.id,
          traineeName: trainee.name,
          submissionRate,
          reportsInLast30Days: reports,
          daysSinceLastReport,
          status: daysSinceLastReport === null ? 'NEVER' : daysSinceLastReport > 3 ? 'OVERDUE' : 'ON_TRACK',
        };
      })
    );

    // Calculate system-wide stats
    const totalTrainees = submissionData.length;
    const avgSubmissionRate = Math.round(submissionData.reduce((sum, t) => sum + t.submissionRate, 0) / totalTrainees);
    const traineesOnTrack = submissionData.filter((t) => t.status === 'ON_TRACK').length;
    const traineesOverdue = submissionData.filter((t) => t.status === 'OVERDUE').length;
    const traineesNeverReported = submissionData.filter((t) => t.status === 'NEVER').length;

    res.json({
      systemStats: {
        totalTrainees,
        avgSubmissionRate,
        traineesOnTrack,
        traineesOverdue,
        traineesNeverReported,
      },
      trainees: submissionData.sort((a, b) => a.submissionRate - b.submissionRate),
    });
  } catch (err) {
    next(err);
  }
}

// Get bottleneck analysis (which categories trainees struggle with)
async function getBottleneckAnalysis(req, res, next) {
  try {
    // Get all metric categories
    const categories = [
      'POLICY_EFFICIENCY',
      'IES_EFFICIENCY',
      'CASE_COMMENTS_QUALITY',
      'INTERVIEWING_IN_PERSON',
      'INTERVIEWING_PHONE',
      'TIMELINESS',
      'ELIGIBILITY_BENEFIT_ACCURACY',
      'VERIFICATION_THOROUGHNESS',
      'NOTICE_PROCEDURAL_ACCURACY',
      'DATA_ENTRY_ACCURACY',
    ];

    // Get certification bar (70%)
    const certificationBar = 70;

    // For each category, count trainees below 70%
    const bottleneckData = await Promise.all(
      categories.map(async (category) => {
        // Get latest scores for each trainee in this category
        const scores = await prisma.performanceMetric.findMany({
          where: {
            category: category,
            trainee: { archivedAt: null },
          },
          select: {
            traineeId: true,
            score: true,
            createdAt: true,
          },
          orderBy: [{ traineeId: 'asc' }, { createdAt: 'desc' }],
          distinct: ['traineeId'],
        });

        const belowBar = scores.filter((s) => s.score < certificationBar).length;
        const totalScored = scores.length;
        const avgScore = totalScored > 0 ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / totalScored) : 0;

        return {
          category,
          categoryLabel: formatCategoryLabel(category),
          traineesBelow70: belowBar,
          totalTraineesScored: totalScored,
          percentageBelow: totalScored > 0 ? Math.round((belowBar / totalScored) * 100) : 0,
          avgScore,
        };
      })
    );

    // Sort by percentage below 70% (highest bottleneck first)
    const sorted = bottleneckData.sort((a, b) => b.percentageBelow - a.percentageBelow);

    res.json(sorted);
  } catch (err) {
    next(err);
  }
}

// Get daily report submission timeline (trend over 30 days)
async function getSubmissionTimeline(req, res, next) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const reports = await prisma.dailySelfReport.findMany({
      where: {
        reportDate: { gte: thirtyDaysAgo },
      },
      select: { reportDate: true },
      orderBy: { reportDate: 'asc' },
    });

    // Group by date and count
    const dateMap = {};
    reports.forEach((r) => {
      const dateKey = new Date(r.reportDate).toISOString().split('T')[0];
      dateMap[dateKey] = (dateMap[dateKey] || 0) + 1;
    });

    const timeline = Object.entries(dateMap).map(([date, count]) => ({ date, count }));

    res.json(timeline);
  } catch (err) {
    next(err);
  }
}

// Get help area requests (which areas trainees most frequently flag)
async function getHelpAreaRequests(req, res, next) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get reports with help area in last 30 days
    const reports = await prisma.dailySelfReport.findMany({
      where: {
        helpNeededCategory: { not: null },
        reportDate: { gte: thirtyDaysAgo },
      },
      select: { helpNeededCategory: true },
    });

    // Count by category
    const categoryMap = {};
    reports.forEach((r) => {
      if (r.helpNeededCategory) {
        categoryMap[r.helpNeededCategory] = (categoryMap[r.helpNeededCategory] || 0) + 1;
      }
    });

    // Get skill area labels
    const skillAreas = await prisma.skillArea.findMany();
    const skillAreaMap = Object.fromEntries(skillAreas.map((sa) => [sa.name, sa.label]));

    // Format response
    const helpAreaData = Object.entries(categoryMap).map(([categoryId, count]) => {
      const skillArea = skillAreas.find((sa) => sa.id === categoryId);
      return {
        areaId: categoryId,
        areaLabel: skillArea?.label || categoryId,
        requestCount: count,
      };
    });

    // Sort by request count
    helpAreaData.sort((a, b) => b.requestCount - a.requestCount);

    res.json(helpAreaData);
  } catch (err) {
    next(err);
  }
}

function formatCategoryLabel(category) {
  const labels = {
    POLICY_EFFICIENCY: 'Policy Efficiency',
    IES_EFFICIENCY: 'IES Efficiency',
    CASE_COMMENTS_QUALITY: 'Case Comments Quality',
    INTERVIEWING_IN_PERSON: 'Interviewing (In-Person)',
    INTERVIEWING_PHONE: 'Interviewing (Phone)',
    TIMELINESS: 'Timeliness',
    ELIGIBILITY_BENEFIT_ACCURACY: 'Eligibility & Benefit Accuracy',
    VERIFICATION_THOROUGHNESS: 'Verification Thoroughness',
    NOTICE_PROCEDURAL_ACCURACY: 'Notice & Procedural Accuracy',
    DATA_ENTRY_ACCURACY: 'Data Entry Accuracy',
  };
  return labels[category] || category;
}

module.exports = {
  getSubmissionRateAnalytics,
  getBottleneckAnalysis,
  getSubmissionTimeline,
  getHelpAreaRequests,
};
