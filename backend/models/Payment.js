/**
 * Payment linked to an order.
 */
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    orderIdDisplay: { type: String }, // human-friendly copy of ObjectId string
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'mobile_wallet', 'bank_transfer'],
      default: 'cash',
    },
    paymentAmount: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'],
      default: 'pending',
    },
    paymentDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
