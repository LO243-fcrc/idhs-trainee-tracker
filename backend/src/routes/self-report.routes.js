const express = require('express');
const { requireTraineeAuth } = require('../middleware/auth');
const { submitDailyReport, getMyReportHistory, getTraineeAssignedCourses, markCourseCompleteAsSelf } = require('../controllers/selfReport.controller');

const router = express.Router();

// Every route here requires a trainee's own self-report token - this token
// is scope-checked separately from management auth and can never reach any
// /api/admin/* route.
router.use(requireTraineeAuth);

router.post('/', submitDailyReport);
router.get('/history', getMyReportHistory);
router.get('/courses', getTraineeAssignedCourses);
router.post('/courses/:courseId/complete', markCourseCompleteAsSelf);

module.exports = router;
