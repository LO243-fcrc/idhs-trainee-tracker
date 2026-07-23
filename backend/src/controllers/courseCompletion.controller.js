const prisma = require('../config/db');

// Mark a course as completed for a trainee (compliance requirement)
async function markCourseCompleted(req, res, next) {
  try {
    const { traineeId, courseId } = req.body;

    if (!traineeId || !courseId) {
      return res.status(400).json({ error: 'traineeId and courseId are required' });
    }

    // Verify both exist
    const [trainee, course] = await Promise.all([
      prisma.trainee.findUnique({ where: { id: traineeId } }),
      prisma.course.findUnique({ where: { id: courseId } }),
    ]);

    if (!trainee || !course) {
      return res.status(404).json({ error: 'Trainee or course not found' });
    }

    // Create or update the completion record
    const completion = await prisma.courseCompletion.upsert({
      where: { traineeId_courseId: { traineeId, courseId } },
      create: {
        traineeId,
        courseId,
        completedAt: new Date(),
      },
      update: {
        completedAt: new Date(),
        recordedAt: new Date(),
      },
    });

    res.status(200).json(completion);
  } catch (err) {
    next(err);
  }
}

// Mark a course as NOT completed (remove compliance record)
async function unmarkCourseCompleted(req, res, next) {
  try {
    const { traineeId, courseId } = req.params;

    const result = await prisma.courseCompletion.deleteMany({
      where: {
        traineeId,
        courseId,
      },
    });

    res.status(200).json({ deleted: result.count > 0 });
  } catch (err) {
    next(err);
  }
}

// Get all course completions for a trainee
async function getTraineeCourseCompletions(req, res, next) {
  try {
    const { traineeId } = req.params;

    const completions = await prisma.courseCompletion.findMany({
      where: { traineeId },
      include: {
        course: {
          select: { id: true, title: true },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    res.status(200).json(completions);
  } catch (err) {
    next(err);
  }
}

module.exports = { markCourseCompleted, unmarkCourseCompleted, getTraineeCourseCompletions };
