/**
 * Delivery assignment for an order — agent and route info.
 */
const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    deliveryAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    agentName: { type: String, default: '' },
    deliveryStatus: {
      type: String,
      enum: ['assigned', 'picked_up', 'in_transit', 'delivered', 'failed'],
      default: 'assigned',
    },
    route: { type: String, default: '' },
    scheduledDate: { type: Date },
    deliveryDate: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Delivery', deliverySchema);
