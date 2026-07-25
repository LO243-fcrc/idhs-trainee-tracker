const prisma = require('../config/db');

// Get overall completion metrics
async function getOverallMetrics(req, res, next) {
  try {
    const [totalAssignments, completedAssignments, allCourses, allTrainees] = await Promise.all([
      prisma.courseCompletion.count(),
      prisma.courseCompletion.count({ where: { status: 'COMPLETED' } }),
      prisma.course.count(),
      prisma.trainee.count({ where: { archivedAt: null } }),
    ]);

    const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

    res.json({
      totalAssignments,
      completedAssignments,
      completionRate,
      allCourses,
      activeTrainees: allTrainees,
    });
  } catch (err) {
    next(err);
  }
}

// Get completion breakdown by course
async function getCompletionByCourse(req, res, next) {
  try {
    const courses = await prisma.course.findMany({
      select: { id: true, title: true },
    });

    const courseStats = await Promise.all(
      courses.map(async (course) => {
        const total = await prisma.courseCompletion.count({
          where: { courseId: course.id },
        });
        const completed = await prisma.courseCompletion.count({
          where: { courseId: course.id, status: 'COMPLETED' },
        });
        const inProgress = await prisma.courseCompletion.count({
          where: { courseId: course.id, status: 'IN_PROGRESS' },
        });

        return {
          courseId: course.id,
          courseTitle: course.title,
          total,
          completed,
          inProgress,
          notStarted: total - completed - inProgress,
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
      })
    );

    res.json(courseStats.sort((a, b) => b.completionRate - a.completionRate));
  } catch (err) {
    next(err);
  }
}

// Get completion breakdown by manager
async function getCompletionByManager(req, res, next) {
  try {
    const managers = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'MANAGEMENT'] } },
      select: { id: true, email: true },
    });

    const managerStats = await Promise.all(
      managers.map(async (manager) => {
        const traineesUnderManager = await prisma.trainee.findMany({
          where: {
            OR: [
              { trainerId: manager.id },
              { directManagerId: manager.id },
            ],
            archivedAt: null,
          },
          select: { id: true },
        });

        const traineeIds = traineesUnderManager.map((t) => t.id);

        if (traineeIds.length === 0) {
          return {
            managerId: manager.id,
            managerEmail: manager.email,
            traineesCount: 0,
            totalAssignments: 0,
            completedAssignments: 0,
            completionRate: 0,
          };
        }

        const totalAssignments = await prisma.courseCompletion.count({
          where: { traineeId: { in: traineeIds } },
        });
        const completedAssignments = await prisma.courseCompletion.count({
          where: {
            traineeId: { in: traineeIds },
            status: 'COMPLETED',
          },
        });

        return {
          managerId: manager.id,
          managerEmail: manager.email,
          traineesCount: traineeIds.length,
          totalAssignments,
          completedAssignments,
          completionRate: totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0,
        };
      })
    );

    res.json(managerStats.filter((m) => m.traineesCount > 0).sort((a, b) => b.completionRate - a.completionRate));
  } catch (err) {
    next(err);
  }
}

// Get completion timeline (completions by date)
async function getCompletionTimeline(req, res, next) {
  try {
    const completions = await prisma.courseCompletion.findMany({
      where: { status: 'COMPLETED', completedAt: { not: null } },
      select: { completedAt: true },
      orderBy: { completedAt: 'asc' },
    });

    const dateMap = {};
    completions.forEach((c) => {
      const dateKey = c.completedAt.toISOString().split('T')[0];
      dateMap[dateKey] = (dateMap[dateKey] || 0) + 1;
    });

    const timeline = Object.entries(dateMap)
      .map(([date, count]) => ({ date, count }))
      .slice(-30); // Last 30 days

    res.json(timeline);
  } catch (err) {
    next(err);
  }
}

// Get status distribution (pie chart)
async function getStatusDistribution(req, res, next) {
  try {
    const [notStarted, inProgress, completed] = await Promise.all([
      prisma.courseCompletion.count({ where: { status: 'NOT_STARTED' } }),
      prisma.courseCompletion.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.courseCompletion.count({ where: { status: 'COMPLETED' } }),
    ]);

    res.json({
      notStarted,
      inProgress,
      completed,
      total: notStarted + inProgress + completed,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getOverallMetrics,
  getCompletionByCourse,
  getCompletionByManager,
  getCompletionTimeline,
  getStatusDistribution,
};
