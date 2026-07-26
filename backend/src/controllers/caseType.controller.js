const prisma = require('../config/db');

const CASE_TYPES = ['MEDICAL', 'SNAP'];
const EVENT_TYPES = [
  'AUTHORIZATION_RECOMMENDED',
  'AUTHORIZATION_APPROVED',
  'REVIEW_INDEPENDENCE_RECOMMENDED',
  'REVIEW_INDEPENDENCE_APPROVED',
];

// Reduces a chronological list of events for ONE case type down to the
// current derived status - nothing is stored directly, it's always read
// off the event log, same philosophy as everything else in this app.
function deriveCaseTypeStatus(events) {
  const sorted = [...events].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  let authorized = false;
  let authorizationRecommendationPending = false;
  let reviewIndependent = false;
  let reviewIndependenceRecommendationPending = false;

  for (const event of sorted) {
    switch (event.eventType) {
      case 'AUTHORIZATION_RECOMMENDED':
        authorizationRecommendationPending = true;
        break;
      case 'AUTHORIZATION_APPROVED':
        authorized = true;
        authorizationRecommendationPending = false;
        break;
      case 'REVIEW_INDEPENDENCE_RECOMMENDED':
        reviewIndependenceRecommendationPending = true;
        break;
      case 'REVIEW_INDEPENDENCE_APPROVED':
        reviewIndependent = true;
        reviewIndependenceRecommendationPending = false;
        break;
    }
  }

  return { authorized, authorizationRecommendationPending, reviewIndependent, reviewIndependenceRecommendationPending };
}

// Records one step (recommend or approve) in either pipeline, for one case
// type. Any management account can record any step - permissions here are
// flat, same as the rest of the app.
async function recordCaseTypeEvent(req, res, next) {
  try {
    const { traineeId } = req.params;
    const { caseType, eventType, notes } = req.body;

    if (!CASE_TYPES.includes(caseType)) {
      return res.status(400).json({ error: 'Invalid case type' });
    }
    if (!EVENT_TYPES.includes(eventType)) {
      return res.status(400).json({ error: 'Invalid event type' });
    }

    const traineeExists = await prisma.trainee.findUnique({ where: { id: traineeId } });
    if (!traineeExists) return res.status(404).json({ error: 'Trainee not found' });

    const event = await prisma.caseTypeEvent.create({
      data: {
        traineeId,
        caseType,
        eventType,
        actingUserId: req.user.userId,
        notes: notes || null,
      },
    });

    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
}

// Current status for both case types, plus each one's event history, so
// the trainee detail page can show status + a record of how it got there.
async function getCaseTypeStatus(req, res, next) {
  try {
    const { traineeId } = req.params;

    const traineeExists = await prisma.trainee.findUnique({ where: { id: traineeId } });
    if (!traineeExists) return res.status(404).json({ error: 'Trainee not found' });

    const events = await prisma.caseTypeEvent.findMany({
      where: { traineeId },
      include: { actingUser: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const result = {};
    for (const caseType of CASE_TYPES) {
      const eventsForType = events.filter((e) => e.caseType === caseType);
      result[caseType] = {
        ...deriveCaseTypeStatus(eventsForType),
        history: eventsForType, // already newest-first
      };
    }

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { recordCaseTypeEvent, getCaseTypeStatus, deriveCaseTypeStatus, CASE_TYPES, EVENT_TYPES };
