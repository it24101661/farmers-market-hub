/**
 * Order routes.
 */
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', authorize('customer', 'admin'), ctrl.place);
router.get('/', ctrl.list);
router.get('/track/:id', ctrl.track);
router.get('/:id', ctrl.getById);
router.patch('/:id/status', authorize('farmer', 'admin'), ctrl.updateStatus);

module.exports = router;
