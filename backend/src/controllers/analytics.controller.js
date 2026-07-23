const prisma = require('../config/db');

// Daily Report Submission Rate Analytics
async function getSubmissionRateAnalytics(req, res, next) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get active trainees (not archived)
    const activeTrainees = await prisma.trainee.findMany({
      where: { archivedAt: null },
      select: { id: true, name: true, startDate: true },
    });

    // Get submission dates for each trainee in last 30 days
    const submissions = await prisma.dailySelfReport.findMany({
      where: {
        reportDate: { gte: thirtyDaysAgo.toISOString().split('T')[0] },
      },
      select: { traineeId: true, reportDate: true },
      orderBy: { reportDate: 'asc' },
    });

    const submissionMap = new Map();
    submissions.forEach((sub) => {
      if (!submissionMap.has(sub.traineeId)) {
        submissionMap.set(sub.traineeId, []);
      }
      submissionMap.get(sub.traineeId).push(new Date(sub.reportDate));
    });

    // Calculate metrics per trainee
    const traineeStats = activeTrainees.map((trainee) => {
      const dates = submissionMap.get(trainee.id) || [];
      const daysWorking = Math.floor((new Date() - new Date(trainee.startDate)) / (1000 * 60 * 60 * 24));
      const expectedSubmissions = Math.min(daysWorking, 30); // Last 30 days max
      const actualSubmissions = dates.length;
      const submissionRate = expectedSubmissions > 0 ? Math.round((actualSubmissions / expectedSubmissions) * 100) : 0;

      // Days since last submission
      const lastSubmissionDate = dates.length > 0 ? dates[dates.length - 1] : null;
      const daysSinceLastSubmission = lastSubmissionDate
        ? Math.floor((new Date() - lastSubmissionDate) / (1000 * 60 * 60 * 24))
        : null;

      return {
        traineeId: trainee.id,
        traineeName: trainee.name,
        submissionRate,
        actualSubmissions,
        expectedSubmissions,
        daysSinceLastSubmission,
        lastSubmissionDate,
      };
    });

    // System-wide stats
    const totalSubmissions = submissions.length;
    const totalExpected = activeTrainees.reduce((sum, t) => {
      const daysWorking = Math.floor((new Date() - new Date(t.startDate)) / (1000 * 60 * 60 * 24));
      return sum + Math.min(daysWorking, 30);
    }, 0);
    const overallSubmissionRate = totalExpected > 0 ? Math.round((totalSubmissions / totalExpected) * 100) : 0;

    // At-risk trainees (< 80% submission rate)
    const atRiskCount = traineeStats.filter((t) => t.submissionRate < 80).length;

    // Daily submission trend (last 30 days)
    const dailyTrend = {};
    for (let i = 30; i > 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyTrend[dateStr] = 0;
    }

    submissions.forEach((sub) => {
      const dateStr = sub.reportDate;
      if (dailyTrend.hasOwnProperty(dateStr)) {
        dailyTrend[dateStr]++;
      }
    });

    const trendArray = Object.entries(dailyTrend).map(([date, count]) => ({ date, count }));

    res.json({
      overallSubmissionRate,
      totalSubmissions,
      totalExpected,
      atRiskCount,
      traineeStats: traineeStats.sort((a, b) => a.submissionRate - b.submissionRate),
      dailyTrend: trendArray,
    });
  } catch (err) {
    next(err);
  }
}

// Bottleneck Analysis - which metric categories trainees struggle with
async function getBottleneckAnalytics(req, res, next) {
  try {
    const activeTrainees = await prisma.trainee.findMany({
      where: { archivedAt: null },
      select: { id: true, name: true },
    });

    // Get latest score for each trainee in each category
    const metrics = await prisma.performanceMetric.findMany({
      where: { traineeId: { in: activeTrainees.map((t) => t.id) } },
      select: { traineeId: true, category: true, score: true, scoredAt: true },
      orderBy: [{ traineeId: 'asc' }, { category: 'asc' }, { scoredAt: 'desc' }],
    });

    // Get the latest score per trainee per category
    const latestMetrics = new Map();
    metrics.forEach((m) => {
      const key = `${m.traineeId}-${m.category}`;
      if (!latestMetrics.has(key)) {
        latestMetrics.set(key, m);
      }
    });

    // Calculate stats per category
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

    const bottlenecks = categories.map((category) => {
      const categoryMetrics = Array.from(latestMetrics.values()).filter((m) => m.category === category);

      if (categoryMetrics.length === 0) {
        return {
          category,
          label: categoryToLabel(category),
          below70Count: 0,
          avgScore: 0,
          total: 0,
          percentageBelow70: 0,
        };
      }

      const below70 = categoryMetrics.filter((m) => m.score < 70);
      const avgScore = Math.round(categoryMetrics.reduce((sum, m) => sum + m.score, 0) / categoryMetrics.length);
      const percentageBelow70 = Math.round((below70.length / categoryMetrics.length) * 100);

      return {
        category,
        label: categoryToLabel(category),
        below70Count: below70.length,
        avgScore,
        total: categoryMetrics.length,
        percentageBelow70,
      };
    });

    // Sort by percentage below 70 (descending = biggest bottleneck first)
    const sortedBottlenecks = bottlenecks.sort((a, b) => b.percentageBelow70 - a.percentageBelow70);

    // Get trainees below 70 in any category (at-risk)
    const atRiskTrainees = new Map();
    Array.from(latestMetrics.values()).forEach((m) => {
      if (m.score < 70) {
        if (!atRiskTrainees.has(m.traineeId)) {
          atRiskTrainees.set(m.traineeId, []);
        }
        atRiskTrainees.get(m.traineeId).push(m.category);
      }
    });

    const atRiskList = Array.from(atRiskTrainees.entries()).map(([traineeId, categories]) => {
      const trainee = activeTrainees.find((t) => t.id === traineeId);
      return {
        traineeId,
        traineeName: trainee?.name,
        strugglingCategories: categories.map((cat) => categoryToLabel(cat)),
        count: categories.length,
      };
    });

    res.json({
      bottlenecks: sortedBottlenecks,
      atRiskTrainees: atRiskList.sort((a, b) => b.count - a.count),
      totalTrainees: activeTrainees.length,
    });
  } catch (err) {
    next(err);
  }
}

function categoryToLabel(category) {
  const labels = {
    POLICY_EFFICIENCY: 'Policy Efficiency',
    IES_EFFICIENCY: 'IES Efficiency',
    CASE_COMMENTS_QUALITY: 'Case Comments Quality',
    INTERVIEWING_IN_PERSON: 'Interviewing - In Person',
    INTERVIEWING_PHONE: 'Interviewing - Phone',
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
  getBottleneckAnalytics,
};
