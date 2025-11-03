import Rating from "../models/rating.model.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";
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

    //  Check user có bị khóa không
    const user = await User.findById(user_id);
    if (!user || !user.active) {
      return res.status(403).json({
        success: false,
        message: "Tài khoản của bạn đã bị khóa. Không thể đánh giá sản phẩm!",
      });
    }

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

    const populatedRating = await newRating.populate("user_id", "name email avatar active");
    
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
 *  Lấy tất cả rating của 1 sản phẩm (chỉ hiển thị rating của user active)
 */
export const getRatingsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 5 } = req.query;

    // Aggregate để join với User và filter active
    const ratingsAggregation = await Rating.aggregate([
      {
        $match: {
          product_id: new mongoose.Types.ObjectId(productId),
          status: "visible"
        }
      },
      {
        $lookup: {
          from: "users", // collection name
          localField: "user_id",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      // Chỉ lấy rating của user active = true
      {
        $match: {
          "user.active": true
        }
      },
      {
        $project: {
          product_id: 1,
          user_id: 1,
          content: 1,
          rating: 1,
          status: 1,
          created_at: 1,
          updated_at: 1,
          "user._id": 1,
          "user.name": 1,
          "user.email": 1,
          "user.avatar": 1,
          "user.active": 1
        }
      },
      {
        $sort: { created_at: -1 }
      },
      {
        $facet: {
          ratings: [
            { $skip: (page - 1) * parseInt(limit) },
            { $limit: parseInt(limit) }
          ],
          totalCount: [
            { $count: "count" }
          ]
        }
      }
    ]);

    const ratings = ratingsAggregation[0].ratings.map(r => ({
      ...r,
      user_id: r.user
    }));
    
    const total = ratingsAggregation[0].totalCount[0]?.count || 0;

    // Tính rating trung bình (chỉ tính những rating của user active)
    const avgRating = await Rating.aggregate([
      { 
        $match: { 
          product_id: new mongoose.Types.ObjectId(productId),
          status: "visible" 
        } 
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $match: {
          "user.active": true
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
    console.error("Error fetching ratings:", error);
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
    const { content, rating, status } = req.body;
    const userId = req.user.userId;
    const isSeller = req.user.role === "seller";

    const existingRating = await Rating.findById(id).populate('user_id', 'active');
    if (!existingRating) {
      return res.status(404).json({ success: false, message: "Rating not found" });
    }

    // Check user có bị khóa không (chỉ check khi user tự update)
    if (!isSeller && existingRating.user_id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this rating",
      });
    }

    if (!isSeller && !existingRating.user_id.active) {
      return res.status(403).json({
        success: false,
        message: "Tài khoản của bạn đã bị khóa. Không thể cập nhật đánh giá!",
      });
    }

    // Cập nhật các trường cho phép
    if (content !== undefined) existingRating.content = content;
    if (rating !== undefined) existingRating.rating = rating;
    if (status !== undefined && isSeller) existingRating.status = status;

    await existingRating.save();

    const updatedRating = await existingRating.populate("user_id", "name email avatar active");

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
 * Lấy rating trung bình của sản phẩm (chỉ tính rating của user active)
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
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
      // Chỉ tính rating của user active
      {
        $match: {
          "user.active": true
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

/**
 * Lấy toàn bộ rating cho seller (hiển thị cả rating của user bị khóa nhưng có flag)
 */
export const getAllRatings = async (req, res) => {
  try {
    const { page = 1, status, searchUser, searchProduct } = req.query;
    const limit = 10;
    const skip = (page - 1) * limit;

    const filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    //  Aggregate để join với User và Product
    const ratingsAggregation = await Rating.aggregate([
      {
        $match: filter
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "product_id",
          foreignField: "_id",
          as: "product"
        }
      },
      {
        $unwind: "$user"
      },
      {
        $unwind: "$product"
      },
      //  Filter theo search
      {
        $match: {
          ...(searchUser && {
            "user.name": { $regex: searchUser, $options: "i" }
          }),
          ...(searchProduct && {
            "product.name": { $regex: searchProduct, $options: "i" }
          })
        }
      },
      {
        $sort: { created_at: -1 }
      },
      {
        $facet: {
          ratings: [
            { $skip: skip },
            { $limit: limit }
          ],
          totalCount: [
            { $count: "count" }
          ]
        }
      }
    ]);

    const ratings = ratingsAggregation[0].ratings;
    const total = ratingsAggregation[0].totalCount[0]?.count || 0;

    res.json({
      success: true,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      ratings: ratings.map((r) => ({
        _id: r._id,
        userName: r.user?.name || "Không rõ",
        userActive: r.user?.active, // Thêm flag user active
        productName: r.product?.name || "Không rõ",
        content: r.content,
        rating: r.rating,
        status: r.status,
        created_at: r.created_at,
        // Flag để biết rating có hiển thị được không
        isVisible: r.status === 'visible' && r.user?.active === true
      })),
    });
  } catch (err) {
    console.error("Lỗi lấy danh sách rating:", err);
    res.status(500).json({ 
      success: false,
      message: "Lỗi server khi lấy danh sách đánh giá",
      error: err.message
    });
  }
};