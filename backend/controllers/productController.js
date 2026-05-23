/**
 * Product CRUD — farmers create; all browse; farmers update own; admin all.
 */
const Product = require('../models/Product');

const syncAvailability = (doc) => {
  if (doc.quantity <= 0) doc.availabilityStatus = 'out_of_stock';
  else if (doc.quantity < 10) doc.availabilityStatus = 'low_stock';
  else doc.availabilityStatus = 'in_stock';
};

exports.create = async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      farmer:
        req.user.role === 'farmer'
          ? req.user.id
          : req.body.farmer || null,
    };
    const p = new Product(payload);
    syncAvailability(p);
    await p.save();
    res.status(201).json({ success: true, data: p });
  } catch (e) {
    next(e);
  }
};

exports.list = async (req, res, next) => {
  try {
    const { q, category, minPrice, maxPrice, status, farmerId } = req.query;
    const filter = {};
    if (q) {
      filter.$or = [
        { productName: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') },
      ];
    }
    if (category) filter.category = new RegExp(`^${category}$`, 'i');
    if (status) filter.availabilityStatus = status;
    if (farmerId) filter.farmer = farmerId;
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }
    const data = await Product.find(filter).populate('farmer', 'name email').sort({ updatedAt: -1 });
    res.json({ success: true, count: data.length, data });
  } catch (e) {
    next(e);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const p = await Product.findById(req.params.id).populate('farmer', 'name email');
    if (!p) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: p });
  } catch (e) {
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    let p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ success: false, message: 'Product not found' });
    const isFarmerOwner = req.user.role === 'farmer' && p.farmer && p.farmer.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!(isFarmerOwner || isAdmin)) {
      return res.status(403).json({ success: false, message: 'Not allowed to update this product' });
    }
    Object.assign(p, req.body);
    if (req.user.role === 'farmer') p.farmer = req.user.id;
    syncAvailability(p);
    await p.save();
    res.json({ success: true, data: p });
  } catch (e) {
    next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ success: false, message: 'Product not found' });
    const isFarmerOwner = req.user.role === 'farmer' && p.farmer && p.farmer.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!(isFarmerOwner || isAdmin)) {
      return res.status(403).json({ success: false, message: 'Not allowed to delete this product' });
    }
    await p.deleteOne();
    res.json({ success: true, message: 'Product deleted' });
  } catch (e) {
    next(e);
  }
};
