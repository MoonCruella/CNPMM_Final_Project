// controllers/ProductController.js
import Product from "../models/product.model.js";

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
