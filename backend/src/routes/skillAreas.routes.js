const express = require('express');
const { requireAuth, requireAdmin, requireTraineeAuth } = require('../middleware/auth');
const {
  getSkillAreas,
  getAllSkillAreas,
  updateSkillArea,
  createSkillArea,
  deleteSkillArea,
} = require('../controllers/skillAreas.controller');

const router = express.Router();

// PUBLIC: Get enabled skill areas (for trainee dropdown)
router.get('/', getSkillAreas);

// ADMIN ONLY: All routes below require BOTH auth and admin
router.get('/admin/all', requireAuth, requireAdmin, getAllSkillAreas);
router.post('/', requireAuth, requireAdmin, createSkillArea);
router.put('/:id', requireAuth, requireAdmin, updateSkillArea);
router.delete('/:id', requireAuth, requireAdmin, deleteSkillArea);

module.exports = router;
