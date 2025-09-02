import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

cartItemSchema.index({ user_id: 1, product_id: 1 }, { unique: true });

export default mongoose.model('CartItem', cartItemSchema);