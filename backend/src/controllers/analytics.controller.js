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
    const CERT_BAR = 70;

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

    // Single query for active trainees, single query for their metrics.
    const trainees = await prisma.trainee.findMany({
      where: { archivedAt: null },
      select: { id: true, name: true },
    });

    const metrics = await prisma.performanceMetric.findMany({
      where: { trainee: { archivedAt: null } },
      select: { traineeId: true, category: true, score: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    // Latest score per (trainee, category). Rows arrive newest-first, so the
    // first one seen for a key is the latest. Done in JS because Prisma's
    // `distinct` + multi-key `orderBy` does not reliably give the latest row.
    const latest = new Map();
    for (const m of metrics) {
      const key = m.traineeId + '|' + m.category;
      if (!latest.has(key)) latest.set(key, m);
    }
    const latestScores = Array.from(latest.values());

    // Per-category rollup, using the field names the UI reads.
    const bottlenecks = categories
      .map((category) => {
        const scored = latestScores.filter((s) => s.category === category);
        const total = scored.length;
        const below70Count = scored.filter((s) => s.score < CERT_BAR).length;
        const avgScore = total > 0
          ? Math.round(scored.reduce((sum, s) => sum + s.score, 0) / total)
          : 0;

        return {
          category,
          label: formatCategoryLabel(category),
          below70Count,
          total,
          percentageBelow70: total > 0 ? Math.round((below70Count / total) * 100) : 0,
          avgScore,
        };
      })
      .sort((a, b) => b.percentageBelow70 - a.percentageBelow70);

    // Per-trainee rollup. The UI renders traineeId, traineeName, count and
    // strugglingCategories, so all four must be present.
    const nameById = new Map(trainees.map((t) => [t.id, t.name]));
    const struggling = new Map();
    for (const s of latestScores) {
      if (s.score >= CERT_BAR) continue;
      if (!struggling.has(s.traineeId)) struggling.set(s.traineeId, []);
      struggling.get(s.traineeId).push(formatCategoryLabel(s.category));
    }

    const atRiskTrainees = Array.from(struggling.entries())
      .map(([traineeId, cats]) => ({
        traineeId,
        traineeName: nameById.get(traineeId) || 'Unknown',
        count: cats.length,
        strugglingCategories: cats.sort(),
      }))
      .sort((a, b) => b.count - a.count);

    res.json({
      bottlenecks,
      totalTrainees: trainees.length,
      atRiskTrainees,
    });
  } catch (err) {
    next(err);
  }
}

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
        helpNeededAreaId: { not: null },
        reportDate: { gte: thirtyDaysAgo },
      },
      select: { 
        helpNeededAreaId: true,
        helpNeededArea: { select: { label: true } }
      },
    });

    // Count by area ID
    const areaMap = {};
    reports.forEach((r) => {
      if (r.helpNeededAreaId) {
        areaMap[r.helpNeededAreaId] = (areaMap[r.helpNeededAreaId] || 0) + 1;
      }
    });

    // Format response
    const helpAreaData = Object.entries(areaMap).map(([areaId, count]) => {
      const report = reports.find(r => r.helpNeededAreaId === areaId);
      const label = report?.helpNeededArea?.label || 'Unknown';
      return {
        areaId,
        label,
        count,
      };
    });

    // Sort by count descending
    helpAreaData.sort((a, b) => b.count - a.count);

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
