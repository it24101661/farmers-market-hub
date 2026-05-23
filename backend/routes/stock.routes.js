/**
 * Farmer stock routes — farmers + admin.
 */
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/stockController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('farmer', 'admin'));

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
