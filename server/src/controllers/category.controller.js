import Category from "../models/category.model.js";

// GET: Lấy tất cả categories
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ created_at: -1 }); // mới nhất trước
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// POST: Tạo category mới
export const createCategory = async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
