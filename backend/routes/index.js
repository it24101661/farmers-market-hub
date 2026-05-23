/**
 * Main API router — mounts all REST resources under one entry.
 */
const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/products', require('./product.routes'));
router.use('/stocks', require('./stock.routes'));
router.use('/orders', require('./order.routes'));
router.use('/payments', require('./payment.routes'));
router.use('/deliveries', require('./delivery.routes'));
router.use('/reviews', require('./review.routes'));
router.use('/reports', require('./report.routes'));

module.exports = router;
