const express = require('express');
const { login, register, getSetupStatus, verifySelfReportToken } = require('../controllers/auth.controller');

const router = express.Router();

router.get('/setup-status', getSetupStatus);
router.post('/register', register);
router.post('/login', login);
router.post('/verify-self-report-token', verifySelfReportToken);

module.exports = router;
