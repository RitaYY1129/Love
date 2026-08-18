const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
  completePlan
} = require('../controllers/planController');

router.get('/', authenticate, getPlans);
router.post('/', authenticate, createPlan);
router.put('/:id', authenticate, updatePlan);
router.delete('/:id', authenticate, deletePlan);
router.post('/:id/complete', authenticate, completePlan);

module.exports = router;