const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const {
  getTraineesDashboard,
  getTraineeDetail,
  updateTraineeProgress,
  setEmploymentStartDate,
  recordTraineeMetric,
  getTraineeMetricHistory,
  getReports,
  createCourse,
  listCourses,
  deleteCourse,
  updateCourse,
  updateCourseModules,
  assignCourseToTrainee,
  unassignCourseFromTrainee,
  createTrainee,
  updateTrainee,
  setTraineeArchived,
  listTrainees,
  createManagementUser,
  updateManagementUser,
  assignTraineeRelationships,
  issueSelfReportCredentials,
  listManagementUsers,
  deleteManagementUser,
  setUserArchived,
  deleteTrainee,
  getAssignmentHistory,
  changePassword,
} = require('../controllers/admin.controller');
const { recordCaseTypeEvent, getCaseTypeStatus } = require('../controllers/caseType.controller');
const { markCourseCompleted, unmarkCourseCompleted, getTraineeCourseCompletions } = require('../controllers/courseCompletion.controller');
const { recordSecondPartyReview, getReviewHistory } = require('../controllers/review.controller');
const { getTraineeReportHistory } = require('../controllers/selfReport.controller');
const { getHighwayTrainingWeeks, updateHighwayTrainingWeek, setHighwayTrainingDates } = require('../controllers/highwayTraining.controller');

const router = express.Router();

// Every route here requires a logged-in management account. Routes that
// touch account/trainee provisioning or trainer/manager assignment
// additionally require requireAdmin - everything else (day-to-day scoring,
// status updates, viewing) is open to any management account.
router.use(requireAuth);

router.get('/trainees-dashboard', getTraineesDashboard);
router.get('/trainees', listTrainees);

router.post('/trainees', requireAdmin, createTrainee);
router.get('/trainees/:traineeId', getTraineeDetail);
router.patch('/trainees/:id', updateTrainee);
router.patch('/trainees/:traineeId/employment-start-date', setEmploymentStartDate);

router.post('/trainees/:traineeId/metrics', recordTraineeMetric);
router.get('/trainees/:traineeId/metrics/:category/history', getTraineeMetricHistory);

router.post('/trainees/:traineeId/case-events', recordCaseTypeEvent);
router.get('/trainees/:traineeId/case-status', getCaseTypeStatus);

router.post('/trainees/:traineeId/reviews', recordSecondPartyReview);
router.get('/trainees/:traineeId/reviews', getReviewHistory);

router.get('/trainees/:traineeId/self-reports', getTraineeReportHistory);

router.get('/highway-training', getHighwayTrainingWeeks);
router.patch('/highway-training/:weekNumber', requireAdmin, updateHighwayTrainingWeek);
router.patch('/trainees/:traineeId/highway-training', setHighwayTrainingDates);

router.get('/reports', getReports);

router.post('/courses', requireAdmin, createCourse);
router.get('/courses', listCourses);
router.delete('/courses/:courseId', requireAdmin, deleteCourse);
router.patch('/courses/:courseId', requireAdmin, updateCourse);
router.put('/courses/:courseId/modules', requireAdmin, updateCourseModules);
router.post('/trainees/:traineeId/assign-course', requireAdmin, assignCourseToTrainee);
router.delete('/trainees/:traineeId/assign-course/:courseId', requireAdmin, unassignCourseFromTrainee);

router.post('/users', requireAdmin, createManagementUser);
router.patch('/users/:userId', requireAdmin, updateManagementUser);
router.get('/users', listManagementUsers);
router.delete('/users/:userId', requireAdmin, deleteManagementUser);

router.patch('/trainees/:traineeId/relationships', requireAdmin, assignTraineeRelationships);
router.post('/trainees/:traineeId/self-report-credentials', requireAdmin, issueSelfReportCredentials);

router.post('/trainees/:traineeId/course-completed', markCourseCompleted);
router.delete('/trainees/:traineeId/courses/:courseId/completed', unmarkCourseCompleted);
router.get('/trainees/:traineeId/course-completions', getTraineeCourseCompletions);

router.get('/trainees/:traineeId/assignment-history', requireAdmin, getAssignmentHistory);

router.delete('/trainees/:traineeId', requireAdmin, deleteTrainee);
router.patch('/users/:userId/archive', requireAdmin, setUserArchived);

router.patch('/users/change-password', changePassword);

module.exports = router;
