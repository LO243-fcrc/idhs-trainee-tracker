const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /admin/metrics - List all metric definitions
async function listMetrics(req, res) {
  try {
    const metrics = await prisma.performanceMetricDefinition.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.json({
      metrics,
      count: metrics.length,
    });
  } catch (err) {
    console.error('[METRICS] Error listing metrics:', err);
    res.status(500).json({ error: 'Failed to list metrics' });
  }
}

// POST /admin/metrics - Create a new metric definition
async function createMetric(req, res) {
  try {
    const { key, name, description } = req.body;

    // Validation
    if (!key || !name) {
      return res.status(400).json({ error: 'Key and name are required' });
    }

    // Check for duplicate key
    const existing = await prisma.performanceMetricDefinition.findUnique({
      where: { key },
    });

    if (existing) {
      return res.status(400).json({ error: `Metric with key "${key}" already exists` });
    }

    const metric = await prisma.performanceMetricDefinition.create({
      data: {
        key,
        name,
        description: description || null,
      },
    });

    console.log(`[METRICS] Created new metric: ${key}`);
    res.status(201).json(metric);
  } catch (err) {
    console.error('[METRICS] Error creating metric:', err);
    res.status(500).json({ error: 'Failed to create metric' });
  }
}

// PATCH /admin/metrics/:id - Update a metric definition
async function updateMetric(req, res) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const metric = await prisma.performanceMetricDefinition.update({
      where: { id },
      data: {
        name,
        description: description === undefined ? undefined : description,
      },
    });

    console.log(`[METRICS] Updated metric: ${id}`);
    res.json(metric);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Metric not found' });
    }
    console.error('[METRICS] Error updating metric:', err);
    res.status(500).json({ error: 'Failed to update metric' });
  }
}

// DELETE /admin/metrics/:id - Delete a metric definition
async function deleteMetric(req, res) {
  try {
    const { id } = req.params;

    // Check if any performance scores exist for this metric
    const metric = await prisma.performanceMetricDefinition.findUnique({
      where: { id },
    });

    if (!metric) {
      return res.status(404).json({ error: 'Metric not found' });
    }

    // Note: We could add a check here to prevent deletion if scores exist for this metric
    // For now, we'll allow deletion (which is what the frontend expects in demo mode)

    await prisma.performanceMetricDefinition.delete({
      where: { id },
    });

    console.log(`[METRICS] Deleted metric: ${metric.key}`);
    res.json({ success: true, message: `Deleted metric: ${metric.key}` });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Metric not found' });
    }
    console.error('[METRICS] Error deleting metric:', err);
    res.status(500).json({ error: 'Failed to delete metric' });
  }
}

module.exports = {
  listMetrics,
  createMetric,
  updateMetric,
  deleteMetric,
};
