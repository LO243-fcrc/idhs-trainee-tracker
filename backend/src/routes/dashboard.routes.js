const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  getOverallMetrics,
  getCompletionByCourse,
  getCompletionByManager,
  getCompletionTimeline,
  getStatusDistribution,
} = require('../controllers/dashboard.controller');

const router = express.Router();

router.use(requireAuth);

router.get('/metrics', getOverallMetrics);
router.get('/by-course', getCompletionByCourse);
router.get('/by-manager', getCompletionByManager);
router.get('/timeline', getCompletionTimeline);
router.get('/status-distribution', getStatusDistribution);

module.exports = router;
