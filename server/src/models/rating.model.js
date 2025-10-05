import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",   // liên kết tới sản phẩm
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",           // ai comment
    required: true
  },
  content: {
    type: String,
    required: true
  },
  rating: {   
    type: Number,
    min: 1,
    max: 5
  },
  status: {                // để quản lý hiển thị comment
    type: String,
    enum: ["visible", "hidden"],
    default: "visible"
  }
}, {
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
});

export default mongoose.model("Rating", commentSchema);