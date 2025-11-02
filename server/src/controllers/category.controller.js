import Category from "../models/category.model.js";
import response from "../helpers/response.js";
import {
  removeVietnameseTones,
  createVietnameseSearchQuery,
  sortByRelevance,
} from "../utils/fuzzySearch.js";

// ✅ Helper function to generate slug
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

// ✅ Helper function to ensure unique slug
const ensureUniqueSlug = async (baseSlug, excludeId = null) => {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const query = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const existing = await Category.findOne(query);
    if (!existing) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

// GET: Lấy tất cả categories với phân trang và search
export const getCategories = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      sort_by = "created_at",
      order = "desc",
      is_active,
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    let query = {};

    // Filter by active status
    if (is_active !== undefined) {
      query.is_active = is_active === "true";
    }

    // Fuzzy search
    if (search && search.trim()) {
      const searchQuery = createVietnameseSearchQuery(search, [
        "name",
        "slug",
        "description",
      ]);
      query = { ...query, ...searchQuery };
    }

    // Count total
    const total = await Category.countDocuments(query);

    // Get categories
    let categories = await Category.find(query)
      .sort({ [sort_by]: order === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Sort by relevance if search query exists
    if (search && search.trim()) {
      const sortedResults = sortByRelevance(categories, search, [
        "name",
        "slug",
        "description",
      ]);
      categories = sortedResults.map((result) => result.item);
    }

    const totalPages = Math.ceil(total / limitNum);

    return response.sendSuccess(
      res,
      {
        categories,
        pagination: {
          current_page: pageNum,
          total_pages: totalPages,
          total_items: total,
          items_per_page: limitNum,
          has_next: pageNum < totalPages,
          has_prev: pageNum > 1,
        },
      },
      "Lấy danh sách danh mục thành công",
      200
    );
  } catch (error) {
    console.error("Error fetching categories:", error);
    return response.sendError(
      res,
      "Lỗi khi lấy danh sách danh mục",
      500,
      error.message
    );
  }
};

// POST: Tạo category mới
export const createCategory = async (req, res) => {
  try {
    const { name, slug: customSlug, description, image, is_active } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return response.sendError(res, "Tên danh mục không được để trống", 400);
    }

    // ✅ Generate slug from name or use custom slug
    const baseSlug = customSlug?.trim() || generateSlug(name);
    
    // ✅ Ensure unique slug
    const uniqueSlug = await ensureUniqueSlug(baseSlug);

    const category = new Category({
      name: name.trim(),
      slug: uniqueSlug,
      description: description?.trim() || "",
      image: image?.trim() || "",
      is_active: is_active !== undefined ? is_active : true,
    });

    await category.save();

    return response.sendSuccess(
      res,
      category,
      "Tạo danh mục thành công",
      201
    );
  } catch (error) {
    console.error("Error creating category:", error);
    return response.sendError(
      res,
      "Lỗi khi tạo danh mục",
      400,
      error.message
    );
  }
};

// GET: Lấy category theo ID
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
      return response.sendError(res, "Không tìm thấy danh mục", 404);
    }

    return response.sendSuccess(
      res,
      category,
      "Lấy thông tin danh mục thành công",
      200
    );
  } catch (error) {
    console.error("Error fetching category by ID:", error);
    return response.sendError(
      res,
      "Lỗi khi lấy thông tin danh mục",
      500,
      error.message
    );
  }
};

// PUT: Update category
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug: customSlug, description, image, is_active } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return response.sendError(res, "Không tìm thấy danh mục", 404);
    }

    // Validate required fields
    if (!name || !name.trim()) {
      return response.sendError(res, "Tên danh mục không được để trống", 400);
    }

    // ✅ Generate slug from name if customSlug not provided
    let newSlug;
    if (customSlug && customSlug.trim()) {
      newSlug = customSlug.trim();
    } else {
      newSlug = generateSlug(name);
    }

    // ✅ Check if slug is changed and ensure unique
    if (newSlug !== category.slug) {
      newSlug = await ensureUniqueSlug(newSlug, id);
    }

    // Update fields
    category.name = name.trim();
    category.slug = newSlug;
    category.description = description?.trim() || "";
    category.image = image?.trim() || "";
    category.is_active = is_active !== undefined ? is_active : category.is_active;

    await category.save();

    return response.sendSuccess(
      res,
      category,
      "Cập nhật danh mục thành công",
      200
    );
  } catch (error) {
    console.error("Error updating category:", error);
    return response.sendError(
      res,
      "Lỗi khi cập nhật danh mục",
      500,
      error.message
    );
  }
};

// DELETE: Delete category
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return response.sendError(res, "Không tìm thấy danh mục", 404);
    }

    await Category.findByIdAndDelete(id);

    return response.sendSuccess(res, null, "Xóa danh mục thành công", 200);
  } catch (error) {
    console.error("Error deleting category:", error);
    return response.sendError(
      res,
      "Lỗi khi xóa danh mục",
      500,
      error.message
    );
  }
};

// GET: Get all categories (no pagination) - for dropdown/select
export const getAllCategoriesSimple = async (req, res) => {
  try {
    const categories = await Category.find({ is_active: true })
      .select("_id name slug image")
      .sort({ name: 1 })
      .lean();

    return response.sendSuccess(
      res,
      categories,
      "Lấy danh sách danh mục thành công",
      200
    );
  } catch (error) {
    console.error("Error fetching all categories:", error);
    return response.sendError(
      res,
      "Lỗi khi lấy danh sách danh mục",
      500,
      error.message
    );
  }
};