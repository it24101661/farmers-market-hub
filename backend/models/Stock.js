/**
 * Farmer stock — harvested vegetables tracked per farmer.
 */
const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    farmerName: { type: String, required: true, trim: true },
    vegetableName: { type: String, required: true, trim: true },
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    marketPrice: { type: Number, required: true, min: 0 },
    availability: {
      type: String,
      enum: ['available', 'unavailable'],
      default: 'available',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Stock', stockSchema);
