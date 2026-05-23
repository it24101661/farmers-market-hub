/**
 * Delivery routes — admin assigns; agents update.
 */
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/deliveryController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Only admins see all routes; delivery agents see their assigned jobs
router.get('/', authorize('admin', 'delivery'), ctrl.list);
router.get('/:id', authorize('admin', 'delivery'), ctrl.getById);
router.post('/', authorize('admin'), ctrl.create);
router.put('/:id', authorize('admin', 'delivery'), ctrl.update);
router.delete('/:id', authorize('admin'), ctrl.remove);

module.exports = router;
