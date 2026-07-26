const prisma = require('../config/db');

// Get all skill areas (for dropdown in trainee self-report)
async function getSkillAreas(req, res, next) {
  try {
    const areas = await prisma.skillArea.findMany({
      where: { enabled: true },
      orderBy: { order: 'asc' },
      select: { id: true, name: true, label: true },
    });

    res.json(areas);
  } catch (err) {
    next(err);
  }
}

// Get all skill areas including disabled (admin only)
async function getAllSkillAreas(req, res, next) {
  try {
    const areas = await prisma.skillArea.findMany({
      orderBy: { order: 'asc' },
    });

    res.json(areas);
  } catch (err) {
    next(err);
  }
}

// Update skill area (admin only)
async function updateSkillArea(req, res, next) {
  try {
    const { id } = req.params;
    const { label, enabled, order } = req.body;

    const updated = await prisma.skillArea.update({
      where: { id },
      data: {
        ...(label && { label }),
        ...(typeof enabled === 'boolean' && { enabled }),
        ...(typeof order === 'number' && { order }),
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// Add new skill area (admin only)
async function createSkillArea(req, res, next) {
  try {
    const { name, label, order } = req.body;

    if (!name || !label) {
      return res.status(400).json({ error: 'name and label are required' });
    }

    const created = await prisma.skillArea.create({
      data: {
        name,
        label,
        order: order || 0,
        enabled: true,
      },
    });

    res.json(created);
  } catch (err) {
    // Check if it's a unique constraint error
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'A skill area with this name already exists. Use a different name.' });
    }
    next(err);
  }
}

// Delete skill area (admin only)
async function deleteSkillArea(req, res, next) {
  try {
    const { id } = req.params;

    await prisma.skillArea.delete({
      where: { id },
    });

    res.json({ message: 'Skill area deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSkillAreas,
  getAllSkillAreas,
  updateSkillArea,
  createSkillArea,
  deleteSkillArea,
};
