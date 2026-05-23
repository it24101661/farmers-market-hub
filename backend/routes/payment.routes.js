/**
 * Payment routes — customers (own orders) + admin.
 */
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', authorize('customer', 'admin'), ctrl.create);
router.put('/:id', authorize('admin'), ctrl.update);
router.patch('/:id/cancel', authorize('admin', 'customer'), ctrl.cancel);

module.exports = router;
