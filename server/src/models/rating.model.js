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
// Index để tối ưu query
commentSchema.index({ product_id: 1, status: 1, created_at: -1 });
commentSchema.index({ user_id: 1, status: 1 });

//Method để check rating có nên hiển thị không
commentSchema.methods.isVisible = async function() {
  // Populate user nếu chưa có
  if (!this.populated('user_id')) {
    await this.populate('user_id', 'active');
  }
  
  // Chỉ hiển thị nếu:
  // 1. Status là visible
  // 2. User chưa bị khóa (active = true)
  return this.status === 'visible' && this.user_id?.active === true;
};

// Static method để lấy ratings hiển thị được
commentSchema.statics.findVisibleRatings = async function(filter = {}) {
  return this.find({
    ...filter,
    status: 'visible'
  })
  .populate({
    path: 'user_id',
    select: 'name email avatar active'
  })
  .then(ratings => {
    // Lọc những rating có user active = true
    return ratings.filter(rating => rating.user_id?.active === true);
  });
};
export default mongoose.model("Rating", commentSchema);