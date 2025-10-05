import Rating from "../models/rating.model.js";
import Order from "../models/order.model.js";
import mongoose from "mongoose";
import * as notificationService from '../services/notification.service.js';
/**
 * Tạo rating mới cho sản phẩm
 */
export const createRating = async (req, res) => {
  try {
    const { product_id, content, rating } = req.body;
    const user_id = req.user.userId;

    console.log("Creating rating for user:", user_id, "product:", product_id);

    const purchased = await Order.findOne({
      user_id: new mongoose.Types.ObjectId(user_id),
      status: { $in: ["delivered"] },
      "items.product_id": new mongoose.Types.ObjectId(product_id),
    });

    if (!purchased) {
      return res.status(403).json({
        success: false,
        message: "Bạn cần mua sản phẩm này trước khi đánh giá!",
      });
    }

    // Kiểm tra user đã rating sản phẩm này chưa
    const existingRating = await Rating.findOne({
      product_id,
      user_id,
    });

    if (existingRating) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã đánh giá sản phẩm này rồi!",
      });
    }

    const newRating = await Rating.create({
      product_id,
      user_id,
      content,
      rating,
    });

    const populatedRating = await newRating.populate("user_id", "name email");
    
    await notificationService.notifyNewRating(newRating);

    res.status(201).json({
      success: true,
      message: "Rating created successfully",
      data: { rating: populatedRating },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating rating",
      error: error.message,
    });
  }
};

/**
 * Lấy tất cả rating của 1 sản phẩm (có phân trang)
 */
export const getRatingsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 5 } = req.query;

    const ratings = await Rating.find({
      product_id: productId,
      status: "visible",
    })
      .populate("user_id", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Rating.countDocuments({
      product_id: productId,
      status: "visible",
    });

    // Tính rating trung bình
    const avgRating = await Rating.aggregate([
      { 
        $match: { 
          product_id: new mongoose.Types.ObjectId(productId),
          status: "visible" 
        } 
      },
      { 
        $group: { 
          _id: null, 
          avgRating: { $avg: "$rating" },
          totalRatings: { $sum: 1 }
        } 
      }
    ]);

    res.json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      ratings,
      averageRating: avgRating[0]?.avgRating || 0,
      totalRatings: avgRating[0]?.totalRatings || 0,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching ratings",
      error: error.message,
    });
  }
};

/**
 * Xoá rating (seller hoặc chính chủ)
 */
export const deleteRating = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const isseller = req.user.role === "seller";

    const rating = await Rating.findById(id);
    if (!rating) {
      return res
        .status(404)
        .json({ success: false, message: "Rating not found" });
    }

    if (!isseller && rating.user_id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this rating",
      });
    }

    await rating.deleteOne();

    res.json({ success: true, message: "Rating deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting rating",
      error: error.message,
    });
  }
};

/**
 * Update rating (seller hoặc chính chủ)
 */
export const updateRating = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, rating, status } = req.body; // 👈 thêm status
    const userId = req.user.userId;
    const isSeller = req.user.role === "seller";

    const existingRating = await Rating.findById(id);
    if (!existingRating) {
      return res.status(404).json({ success: false, message: "Rating not found" });
    }

    // Nếu không phải seller/admin => chỉ sửa nội dung & số sao của chính mình
    if (!isSeller && existingRating.user_id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this rating",
      });
    }

    // ✅ Cập nhật các trường cho phép
    if (content !== undefined) existingRating.content = content;
    if (rating !== undefined) existingRating.rating = rating;
    if (status !== undefined && isSeller) existingRating.status = status; // 👈 chỉ seller mới đổi trạng thái

    await existingRating.save();

    const updatedRating = await existingRating.populate("user_id", "name email");

    res.json({
      success: true,
      message: "Rating updated successfully",
      data: { rating: updatedRating },
    });
  } catch (error) {
    console.error("Error updating rating:", error);
    res.status(500).json({
      success: false,
      message: "Error updating rating",
      error: error.message,
    });
  }
};


/**
 * Lấy rating trung bình của sản phẩm
 */
export const getProductAverageRating = async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await Rating.aggregate([
      { 
        $match: { 
          product_id: new mongoose.Types.ObjectId(productId),
          status: "visible" 
        } 
      },
      { 
        $group: { 
          _id: null, 
          avgRating: { $avg: "$rating" },
          totalRatings: { $sum: 1 },
          ratingDistribution: {
            $push: "$rating"
          }
        } 
      }
    ]);

    // Tính phân bố rating (1-5 sao)
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (result[0]?.ratingDistribution) {
      result[0].ratingDistribution.forEach(rating => {
        distribution[rating] = (distribution[rating] || 0) + 1;
      });
    }

    res.json({
      success: true,
      data: {
        averageRating: result[0]?.avgRating || 0,
        totalRatings: result[0]?.totalRatings || 0,
        distribution
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error calculating average rating",
      error: error.message,
    });
  }
};

// Lấy toàn bộ rating (cho seller)
export const getAllRatings = async (req, res) => {
  try {
    const { page = 1, status, searchUser, searchProduct } = req.query;
    const limit = 10;
    const skip = (page - 1) * limit;

    // Tạo điều kiện lọc
    const filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    // Tìm theo tên người dùng hoặc sản phẩm (sau khi populate)
    const ratings = await Rating.find(filter)
      .populate({
        path: "user_id",
        select: "name email",
      })
      .populate({
        path: "product_id",
        select: "name",
      })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    // Nếu cần lọc theo tên người dùng / sản phẩm
    const filtered = ratings.filter((r) => {
      const matchUser =
        !searchUser ||
        r.user_id?.name?.toLowerCase().includes(searchUser.toLowerCase());
      const matchProduct =
        !searchProduct ||
        r.product_id?.name?.toLowerCase().includes(searchProduct.toLowerCase());
      return matchUser && matchProduct;
    });

    res.json({
      success: true,
      total: filtered.length,
      ratings: filtered.map((r) => ({
        _id: r._id,
        userName: r.user_id?.name || "Không rõ",
        productName: r.product_id?.name || "Không rõ",
        content: r.content,
        rating: r.rating,
        status: r.status,
        created_at: r.created_at,
      })),
    });
  } catch (err) {
    console.error("Lỗi lấy danh sách rating:", err);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách đánh giá" });
  }
};