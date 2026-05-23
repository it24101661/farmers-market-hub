/**
 * Product routes.
 */
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, ctrl.list);
router.get('/:id', protect, ctrl.getById);
router.post('/', protect, authorize('farmer', 'admin'), ctrl.create);
router.put('/:id', protect, authorize('farmer', 'admin'), ctrl.update);
router.delete('/:id', protect, authorize('farmer', 'admin'), ctrl.remove);

module.exports = router;
