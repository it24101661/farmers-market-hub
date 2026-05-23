/**
 * Payments — record, update status; link to order.
 */
const Payment = require('../models/Payment');
const Order = require('../models/Order');

exports.create = async (req, res, next) => {
  try {
    const { order: orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (
      req.user.role === 'customer' &&
      order.customer.toString() !== req.user.id
    ) {
      return res.status(403).json({ success: false, message: 'Not your order' });
    }
    const pay = await Payment.create({
      ...req.body,
      order: order._id,
      orderIdDisplay: order._id.toString(),
      paymentAmount: req.body.paymentAmount ?? order.totalAmount,
    });
    res.status(201).json({ success: true, data: pay });
  } catch (e) {
    next(e);
  }
};

exports.list = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.order) filter.order = req.query.order;
    if (req.query.status) filter.paymentStatus = req.query.status;
    let q = Payment.find(filter).sort({ paymentDate: -1 });
    if (req.user.role === 'customer') {
      const orders = await Order.find({ customer: req.user.id }).select('_id');
      const ids = orders.map((o) => o._id);
      q = Payment.find({ order: { $in: ids } }).sort({ paymentDate: -1 });
    }
    const data = await q;
    res.json({ success: true, count: data.length, data });
  } catch (e) {
    next(e);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const pay = await Payment.findById(req.params.id);
    if (!pay) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, data: pay });
  } catch (e) {
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const pay = await Payment.findById(req.params.id);
    if (!pay) return res.status(404).json({ success: false, message: 'Payment not found' });
    Object.assign(pay, req.body);
    if (req.body.paymentDate) pay.paymentDate = new Date(req.body.paymentDate);
    await pay.save();
    res.json({ success: true, data: pay });
  } catch (e) {
    next(e);
  }
};

exports.cancel = async (req, res, next) => {
  try {
    const pay = await Payment.findById(req.params.id);
    if (!pay) return res.status(404).json({ success: false, message: 'Payment not found' });
    if (req.user.role === 'customer') {
      const order = await Order.findById(pay.order);
      if (!order || order.customer.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Not your payment' });
      }
    }
    pay.paymentStatus = 'cancelled';
    await pay.save();
    res.json({ success: true, data: pay });
  } catch (e) {
    next(e);
  }
};
