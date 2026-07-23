const prisma = require('../config/db');

const CASE_TYPES = ['MEDICAL', 'SNAP'];
const CASE_ACTION_TYPES = ['INTAKE', 'CHANGE', 'ADD_MEMBER', 'ADD_PROGRAM', 'REDETERMINATION'];
const REVIEW_OUTCOMES = ['CERTIFIED', 'RETURNED_FOR_CORRECTIONS'];

// Logs a manager's second-party review outcome. Never references a specific
// client or case - only the case type, optionally the case action, and the
// outcome. That's deliberate: this app tracks trainee performance, not
// client records.
async function recordSecondPartyReview(req, res, next) {
  try {
    const { traineeId } = req.params;
    const { caseType, caseActionType, outcome, notes } = req.body;

    if (!CASE_TYPES.includes(caseType)) {
      return res.status(400).json({ error: 'Invalid case type' });
    }
    if (!REVIEW_OUTCOMES.includes(outcome)) {
      return res.status(400).json({ error: 'Invalid review outcome' });
    }
    if (caseActionType !== undefined && caseActionType !== null && !CASE_ACTION_TYPES.includes(caseActionType)) {
      return res.status(400).json({ error: 'Invalid case action type' });
    }

    const traineeExists = await prisma.trainee.findUnique({ where: { id: traineeId } });
    if (!traineeExists) return res.status(404).json({ error: 'Trainee not found' });

    const review = await prisma.secondPartyReview.create({
      data: {
        traineeId,
        caseType,
        caseActionType: caseActionType || null,
        outcome,
        reviewedById: req.user.userId,
        notes: notes || null,
      },
    });

    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
}

// Full review history for one trainee, newest first.
async function getReviewHistory(req, res, next) {
  try {
    const { traineeId } = req.params;

    const traineeExists = await prisma.trainee.findUnique({ where: { id: traineeId } });
    if (!traineeExists) return res.status(404).json({ error: 'Trainee not found' });

    const reviews = await prisma.secondPartyReview.findMany({
      where: { traineeId },
      include: { reviewedBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ reviews });
  } catch (err) {
    next(err);
  }
}

module.exports = { recordSecondPartyReview, getReviewHistory };
