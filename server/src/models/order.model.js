import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order_number: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "cancel_request",
      ],
      default: "pending",
    },
    items: [
      {
        product_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        // Hardcoded product data - Lưu thông tin sản phẩm tại thời điểm đặt hàng
        product_name: {
          type: String,
          required: true,
        },
        product_slug: {
          type: String,
        },
        product_image: {
          type: String, // URL ảnh chính
        },
        product_description: {
          type: String,
        },
        category_name: {
          type: String,
        },
        category_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
        },
        // Pricing info
        quantity: { 
          type: Number, 
          required: true,
          min: 1 
        },
        price: { 
          type: Number, 
          required: true,
          min: 0
        },
        sale_price: { 
          type: Number,
          default: 0,
          min: 0
        },
        original_price: { 
          type: Number, // Giá gốc trước khi giảm
        },
        total: { 
          type: Number, 
          required: true,
          min: 0
        },
        // Additional product info
        sku: {
          type: String,
        },
        weight: {
          type: Number, // Khối lượng (gram)
        },
        unit: {
          type: String, // Đơn vị: kg, gói, hộp...
        },
        // Variant info (nếu có)
        variant: {
          size: String,
          color: String,
          other_attributes: mongoose.Schema.Types.Mixed,
        },
        // Discount info
        discount_percent: {
          type: Number,
          default: 0,
        },
        discount_amount: {
          type: Number,
          default: 0,
        },
        // Product status at order time
        was_on_sale: {
          type: Boolean,
          default: false,
        },
        was_featured: {
          type: Boolean,
          default: false,
        },
        // Hometown origin (nếu là đặc sản)
        hometown_origin: {
          province: String,
          district: String,
        },
        // Metadata
        created_at: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
    },
    total_amount: {
      type: Number,
      required: true,
    },
    shipping_fee: {
      type: Number,
      default: 0,
    },
    freeship_value: {
      type: Number,
      default: 0,
    },
    discount_value: {
      type: Number,
      default: 0,
    },
    payment_method: {
      type: String,
      enum: ["cod", "bank_transfer", "vnpay", "momo", "zalopay"],
    },
    payment_status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    shipping_info: {
      name: String,
      phone: String,
      address: String,
      province: String,
      district: String,
      ward: String,
    },
    notes: String,
    tracking_number: String,
    cancel_reason: String,

    history: [
      {
        status: String,
        date: Date,
        note: String,
        updated_by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],

    confirmed_at: Date,
    shipped_at: Date,
    delivered_at: Date,
    cancelled_at: Date,
    payment_date: Date,
    cancel_requested_at: Date,
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Indexes
orderSchema.index({ user_id: 1, status: 1 });
orderSchema.index({ order_number: 1 });
orderSchema.index({ created_at: -1 });
orderSchema.index({ status: 1, created_at: 1 });
orderSchema.index({ "items.product_id": 1 });

// Virtual để check xem product còn tồn tại không
orderSchema.virtual("items.product_exists").get(function () {
  return this.items.map(async (item) => {
    const Product = mongoose.model("Product");
    return await Product.exists({ _id: item.product_id });
  });
});

export default mongoose.model("Order", orderSchema);