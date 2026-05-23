/**
 * Reviews — CRUD + average rating per product.
 */
const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');

exports.create = async (req, res, next) => {
  try {
    if (req.user.role !== 'customer' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only customers may review' });
    }
    const product = await Product.findById(req.body.product);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const doc = await Review.create({
      customer: req.user.id,
      customerName: req.body.customerName || req.user.name,
      product: product._id,
      vegetableName: req.body.vegetableName || product.productName,
      rating: req.body.rating,
      comment: req.body.comment || '',
    });
    res.status(201).json({ success: true, data: doc });
  } catch (e) {
    if (e.code === 11000) {
      return res.status(400).json({ success: false, message: 'You already reviewed this product' });
    }
    next(e);
  }
};

exports.list = async (req, res, next) => {
  try {
    const filter = { removedByAdmin: false };
    if (req.query.product) filter.product = req.query.product;
    const data = await Review.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: data.length, data });
  } catch (e) {
    next(e);
  }
};

/** Admin can list including removed */
exports.listAll = async (req, res, next) => {
  try {
    const data = await Review.find({}).sort({ createdAt: -1 });
    res.json({ success: true, count: data.length, data });
  } catch (e) {
    next(e);
  }
};

exports.averageForProduct = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: 'Invalid product id' });
    }
    const agg = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId), removedByAdmin: false } },
      {
        $group: {
          _id: '$product',
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);
    const result = agg[0] || { avgRating: 0, count: 0 };
    res.json({
      success: true,
      data: {
        productId,
        averageRating: Math.round((result.avgRating || 0) * 10) / 10,
        reviewCount: result.count || 0,
      },
    });
  } catch (e) {
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const r = await Review.findById(req.params.id);
    if (!r) return res.status(404).json({ success: false, message: 'Review not found' });
    if (r.removedByAdmin) {
      return res.status(403).json({ success: false, message: 'Review removed by admin' });
    }
    const own = r.customer.toString() === req.user.id;
    if (!own && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Can only edit your review' });
    }
    Object.assign(r, req.body);
    await r.save();
    res.json({ success: true, data: r });
  } catch (e) {
    next(e);
  }
};

exports.removeOwn = async (req, res, next) => {
  try {
    const r = await Review.findById(req.params.id);
    if (!r) return res.status(404).json({ success: false, message: 'Review not found' });
    if (r.customer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Can only delete your review' });
    }
    await r.deleteOne();
    res.json({ success: true, message: 'Review deleted' });
  } catch (e) {
    next(e);
  }
};

exports.adminRemove = async (req, res, next) => {
  try {
    const r = await Review.findById(req.params.id);
    if (!r) return res.status(404).json({ success: false, message: 'Review not found' });
    r.removedByAdmin = true;
    r.removedReason = req.body.reason || 'Removed by admin';
    await r.save();
    res.json({ success: true, data: r });
  } catch (e) {
    next(e);
  }
};
