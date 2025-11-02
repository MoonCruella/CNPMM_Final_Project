// controllers/ProductController.js
import Product from "../models/product.model.js";
import Rating from "../models/rating.model.js"
import * as notificationService from '../services/notification.service.js';

// Tạo sản phẩm mới
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      sale_price,
      category_id,
      tags,
      stock_quantity,
      images
    } = req.body;

    // Kiểm tra dữ liệu đầu vào cần thiết
    if (!name || !price || !category_id) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp tên sản phẩm, giá và danh mục"
      });
    }

    // Tạo slug từ tên sản phẩm
    const slug = name
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-');

    // Kiểm tra slug đã tồn tại chưa
    const existingProduct = await Product.findOne({ slug });
    
    // Nếu slug đã tồn tại, thêm timestamp
    const finalSlug = existingProduct 
      ? `${slug}-${Date.now().toString().slice(-6)}` 
      : slug;

    // Tạo sản phẩm mới
    const newProduct = new Product({
      name,
      description,
      price,
      sale_price: sale_price || 0,
      category_id,
      slug: finalSlug,
      tags: tags || [],
      stock_quantity: stock_quantity || 0,
      images: images || [],
      status: "active",
      view_count: 0,
      unique_view_count: 0,
      sold_quantity: 0,
      favorites: [],
      views: [],
      created_at: new Date(),
      updated_at: new Date()
    });

    // Lưu vào database
    await newProduct.save();

    // Gửi thông báo về sản phẩm mới cho người dùng
    try {
      await notificationService.notifyNewProduct(newProduct);
    } catch (notifyError) {
      console.error("Không thể gửi thông báo về sản phẩm mới:", notifyError);
      // Không cần phải dừng luồng nếu thông báo lỗi
    }

    // Trả về response thành công
    return res.status(201).json({
      success: true,
      data: newProduct,
      message: "Tạo sản phẩm mới thành công"
    });
  } catch (error) {
    console.error("Create product error:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi tạo sản phẩm mới",
      error: error.message
    });
  }
};

// Cập nhật sản phẩm
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Cập nhật sản phẩm
    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không tồn tại",
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedProduct,
      message: "Cập nhật sản phẩm thành công",
    });
  } catch (error) {
    console.error("Update product error:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi cập nhật sản phẩm",
      error: error.message,
    });
  }
};

// Xóa sản phẩm
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Xóa sản phẩm
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không tồn tại",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Xóa sản phẩm thành công",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi xóa sản phẩm",
      error: error.message,
    });
  }
};

// Lấy tất cả sản phẩm
export const getAllProducts = async (req, res) => {
  try {
    // Lấy page và limit từ query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Optional: Filter parameters
    const { category, minPrice, maxPrice, search, sort, status } = req.query;
    
    // Build filter query
    const filter = {};
    
    //  Filter theo status (mặc định là active nếu không truyền)
    if (status) {
      // Nếu có status trong query, filter theo status đó
      filter.status = status;
    } else {
      // Nếu không có status, mặc định chỉ lấy active
      filter.status = "active";
    }
    
    if (category) {
      filter.category_id = category;
    }
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort options với _id làm tiebreaker để đảm bảo sort ổn định
    let sortOptions = {};
    switch (sort) {
      case 'price_asc':
        sortOptions = { price: 1, _id: 1 };
        break;
      case 'price_desc':
        sortOptions = { price: -1, _id: 1 }; 
        break;
      case 'newest':
        sortOptions = { created_at: -1, _id: -1 }; 
        break;
      case 'popular':
        sortOptions = { sold_quantity: -1, _id: 1 }; 
        break;
      case 'rating':
        sortOptions = { avg_rating: -1, _id: 1 }; 
        break;
      default:
        sortOptions = { created_at: -1, _id: -1 }; 
    }

    // Fetch products with pagination
    const products = await Product.find(filter)
      .populate('category_id', 'name slug')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    // Count total products
    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);

    //  Response with pagination info
    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_items: totalProducts,
          items_per_page: limit,
          has_previous: page > 1,
          has_next: page < totalPages
        }
      },
      message: "Lấy danh sách sản phẩm thành công"
    });
  } catch (err) {
    console.error("Error fetching all products:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
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

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    // Chỉ xử lý view khi user đã đăng nhập
    if (userId) {
      try {
        // Tăng lượt xem và thêm vào lịch sử
        await Product.findByIdAndUpdate(
          id,
          {
            $inc: { view_count: 1 },
            $push: { 
              views: { 
                user_id: userId, 
                viewed_at: new Date() 
              }
            }
          },
          { new: false }
        );

        // Kiểm tra xem đây có phải lần đầu user xem sản phẩm này không
        const userViewedBefore = product.views?.some(
          view => view.user_id?.toString() === userId.toString()
        );
        
        // Nếu chưa từng xem, tăng unique_view_count
        if (!userViewedBefore) {
          await Product.findByIdAndUpdate(
            id,
            { $inc: { unique_view_count: 1 } },
            { new: false }
          );
        }
        
        console.log(`Đã cập nhật lượt xem cho sản phẩm ${id} và user ${userId}`);
      } catch (viewError) {
        console.error("Không thể cập nhật lượt xem:", viewError);
      }
    }

    // Kiểm tra xem user có yêu thích sản phẩm này không
    let isFavorited = false;
    if (userId) {
      isFavorited = product.favorites?.some(
        fav => fav.user_id?.toString() === userId.toString()
      ) || false;
    }

    // Lấy thông tin đánh giá
    const ratings = await Rating.find({ 
      product_id: id, 
      status: "visible" 
    }).populate("user_id", "name avatar");

    // Tính điểm đánh giá trung bình
    let avgRating = 0;
    if (ratings.length > 0) {
      avgRating = ratings.reduce((sum, item) => sum + item.rating, 0) / ratings.length;
    }

    // Kết hợp dữ liệu trả về
    const responseData = {
      ...product._doc,
      isFavorited,
      ratings,
      avg_rating: avgRating,
      rating_count: ratings.length
    };

    return res.status(200).json({
      success: true,
      data: responseData,
      message: "Lấy thông tin sản phẩm thành công"
    });
  } catch (err) {
    console.error("Error fetching product by id:", err);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: err.message
    });
  }
};

// Thêm vào danh sách yêu thích
export const toggleFavorite = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.userId;

    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm"
      });
    }

    // Kiểm tra xem user đã yêu thích sản phẩm chưa
    const favoriteIndex = product.favorites?.findIndex(
      fav => fav.user_id.toString() === userId.toString()
    );

    // Toggle favorite status
    if (favoriteIndex === -1) {
      // Add to favorites
      product.favorites.push({
        user_id: userId,
        added_at: new Date()
      });
      await product.save();
      
      return res.status(200).json({
        success: true,
        message: "Đã thêm vào danh sách yêu thích",
        isFavorited: true
      });
    } else {
      // Remove from favorites
      product.favorites.splice(favoriteIndex, 1);
      await product.save();
      
      return res.status(200).json({
        success: true,
        message: "Đã xóa khỏi danh sách yêu thích",
        isFavorited: false
      });
    }
  } catch (error) {
    console.error("Toggle favorite error:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi thêm/xóa yêu thích",
      error: error.message
    });
  }
};

// Lấy danh sách sản phẩm yêu thích của user
export const getFavoriteProducts = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;
    
    const products = await Product.find({
      "favorites.user_id": userId,
      status: "active"
    })
    .sort({ "favorites.added_at": -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate("category_id", "name")
    
    const totalProducts = await Product.countDocuments({
      "favorites.user_id": userId,
      status: "active"
    });
    
    return res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          total: totalProducts,
          page: parseInt(page),
          limit: parseInt(limit),
          total_pages: Math.ceil(totalProducts / limit)
        }
      },
      message: "Lấy danh sách sản phẩm yêu thích thành công"
    });
  } catch (error) {
    console.error("Get favorite products error:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy sản phẩm yêu thích",
      error: error.message
    });
  }
};


// Lấy lịch sử xem của user
export const getViewedProducts = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    
    // Sử dụng static method từ model
    const products = await Product.getViewedByUser(userId, pageNumber, limitNumber);
    
    // Đếm tổng số sản phẩm
    const totalProducts = await Product.countViewedByUser(userId);
    
    return res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          total: totalProducts,
          page: pageNumber,
          limit: limitNumber,
          total_pages: Math.ceil(totalProducts / limitNumber)
        }
      },
      message: "Lấy lịch sử xem thành công"
    });
  } catch (error) {
    console.error("Get viewed products error:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy lịch sử xem",
      error: error.message
    });
  }
};
// Lấy sản phẩm tương tự
export const getSimilarProducts = async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 8 } = req.query;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm"
      });
    }
    
    // Tìm sản phẩm cùng category hoặc tags tương tự
    const similarProducts = await Product.find({
      _id: { $ne: productId }, // Loại sản phẩm hiện tại
      status: "active",
      $or: [
        { category_id: product.category_id },
        { tags: { $in: product.tags } } // Nếu có field tags
      ]
    })
    .limit(parseInt(limit))
    .populate("category_id", "name")
    .lean();
    
    return res.status(200).json({
      success: true,
      data: similarProducts,
      message: "Lấy sản phẩm tương tự thành công"
    });
  } catch (error) {
    console.error("Get similar products error:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy sản phẩm tương tự",
      error: error.message
    });
  }
};

export const getProductStats = async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Lấy thông tin sản phẩm
    const product = await Product.findById(productId)
      .lean()
      .populate("purchase_users", "name");
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm"
      });
    }
    
    // Đếm số lượng đánh giá
    const ratingCount = await Rating.countDocuments({
      product_id: productId,
      status: "visible"
    });
    
    // Đếm số người đánh giá duy nhất
    const uniqueRaters = await Rating.distinct("user_id", {
      product_id: productId,
      status: "visible"
    });
    
    const stats = {
      view_count: product.view_count || 0,
      unique_view_count: product.unique_view_count || 0,
      favorite_count: product.favorites?.length || 0,
      rating_count: ratingCount,
      unique_rater_count: uniqueRaters.length,
      buyer_count: product.purchase_users?.length || 0,
      purchase_count: product.purchase_count || 0
    };
    
    return res.status(200).json({
      success: true,
      data: stats,
      message: "Lấy thống kê sản phẩm thành công"
    });
  } catch (error) {
    console.error("Get product stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy thống kê sản phẩm",
      error: error.message
    });
  }
};