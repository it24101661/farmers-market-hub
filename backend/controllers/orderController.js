/**
 * Orders — customers place; farmer/admin approve; status updates broadcast via Socket.IO.
 */
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { notifyOrder } = require('../utils/emitNotify');

const emit = (req, order) => {
  const io = req.app.get('io');
  notifyOrder(io, {
    orderId: order._id.toString(),
    orderStatus: order.orderStatus,
    customerName: order.customerName,
    message: `Order ${order._id} is now ${order.orderStatus}`,
  });
};

exports.place = async (req, res, next) => {
  try {
    if (req.user.role !== 'customer' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only customers place orders' });
    }
    const { orderedItems } = req.body;
    if (!Array.isArray(orderedItems) || orderedItems.length === 0) {
      return res.status(400).json({ success: false, message: 'orderedItems required' });
    }
    let total = 0;
    const items = [];
    for (const row of orderedItems) {
      const prod = await Product.findById(row.productId);
      if (!prod) {
        return res.status(400).json({ success: false, message: `Product not found: ${row.productId}` });
      }
      if (prod.quantity < row.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${prod.productName}`,
        });
      }
      const unitPrice = row.unitPrice ?? prod.price;
      total += unitPrice * row.quantity;
      items.push({
        product: prod._id,
        name: prod.productName,
        quantity: row.quantity,
        unitPrice,
      });
    }
    const user = await User.findById(req.user.id);
    const order = await Order.create({
      customer: req.user.id,
      customerName: user.name,
      orderedItems: items,
      totalAmount: total,
      orderStatus: 'pending',
    });
    for (const row of items) {
      const prod = await Product.findById(row.product);
      prod.quantity -= row.quantity;
      if (prod.quantity <= 0) prod.availabilityStatus = 'out_of_stock';
      else if (prod.quantity < 10) prod.availabilityStatus = 'low_stock';
      else prod.availabilityStatus = 'in_stock';
      await prod.save();
    }
    emit(req, order);
    res.status(201).json({ success: true, data: order });
  } catch (e) {
    next(e);
  }
};

exports.list = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'customer') filter.customer = req.user.id;
    const { status } = req.query;
    if (status) filter.orderStatus = status;
    const data = await Order.find(filter).sort({ orderDate: -1 });
    res.json({ success: true, count: data.length, data });
  } catch (e) {
    next(e);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const mine = req.user.role === 'customer' && order.customer.toString() === req.user.id;
    const staff = ['admin', 'farmer', 'delivery'].includes(req.user.role);
    if (!mine && !staff) return res.status(403).json({ success: false, message: 'Forbidden' });
    res.json({ success: true, data: order });
  } catch (e) {
    next(e);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const allowed = ['farmer', 'admin'];
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Cannot update order status' });
    }
    const { orderStatus } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    order.orderStatus = orderStatus;
    await order.save();
    emit(req, order);
    res.json({ success: true, data: order });
  } catch (e) {
    next(e);
  }
};

exports.track = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const mine = order.customer.toString() === req.user.id;
    const staff = ['admin', 'farmer', 'delivery'].includes(req.user.role);
    if (!mine && !staff) return res.status(403).json({ success: false, message: 'Forbidden' });
    res.json({
      success: true,
      data: {
        id: order._id,
        orderStatus: order.orderStatus,
        orderDate: order.orderDate,
        totalAmount: order.totalAmount,
        orderedItems: order.orderedItems,
      },
    });
  } catch (e) {
    next(e);
  }
};
