/**
 * Farmer stock CRUD — scoped to owning farmer unless admin.
 */
const StockModel = require('../models/Stock');
const User = require('../models/User');

exports.create = async (req, res, next) => {
  try {
    const farmerId = req.user.role === 'farmer' ? req.user.id : req.body.farmer;
    if (!farmerId && req.user.role !== 'farmer') {
      return res.status(400).json({ success: false, message: 'farmer required' });
    }
    const farmerDoc = await User.findById(farmerId || req.user.id);
    const doc = await StockModel.create({
      ...req.body,
      farmer: farmerDoc._id,
      farmerName: req.body.farmerName || farmerDoc.name,
    });
    res.status(201).json({ success: true, data: doc });
  } catch (e) {
    next(e);
  }
};

exports.list = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'farmer') filter.farmer = req.user.id;
    else if (req.query.farmerId) filter.farmer = req.query.farmerId;
    if (req.query.availability) filter.availability = req.query.availability;
    const data = await StockModel.find(filter).sort({ updatedAt: -1 });
    res.json({ success: true, count: data.length, data });
  } catch (e) {
    next(e);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const s = await StockModel.findById(req.params.id);
    if (!s) return res.status(404).json({ success: false, message: 'Stock not found' });
    if (req.user.role === 'farmer' && s.farmer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    res.json({ success: true, data: s });
  } catch (e) {
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const s = await StockModel.findById(req.params.id);
    if (!s) return res.status(404).json({ success: false, message: 'Stock not found' });
    const owns = req.user.role === 'farmer' && s.farmer.toString() === req.user.id;
    const admin = req.user.role === 'admin';
    if (!(owns || admin)) return res.status(403).json({ success: false, message: 'Forbidden' });
    Object.assign(s, req.body);
    if (owns && req.body.farmerName === undefined) s.farmerName = req.user.name;
    await s.save();
    res.json({ success: true, data: s });
  } catch (e) {
    next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const s = await StockModel.findById(req.params.id);
    if (!s) return res.status(404).json({ success: false, message: 'Stock not found' });
    const owns = req.user.role === 'farmer' && s.farmer.toString() === req.user.id;
    const admin = req.user.role === 'admin';
    if (!(owns || admin)) return res.status(403).json({ success: false, message: 'Forbidden' });
    await s.deleteOne();
    res.json({ success: true, message: 'Stock removed' });
  } catch (e) {
    next(e);
  }
};
