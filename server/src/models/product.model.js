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
    favorites: [{
      user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      added_at: {
        type: Date,
        default: Date.now
      }
    }],
    views: [{
      user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      viewed_at: {
        type: Date,
        default: Date.now
      }
    }],
    view_count: {
      type: Number,
      default: 0
    },
    unique_view_count: {
      type: Number,
      default: 0
    },
    purchase_count: {
      type: Number,
      default: 0
    },
    purchase_users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }]

  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Virtual để đếm số lượt yêu thích
productSchema.virtual('favorite_count').get(function() {
  return this.favorites?.length || 0;
});

// Virtual để đếm số người mua
productSchema.virtual('buyer_count').get(function() {
  return this.purchase_users?.length || 0;
});

// Thêm static method để lấy sản phẩm đã xem
productSchema.statics.getViewedByUser = async function(userId, pageNumber = 1, limitNumber = 10) {
  // Chuyển đổi từ string sang ObjectId nếu cần
  const userObjectId = typeof userId === 'string' ? 
    new mongoose.Types.ObjectId(userId) : userId;
  
  // Thực hiện aggregation
  const products = await this.aggregate([
    // Match các sản phẩm có trong lịch sử xem của user
    { $match: { 
      "views.user_id": userObjectId,
      "status": "active"
    }},
    
    // Unwind để làm phẳng mảng views
    { $unwind: "$views" },
    
    // Match lại chỉ lấy view của user hiện tại
    { $match: { "views.user_id": userObjectId }},
    
    // Sort theo thời gian xem gần nhất
    { $sort: { "views.viewed_at": -1 }},
    
    // Group lại để loại bỏ các bản ghi trùng lặp
    { $group: {
      _id: "$_id",
      name: { $first: "$name" },
      description: { $first: "$description" },
      price: { $first: "$price" },
      sale_price: { $first: "$sale_price" },
      images: { $first: "$images" },
      category_id: { $first: "$category_id" },
      slug: { $first: "$slug" },
      status: { $first: "$status" },
      created_at: { $first: "$created_at" },
      updated_at: { $first: "$updated_at" },
      view_count: { $first: "$view_count" },
      unique_view_count: { $first: "$unique_view_count" },
      last_viewed_at: { $first: "$views.viewed_at" }, // Đảm bảo lấy viewed_at từ views
      favorites: { $first: "$favorites" }
    }},
    
    // Sắp xếp theo thời gian xem mới nhất
    { $sort: { "last_viewed_at": -1 }},
    
    // Skip và limit cho phân trang
    { $skip: (pageNumber - 1) * limitNumber },
    { $limit: limitNumber },
    
    // Lookup để populate category
    { $lookup: {
      from: "categories",
      localField: "category_id",
      foreignField: "_id",
      as: "category"
    }},
    
    // Unwind category array
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true }},
    
    // Project để format lại kết quả
    { $project: {
      _id: 1,
      name: 1,
      description: 1,
      price: 1,
      sale_price: 1,
      images: 1,
      slug: 1,
      category_id: {
        _id: "$category._id",
        name: "$category.name"
      },
      status: 1,
      view_count: 1,
      unique_view_count: 1,
      created_at: 1,
      updated_at: 1,
      last_viewed_at: 1, // Đảm bảo last_viewed_at có trong projection
      isFavorited: {
        $cond: {
          if: {
            $gt: [
              { $size: {
                $filter: {
                  input: { $ifNull: ["$favorites", []] },
                  as: "fav",
                  cond: { $eq: ["$$fav.user_id", userObjectId] }
                }
              }},
              0
            ]
          },
          then: true,
          else: false
        }
      }
    }}
  ]);
  
  return products;
};

// Static method để đếm tổng số sản phẩm đã xem
productSchema.statics.countViewedByUser = async function(userId) {
  const userObjectId = typeof userId === 'string' ? 
    new mongoose.Types.ObjectId(userId) : userId;
    
  const result = await this.aggregate([
    { $match: { "views.user_id": userObjectId, "status": "active" }},
    { $group: { _id: null, count: { $sum: 1 }}},
  ]);
  
  return result.length > 0 ? result[0].count : 0;
};

// Đảm bảo virtual fields được đưa vào khi chuyển sang JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });


export default mongoose.model("Product", productSchema);
