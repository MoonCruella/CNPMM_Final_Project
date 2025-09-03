// controllers/ProductController.js
import Product from "../models/product.model.js";

// Lấy tất cả sản phẩm
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: "active" });

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (err) {
    console.error("Error fetching all products:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Lấy 8 sản phẩm bán chạy nhất
export const getBestSellers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8; // giới hạn sản phẩm trả về
    const bestSellers = await Product.find({
      status: "active",
      sold_quantity: { $gt: 0 },
    })
      .sort({ sold_quantity: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      data: bestSellers,
    });
  } catch (err) {
    console.error("Error fetching best sellers:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Lấy 4 sản phẩm giảm giá sâu nhất
export const getBiggestDiscounts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;

    // chỉ lấy sản phẩm có sale_price < price
    const discounts = await Product.aggregate([
      {
        $match: {
          status: "active",
          sale_price: { $gt: 0 },
          $expr: { $lt: ["$sale_price", "$price"] },
        },
      },
      {
        $addFields: {
          discountPercent: {
            $multiply: [
              { $divide: [{ $subtract: ["$price", "$sale_price"] }, "$price"] },
              100,
            ],
          },
        },
      },
      { $sort: { discountPercent: -1 } },
      { $limit: limit },
    ]);

    res.status(200).json({
      success: true,
      data: discounts,
    });
  } catch (err) {
    console.error("Error fetching discounts:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Lấy 8 sản phẩm mới nhất
export const getNewestProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const newest = await Product.find({ status: "active" })
      .sort({ created_at: -1 }) // mới nhất trước
      .limit(limit);

    res.status(200).json({
      success: true,
      data: newest,
    });
  } catch (err) {
    console.error("Error fetching newest products:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
