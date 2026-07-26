const prisma = require('../config/db');

// Get all 10 weeks of Highway Training curriculum
async function getHighwayTrainingWeeks(req, res, next) {
  try {
    const weeks = await prisma.highwayTrainingWeek.findMany({ orderBy: { weekNumber: 'asc' } });
    res.status(200).json({ weeks });
  } catch (err) {
    next(err);
  }
}

// Update a single Highway Training week's content (topic and expectation)
async function updateHighwayTrainingWeek(req, res, next) {
  try {
    const { weekNumber } = req.params;
    const { topic, expectation } = req.body;

    if (!topic || !expectation) {
      return res.status(400).json({ error: 'Topic and expectation are required' });
    }

    const week = await prisma.highwayTrainingWeek.update({
      where: { weekNumber: parseInt(weekNumber, 10) },
      data: { topic: String(topic).trim(), expectation: String(expectation).trim() },
    });

    res.status(200).json(week);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Highway training week not found' });
    }
    next(err);
  }
}

function parseOptionalDate(value) {
  if (value === undefined || value === null || value === '') return { value: null, valid: true };
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? { value: null, valid: false } : { value: parsed, valid: true };
}

// Sets a trainee's Highway Training start/end dates. "Completed" is
// derived elsewhere from whether an end date is present - not stored as
// its own flag, so there's only one source of truth.
async function setHighwayTrainingDates(req, res, next) {
  try {
    const { traineeId } = req.params;
    const { highwayTrainingStartDate, highwayTrainingEndDate } = req.body;

    const start = parseOptionalDate(highwayTrainingStartDate);
    const end = parseOptionalDate(highwayTrainingEndDate);
    if (!start.valid || !end.valid) {
      return res.status(400).json({ error: 'Dates must be valid or null' });
    }

    const traineeExists = await prisma.trainee.findUnique({ where: { id: traineeId } });
    if (!traineeExists) return res.status(404).json({ error: 'Trainee not found' });

    const trainee = await prisma.trainee.update({
      where: { id: traineeId },
      data: { highwayTrainingStartDate: start.value, highwayTrainingEndDate: end.value },
    });

    res.status(200).json({
      id: trainee.id,
      highwayTrainingStartDate: trainee.highwayTrainingStartDate,
      highwayTrainingEndDate: trainee.highwayTrainingEndDate,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getHighwayTrainingWeeks, updateHighwayTrainingWeek, setHighwayTrainingDates };
