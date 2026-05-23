/**
 * Reports & admin user management — admin only.
 */
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', ctrl.dashboardJson);
router.get('/dashboard/pdf', ctrl.dashboardPdf);
router.get('/export/json', ctrl.dashboardExportJsonFile);
router.get('/users', ctrl.listUsers);
router.patch('/users/:id/active', ctrl.toggleUserActive);

module.exports = router;
