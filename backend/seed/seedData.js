/**
 * Example seed — run: npm run seed (with MONGODB_URI + JWT_SECRET in .env)
 * Clears collections and inserts demo users, products, stock, orders, etc.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Product = require('../models/Product');
const Stock = require('../models/Stock');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Delivery = require('../models/Delivery');
const Review = require('../models/Review');

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Set MONGODB_URI in backend/.env');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('Connected. Clearing demo collections...');

  await Review.deleteMany({});
  await Delivery.deleteMany({});
  await Payment.deleteMany({});
  await Order.deleteMany({});
  await Stock.deleteMany({});
  await Product.deleteMany({});
  await User.deleteMany({});

  const pwd = await bcrypt.hash('password123', 10);

  const [admin, farmer1, farmer2, customer1, agent] = await User.insertMany([
    { name: 'Admin User', email: 'admin@market.com', password: pwd, role: 'admin' },
    { name: 'Green Valley Farm', email: 'farmer1@market.com', password: pwd, role: 'farmer' },
    { name: 'Sunny Acres', email: 'farmer2@market.com', password: pwd, role: 'farmer' },
    { name: 'Taylor Customer', email: 'customer@market.com', password: pwd, role: 'customer' },
    { name: 'Jordan Delivery', email: 'delivery@market.com', password: pwd, role: 'delivery' },
  ]);

  const products = await Product.insertMany([
    {
      productName: 'Organic Tomatoes',
      category: 'Vegetables',
      price: 3.5,
      quantity: 40,
      description: 'Vine ripened cherry tomatoes.',
      image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400',
      availabilityStatus: 'in_stock',
      farmer: farmer1._id,
    },
    {
      productName: 'Fresh Spinach',
      category: 'Leafy Greens',
      price: 2.25,
      quantity: 25,
      description: 'Washed baby spinach.',
      image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400',
      availabilityStatus: 'in_stock',
      farmer: farmer1._id,
    },
    {
      productName: 'Sweet Corn',
      category: 'Vegetables',
      price: 1.75,
      quantity: 8,
      description: 'Local sweet corn — limited supply.',
      image: 'https://images.unsplash.com/photo-1601379760883-1bb497cd432d?w=400',
      availabilityStatus: 'low_stock',
      farmer: farmer2._id,
    },
  ]);

  await Stock.insertMany([
    {
      farmer: farmer1._id,
      farmerName: farmer1.name,
      vegetableName: 'Tomatoes',
      stockQuantity: 50,
      marketPrice: 3.25,
      availability: 'available',
    },
    {
      farmer: farmer2._id,
      farmerName: farmer2.name,
      vegetableName: 'Corn',
      stockQuantity: 20,
      marketPrice: 1.65,
      availability: 'available',
    },
  ]);

  const order = await Order.create({
    customer: customer1._id,
    customerName: customer1.name,
    orderedItems: [
      {
        product: products[0]._id,
        name: products[0].productName,
        quantity: 2,
        unitPrice: products[0].price,
      },
    ],
    totalAmount: 2 * products[0].price,
    orderStatus: 'approved',
  });

  // Keep catalogue quantities in sync with the demo order
  const p0 = await Product.findById(products[0]._id);
  p0.quantity -= 2;
  if (p0.quantity < 10) p0.availabilityStatus = 'low_stock';
  if (p0.quantity <= 0) p0.availabilityStatus = 'out_of_stock';
  await p0.save();

  await Payment.create({
    order: order._id,
    orderIdDisplay: order._id.toString(),
    paymentMethod: 'card',
    paymentAmount: order.totalAmount,
    paymentStatus: 'completed',
  });

  await Delivery.create({
    order: order._id,
    deliveryAgent: agent._id,
    agentName: agent.name,
    deliveryStatus: 'in_transit',
    route: 'Depot → North District',
    scheduledDate: new Date(Date.now() + 86400000),
  });

  await Review.create({
    customer: customer1._id,
    customerName: customer1.name,
    product: products[0]._id,
    vegetableName: products[0].productName,
    rating: 5,
    comment: 'Fantastic tomatoes!',
  });

  console.log('\n✅ Seed complete. Demo accounts (password: password123):');
  console.log('   admin@market.com (admin)');
  console.log('   farmer1@market.com | farmer2@market.com (farmer)');
  console.log('   customer@market.com (customer)');
  console.log('   delivery@market.com (delivery)');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
