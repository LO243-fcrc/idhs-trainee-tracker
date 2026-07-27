const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  getSubmissionRateAnalytics,
  getBottleneckAnalysis,
  getSubmissionTimeline,
  getHelpAreaRequests,
} = require('../controllers/analytics.controller');

const router = express.Router();

router.use(requireAuth);

router.get('/submission-rate', getSubmissionRateAnalytics);
router.get('/bottleneck', getBottleneckAnalysis);
router.get('/submission-timeline', getSubmissionTimeline);
router.get('/help-areas', getHelpAreaRequests);

module.exports = router;
