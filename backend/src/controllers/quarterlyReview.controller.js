const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// All 10 metric categories
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

// Calculate when the next review is due for a trainee
// Based on employmentStartDate + (reviewNumber * 3 months)
function calculateNextReviewDue(trainee) {
  if (!trainee.employmentStartDate) {
    return null;
  }

  const startDate = new Date(trainee.employmentStartDate);
  
  // Check if reviews exist - if so, next review is 3 months after the highest existing one
  // Otherwise start from employment date + 3 months for 1st review
  
  const nextReviewDate = new Date(startDate);
  nextReviewDate.setMonth(nextReviewDate.getMonth() + 3); // 3-month review
  
  return {
    reviewNumber: 1,
    dueDate: nextReviewDate,
    daysUntilDue: Math.ceil((nextReviewDate - new Date()) / (1000 * 60 * 60 * 24)),
  };
}

// Get latest metric scores for a trainee (auto-populate values for review)
async function getLatestMetricScores(traineeId) {
  const scores = {};
  
  for (const category of METRIC_CATEGORIES) {
    const latestMetric = await prisma.performanceMetric.findFirst({
      where: {
        traineeId,
        category,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Use latest score, or default to 70 if no metrics yet
    scores[category] = latestMetric ? latestMetric.score : 70;
  }
  
  return scores;
}

// Calculate if all scores pass (>= 70)
function calculatePassed(scores) {
  return Object.values(scores).every(score => score >= 70);
}

// Calculate decision based on scores
function calculateDecision(scores) {
  const allPass = Object.values(scores).every(score => score >= 70);
  return allPass ? 'PASS' : 'FAIL';
}

// GET /admin/reviews - List all quarterly reviews
async function listReviews(req, res) {
  try {
    const reviews = await prisma.quarterlyReview.findMany({
      include: {
        trainee: {
          select: { id: true, name: true, employmentStartDate: true },
        },
      },
      orderBy: [
        { traineeId: 'asc' },
        { reviewNumber: 'asc' },
      ],
    });

    res.json({
      reviews,
      count: reviews.length,
    });
  } catch (err) {
    console.error('[QUARTERLY_REVIEW] Error listing reviews:', err);
    res.status(500).json({ error: 'Failed to list reviews' });
  }
}

// GET /admin/reviews/:traineeId - Get reviews for one trainee
async function getTraineeReviews(req, res) {
  try {
    const { traineeId } = req.params;

    const trainee = await prisma.trainee.findUnique({
      where: { id: traineeId },
    });

    if (!trainee) {
      return res.status(404).json({ error: 'Trainee not found' });
    }

    const reviews = await prisma.quarterlyReview.findMany({
      where: { traineeId },
      orderBy: { reviewNumber: 'asc' },
    });

    const nextReviewDue = calculateNextReviewDue(trainee);

    res.json({
      trainee: { id: trainee.id, name: trainee.name },
      reviews,
      nextReviewDue,
    });
  } catch (err) {
    console.error('[QUARTERLY_REVIEW] Error getting trainee reviews:', err);
    res.status(500).json({ error: 'Failed to get reviews' });
  }
}

// POST /admin/reviews - Create new quarterly review (auto-populate scores)
async function createReview(req, res) {
  try {
    const { traineeId, reviewNumber } = req.body;

    // Validation
    if (!traineeId || reviewNumber === undefined) {
      return res.status(400).json({ error: 'traineeId and reviewNumber are required' });
    }

    if (![1, 2, 3, 4].includes(reviewNumber)) {
      return res.status(400).json({ error: 'reviewNumber must be 1, 2, 3, or 4' });
    }

    // Check trainee exists
    const trainee = await prisma.trainee.findUnique({
      where: { id: traineeId },
    });

    if (!trainee) {
      return res.status(404).json({ error: 'Trainee not found' });
    }

    // Check if review already exists for this cycle
    const existingReview = await prisma.quarterlyReview.findUnique({
      where: {
        traineeId_reviewNumber: { traineeId, reviewNumber },
      },
    });

    if (existingReview) {
      return res.status(409).json({ error: `${reviewNumber}-month review already exists for this trainee` });
    }

    // Auto-populate scores from latest metrics
    const autoPopulatedScores = await getLatestMetricScores(traineeId);
    const passed = calculatePassed(autoPopulatedScores);
    const decision = 'PENDING'; // Don't auto-decide, let manager decide

    const review = await prisma.quarterlyReview.create({
      data: {
        traineeId,
        reviewNumber,
        scores: autoPopulatedScores,
        overriddenCategories: null,
        notes: '',
        decision,
        passed,
      },
    });

    console.log(`[QUARTERLY_REVIEW] Created ${reviewNumber}-month review for trainee ${traineeId}`);
    res.status(201).json(review);
  } catch (err) {
    console.error('[QUARTERLY_REVIEW] Error creating review:', err);
    res.status(500).json({ error: 'Failed to create review' });
  }
}

// PATCH /admin/reviews/:reviewId - Edit review
async function updateReview(req, res) {
  try {
    const { reviewId } = req.params;
    const { scores, notes, decision, overriddenCategories, certifiedAt } = req.body;

    // Validation
    if (!scores || typeof scores !== 'object') {
      return res.status(400).json({ error: 'scores object is required' });
    }

    if (!['PASS', 'FAIL', 'PENDING'].includes(decision)) {
      return res.status(400).json({ error: 'decision must be PASS, FAIL, or PENDING' });
    }

    // Validate all categories are present in scores
    const providedCategories = Object.keys(scores);
    const allCategoriesPresent = METRIC_CATEGORIES.every(cat => 
      providedCategories.includes(cat)
    );

    if (!allCategoriesPresent) {
      return res.status(400).json({ error: 'All 10 metric categories required in scores' });
    }

    // Calculate passed status from scores
    const passed = Object.values(scores).every(score => score >= 70);

    // If decision is PASS but scores don't all pass, reject
    if (decision === 'PASS' && !passed) {
      return res.status(400).json({ error: 'Cannot mark PASS when scores have any below 70' });
    }

    // Check review exists
    const review = await prisma.quarterlyReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Build update data
    const updateData = {
      scores,
      notes: notes || '',
      decision,
      passed,
      overriddenCategories: overriddenCategories || null,
    };

    // Only allow certifiedAt for 12-month reviews (reviewNumber = 4)
    if (review.reviewNumber === 4 && decision === 'PASS') {
      updateData.certifiedAt = certifiedAt || new Date();
    }

    const updated = await prisma.quarterlyReview.update({
      where: { id: reviewId },
      data: updateData,
    });

    console.log(`[QUARTERLY_REVIEW] Updated review ${reviewId}: decision=${decision}`);
    res.json(updated);
  } catch (err) {
    console.error('[QUARTERLY_REVIEW] Error updating review:', err);
    res.status(500).json({ error: 'Failed to update review' });
  }
}

// DELETE /admin/reviews/:reviewId - Delete a review
async function deleteReview(req, res) {
  try {
    const { reviewId } = req.params;

    const review = await prisma.quarterlyReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    await prisma.quarterlyReview.delete({
      where: { id: reviewId },
    });

    console.log(`[QUARTERLY_REVIEW] Deleted review ${reviewId}`);
    res.json({ success: true, deletedId: reviewId });
  } catch (err) {
    console.error('[QUARTERLY_REVIEW] Error deleting review:', err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
}

module.exports = {
  listReviews,
  getTraineeReviews,
  createReview,
  updateReview,
  deleteReview,
  calculateNextReviewDue,
  getLatestMetricScores,
};
