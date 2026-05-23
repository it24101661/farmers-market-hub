/**
 * Delivery assignments — admin assigns agent; agent updates status.
 */
const Delivery = require('../models/Delivery');
const Order = require('../models/Order');
const User = require('../models/User');
const { notifyOrder } = require('../utils/emitNotify');

const emitDelivery = (req, delivery) => {
  const io = req.app.get('io');
  if (io)
    io.emit('delivery:update', {
      deliveryId: delivery._id.toString(),
      order: delivery.order?.toString?.() || delivery.order,
      deliveryStatus: delivery.deliveryStatus,
    });
};

exports.create = async (req, res, next) => {
  try {
    const { order: orderId, deliveryAgent, route, scheduledDate } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    let agentName = '';
    if (deliveryAgent) {
      const agent = await User.findById(deliveryAgent);
      if (agent) agentName = agent.name;
    }
    const d = await Delivery.create({
      order: order._id,
      deliveryAgent: deliveryAgent || null,
      agentName,
      route: route || '',
      scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
      deliveryStatus: 'assigned',
    });
    emitDelivery(req, d);
    res.status(201).json({ success: true, data: d });
  } catch (e) {
    next(e);
  }
};

exports.list = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'delivery') {
      filter.deliveryAgent = req.user.id;
    }
    if (req.query.order) filter.order = req.query.order;
    if (req.query.status) filter.deliveryStatus = req.query.status;
    const data = await Delivery.find(filter)
      .populate('order')
      .populate('deliveryAgent', 'name email')
      .sort({ updatedAt: -1 });
    res.json({ success: true, count: data.length, data });
  } catch (e) {
    next(e);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const d = await Delivery.findById(req.params.id).populate('order');
    if (!d) return res.status(404).json({ success: false, message: 'Delivery not found' });
    if (req.user.role === 'delivery' && d.deliveryAgent?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    res.json({ success: true, data: d });
  } catch (e) {
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const d = await Delivery.findById(req.params.id);
    if (!d) return res.status(404).json({ success: false, message: 'Delivery not found' });
    const isAgent =
      req.user.role === 'delivery' && d.deliveryAgent?.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!(isAgent || isAdmin)) return res.status(403).json({ success: false, message: 'Forbidden' });
    if (req.body.deliveryAgent && isAdmin) {
      const agent = await User.findById(req.body.deliveryAgent);
      if (agent) req.body.agentName = agent.name;
    }
    Object.assign(d, req.body);
    if (req.body.deliveryDate) d.deliveryDate = new Date(req.body.deliveryDate);
    await d.save();
    emitDelivery(req, d);
    res.json({ success: true, data: d });
  } catch (e) {
    next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin only' });
    }
    await Delivery.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Delivery removed' });
  } catch (e) {
    next(e);
  }
};
