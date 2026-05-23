/**
 * Admin reports — aggregates + PDF / JSON export.
 */
const PDFDocument = require('pdfkit');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
async function buildReportPayload() {
  const totalSalesAgg = await Order.aggregate([
    { $match: { orderStatus: { $nin: ['rejected', 'cancelled'] } } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
  ]);
  const totalSales = totalSalesAgg[0]?.total || 0;

  const activeUsers = await User.countDocuments({ isActive: true });
  const topVegetablesAgg = await Order.aggregate([
    { $match: {} },
    { $unwind: '$orderedItems' },
    {
      $group: {
        _id: '$orderedItems.name',
        qty: { $sum: '$orderedItems.quantity' },
        revenue: { $sum: { $multiply: ['$orderedItems.quantity', '$orderedItems.unitPrice'] } },
      },
    },
    { $sort: { qty: -1 } },
    { $limit: 10 },
  ]);

  const topFarmersAgg = await Product.aggregate([
    {
      $group: {
        _id: '$farmer',
        products: { $sum: 1 },
        avgPrice: { $avg: '$price' },
      },
    },
    { $limit: 20 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'farmerDoc',
      },
    },
    { $unwind: { path: '$farmerDoc', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        farmerId: '$_id',
        farmerName: '$farmerDoc.name',
        productCount: '$products',
        avgPrice: 1,
      },
    },
    { $sort: { productCount: -1 } },
    { $limit: 10 },
  ]);

  const orderCount = await Order.countDocuments();

  return {
    generatedAt: new Date().toISOString(),
    totalSales,
    orderCount,
    activeUsers,
    topSellingVegetables: topVegetablesAgg.map((r) => ({
      name: r._id,
      quantitySold: r.qty,
      revenue: r.revenue,
    })),
    topFarmers: topFarmersAgg,
  };
}

exports.dashboardJson = async (req, res, next) => {
  try {
    const data = await buildReportPayload();
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

exports.dashboardPdf = async (req, res, next) => {
  try {
    const payload = await buildReportPayload();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=farmers-market-report.pdf');

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    doc.fontSize(18).fillColor('#2e7d32').text('Farmers Market Hub — Reports', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).fillColor('#333').text(`Generated: ${payload.generatedAt}`);
    doc.moveDown(0.5);
    doc.fontSize(14).fillColor('#1b5e20').text('Summary');
    doc.fontSize(11).fillColor('#000').text(`Total sales (excluding rejected/cancelled): $${payload.totalSales.toFixed(2)}`);
    doc.text(`Total orders: ${payload.orderCount}`);
    doc.text(`Active users: ${payload.activeUsers}`);
    doc.moveDown();

    doc.fontSize(14).fillColor('#1b5e20').text('Top-selling vegetables');
    payload.topSellingVegetables.forEach((v, i) => {
      doc.fontSize(10).fillColor('#000').text(
        `${i + 1}. ${v.name} — qty ${v.quantitySold}, revenue $${Number(v.revenue).toFixed(2)}`
      );
    });
    doc.moveDown();

    doc.fontSize(14).fillColor('#1b5e20').text('Top farmers (by product listings)');
    payload.topFarmers.forEach((f, i) => {
      doc.fontSize(10).fillColor('#000').text(
        `${i + 1}. ${f.farmerName || 'Unknown'} — products ${f.productCount}`
      );
    });

    doc.end();
  } catch (e) {
    next(e);
  }
};

exports.dashboardExportJsonFile = async (req, res, next) => {
  try {
    const payload = await buildReportPayload();
    const body = JSON.stringify(payload, null, 2);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=farmers-market-report.json');
    res.send(body);
  } catch (e) {
    next(e);
  }
};

/** User management for admin */
exports.listUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (e) {
    next(e);
  }
};

exports.toggleUserActive = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = typeof req.body.isActive === 'boolean' ? req.body.isActive : !user.isActive;
    await user.save();
    res.json({
      success: true,
      data: { id: user._id, isActive: user.isActive },
    });
  } catch (e) {
    next(e);
  }
};
