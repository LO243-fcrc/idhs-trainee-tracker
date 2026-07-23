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

// Public endpoint: Get enabled skill areas (for trainee dropdown)
router.get('/', getSkillAreas);

// Admin endpoints
router.use(requireAdmin);
router.get('/admin/all', getAllSkillAreas);
router.post('/', createSkillArea);
router.put('/:id', updateSkillArea);
router.delete('/:id', deleteSkillArea);

module.exports = router;
