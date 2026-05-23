/**
 * Review routes — public list for authenticated app users.
 */
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

router.get('/product/:productId/average', protect, ctrl.averageForProduct);
router.get('/admin/all', protect, authorize('admin'), ctrl.listAll);
router.get('/', protect, ctrl.list);
router.post('/', protect, ctrl.create);
router.put('/:id', protect, ctrl.update);
router.delete('/:id', protect, ctrl.removeOwn);
router.patch('/:id/remove', protect, authorize('admin'), ctrl.adminRemove);

module.exports = router;
