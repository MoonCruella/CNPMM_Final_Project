// models/Coupon.js
import mongoose from "mongoose";

const voucherSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    type: { type: String, enum: ["DISCOUNT", "FREESHIP"], required: true },
    discountValue: { type: Number, default: 0 }, // có thể là số % hoặc số tiền
    isPercent: { type: Boolean, default: true }, // true = % , false = số tiền
    maxDiscount: { type: Number }, // với DISCOUNT hoặc FREESHIP
    minOrderValue: { type: Number, default: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
    usageLimit: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export default mongoose.model("Voucher", voucherSchema);
