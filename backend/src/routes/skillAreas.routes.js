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

// ADMIN ONLY: All routes below require admin auth
router.get('/admin/all', requireAdmin, getAllSkillAreas);
router.post('/', requireAdmin, createSkillArea);
router.put('/:id', requireAdmin, updateSkillArea);
router.delete('/:id', requireAdmin, deleteSkillArea);

module.exports = router;
