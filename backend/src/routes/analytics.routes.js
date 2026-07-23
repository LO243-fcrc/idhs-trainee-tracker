const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  getSubmissionRateAnalytics,
  getBottleneckAnalytics,
} = require('../controllers/analytics.controller');

const router = express.Router();

router.use(requireAuth);

router.get('/submission-rate', getSubmissionRateAnalytics);
router.get('/bottleneck', getBottleneckAnalytics);

module.exports = router;
