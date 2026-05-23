/**
 * Product review — customer rating and comment (linked to Product).
 */
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    customerName: { type: String, required: true },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    vegetableName: { type: String, required: true }, // display name — matches UI spec
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
    removedByAdmin: { type: Boolean, default: false },
    removedReason: { type: String, default: '' },
  },
  { timestamps: true }
);

reviewSchema.index({ customer: 1, product: 1 }, { unique: true }); // one review per customer/product

module.exports = mongoose.model('Review', reviewSchema);
