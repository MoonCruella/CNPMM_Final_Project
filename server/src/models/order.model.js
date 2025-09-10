import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order_number: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  items: [{
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    total: { type: Number, required: true }
  }],
  total_amount: {
    type: Number,
    required: true
  },
  shipping_fee: {
    type: Number,
    default: 0
  },
  payment_method: {
    type: String,
    enum: ['cod', 'bank_transfer', 'vnpay', 'momo', 'zalopay'],
  },
  shipping_info: {
    name: String,
    phone: String,
    address: String
  },
  notes: String,
  tracking_number: String,
  cancel_reason: String,
  

  confirmed_at: Date,
  shipped_at: Date,
  delivered_at: Date,
  cancelled_at: Date,
  payment_date: Date
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});
orderSchema.index({ user_id: 1, status: 1 });
orderSchema.index({ order_number: 1 });
orderSchema.index({ created_at: -1 });

export default mongoose.model('Order', orderSchema);