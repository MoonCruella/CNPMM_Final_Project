import mongoose from "mongoose";

const hometownPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  content: {
    type: String,
    required: true
  },
  excerpt: String,
  featured_image: String,
  author_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['culture', 'food', 'tourism', 'history', 'festival'],
    required: true
  },
  location: {
    district: {
      type: String,
      enum: ['phu_yen_city', 'dong_hoa', 'tuy_an', 'son_hoa', 'song_hinh', 'tay_hoa', 'phu_hoa', 'dong_xuan', 'song_cau']
    },
    specific_place: String
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Kiểm tra model đã tồn tại chưa, nếu rồi thì dùng lại
const HometownPost = mongoose.models.HometownPost || mongoose.model('HometownPost', hometownPostSchema);

export default HometownPost;