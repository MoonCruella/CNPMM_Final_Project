import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    description: String,
    short_description: String,
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    sale_price: {
      type: Number,
      min: 0,
    },
    stock_quantity: {
      type: Number,
      default: 0,
    },
    sold_quantity: { type: Number, default: 0, min: 0 },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "out_of_stock"],
      default: "active",
    },
    featured: {
      type: Boolean,
      default: false,
    },
    // Đặc sản Phú Yên
    hometown_origin: {
      district: {
        type: String,
        enum: [
          "phu_yen_city",
          "dong_hoa",
          "tuy_an",
          "son_hoa",
          "song_hinh",
          "tay_hoa",
          "phu_hoa",
          "dong_xuan",
          "song_cau",
        ],
      },
      terrain: {
        type: String,
        enum: ["bien", "nui", "dong_bang", "ven_bien"],
      },
    },
    images: [
      {
        image_url: String,
        is_primary: { type: Boolean, default: false },
      },
    ],
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export default mongoose.model("Product", productSchema);
