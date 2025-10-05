import HometownPost from '../models/hometownPost.model.js';
import response from '../helpers/response.js';
import slugify from 'slugify';
import mongoose from 'mongoose';

/**
 * Tạo bài viết mới về quê hương
 */
export const createPost = async (req, res) => {
  try {
    const { title, content, excerpt, category, location, featured_image } = req.body;
    
    // Tạo slug từ tiêu đề
    const baseSlug = slugify(title, { lower: true, locale: 'vi', strict: true });
    let slug = baseSlug;
    
    // Kiểm tra slug đã tồn tại chưa
    let slugExists = await HometownPost.findOne({ slug });
    let counter = 1;
    
    // Nếu slug đã tồn tại, thêm số vào cuối
    while (slugExists) {
      slug = `${baseSlug}-${counter}`;
      slugExists = await HometownPost.findOne({ slug });
      counter++;
    }
       
    // Tạo bài viết mới
    const newPost = new HometownPost({
      title,
      slug,
      content,
      excerpt: excerpt || content.substring(0, 200) + '...',
      featured_image,
      author_id: req.user.userId, // Lấy từ middleware xác thực
      category,
      location,
      status: req.body.status || 'published'
    });
    
    await newPost.save();
    
    return response.sendSuccess(
      res, 
      newPost, 
      'Tạo bài viết quê hương thành công',
      201
    );
  } catch (error) {
    console.error('Error creating hometown post:', error);
    return response.sendError(
      res,
      'Không thể tạo bài viết',
      500,
      error.message
    );
  }
};

/**
 * Lấy danh sách bài viết với phân trang và lọc
 */
export const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Xây dựng filter từ query params
    const filter = {};
    
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    if (req.query.status) {
      // Kiểm tra quyền nếu muốn lấy bài viết draft
      if (req.query.status === 'draft' && (!req.user || !req.user.isAdmin)) {
        filter.status = 'published';
      } else {
        filter.status = req.query.status;
      }
    } else {
      // Mặc định chỉ lấy bài đã published nếu không có quyền admin
      if (!req.user || !req.user.isAdmin) {
        filter.status = 'published';
      }
    }
    
    if (req.query.location) {
      filter['location.district'] = req.query.location;
    }
    
    // Lấy tổng số bài viết thỏa mãn điều kiện
    const total = await HometownPost.countDocuments(filter);
    
    // Lấy danh sách bài viết
    const posts = await HometownPost.find(filter)
      .populate('author_id', 'name avatar')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);
    
    return response.sendSuccess(res, {
      posts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }, 'Lấy danh sách bài viết thành công');
  } catch (error) {
    console.error('Error getting hometown posts:', error);
    return response.sendError(
      res,
      'Không thể lấy danh sách bài viết',
      500,
      error.message
    );
  }
};

/**
 * Lấy chi tiết bài viết theo slug hoặc id
 */
export const getPostDetail = async (req, res) => {
  try {
    const { identifier } = req.params; // có thể là slug hoặc id
    
    let post;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      // Nếu là id hợp lệ
      post = await HometownPost.findById(identifier)
        .populate('author_id', 'name avatar');
    } else {
      // Nếu là slug
      post = await HometownPost.findOne({ slug: identifier })
        .populate('author_id', 'name avatar');
    }
    
    if (!post) {
      return response.sendError(
        res,
        'Không tìm thấy bài viết',
        404
      );
    }
    
    // Nếu là bài draft và không phải author hoặc admin
    if (post.status === 'draft' && 
        (!req.user || 
         (req.user.userId.toString() !== post.author_id._id.toString() && !req.user.isAdmin))) {
      return response.sendError(
        res,
        'Không có quyền xem bài viết này',
        403
      );
    }
    
    // Tăng số lượt xem
    post.views += 1;
    await post.save();
    
    return response.sendSuccess(
      res,
      post,
      'Lấy chi tiết bài viết thành công'
    );
  } catch (error) {
    console.error('Error getting post detail:', error);
    return response.sendError(
      res,
      'Không thể lấy chi tiết bài viết',
      500,
      error.message
    );
  }
};

/**
 * Cập nhật bài viết
 */
export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, excerpt, category, location, featured_image, status } = req.body;
    
    // Tìm bài viết
    const post = await HometownPost.findById(id);
    
    if (!post) {
      return response.sendError(
        res,
        'Không tìm thấy bài viết',
        404
      );
    }
    
    // Kiểm tra quyền
    if (!req.user || 
        (req.user.userId.toString() !== post.author_id.toString() && !req.user.isAdmin)) {
      return response.sendError(
        res,
        'Không có quyền cập nhật bài viết này',
        403
      );
    }
    
    // Cập nhật slug nếu tiêu đề thay đổi
    let slug = post.slug;
    if (title && title !== post.title) {
      const baseSlug = slugify(title, { lower: true, locale: 'vi', strict: true });
      slug = baseSlug;
      
      // Kiểm tra slug đã tồn tại chưa (trừ chính bài viết này)
      let slugExists = await HometownPost.findOne({ 
        slug: baseSlug,
        _id: { $ne: id }
      });
      
      let counter = 1;
      while (slugExists) {
        slug = `${baseSlug}-${counter}`;
        slugExists = await HometownPost.findOne({ 
          slug,
          _id: { $ne: id }
        });
        counter++;
      }
    }
    
    // Cập nhật bài viết
    const updatedPost = await HometownPost.findByIdAndUpdate(
      id,
      {
        title: title || post.title,
        slug,
        content: content || post.content,
        excerpt: excerpt || (content ? content.substring(0, 200) + '...' : post.excerpt),
        featured_image: featured_image || post.featured_image,
        category: category || post.category,
        location: location || post.location,
        status: status || post.status
      },
      { new: true }
    ).populate('author_id', 'name avatar');
    
    return response.sendSuccess(
      res,
      updatedPost,
      'Cập nhật bài viết thành công'
    );
  } catch (error) {
    console.error('Error updating hometown post:', error);
    return response.sendError(
      res,
      'Không thể cập nhật bài viết',
      500,
      error.message
    );
  }
};

/**
 * Xóa bài viết
 */
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Tìm bài viết
    const post = await HometownPost.findById(id);
    
    if (!post) {
      return response.sendError(
        res,
        'Không tìm thấy bài viết',
        404
      );
    }
    
    // Kiểm tra quyền
    if (!req.user || 
        (req.user.userId.toString() !== post.author_id.toString() && !req.user.isAdmin)) {
      return response.sendError(
        res,
        'Không có quyền xóa bài viết này',
        403
      );
    }
    
    // Xóa bài viết
    await HometownPost.findByIdAndDelete(id);
    
    return response.sendSuccess(
      res,
      { id },
      'Xóa bài viết thành công'
    );
  } catch (error) {
    console.error('Error deleting hometown post:', error);
    return response.sendError(
      res,
      'Không thể xóa bài viết',
      500,
      error.message
    );
  }
};

/**
 * Lấy các bài viết nổi bật/xem nhiều nhất
 */
export const getFeaturedPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const posts = await HometownPost.find({ status: 'published' })
      .populate('author_id', 'name avatar')
      .sort({ views: -1 })
      .limit(limit);
    
    return response.sendSuccess(
      res,
      posts,
      'Lấy danh sách bài viết nổi bật thành công'
    );
  } catch (error) {
    console.error('Error getting featured posts:', error);
    return response.sendError(
      res,
      'Không thể lấy danh sách bài viết nổi bật',
      500,
      error.message
    );
  }
};

/**
 * Lấy bài viết theo danh mục
 */
export const getPostsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Kiểm tra danh mục hợp lệ
    if (!['culture', 'food', 'tourism', 'history', 'festival'].includes(category)) {
      return response.sendError(
        res,
        'Danh mục không hợp lệ',
        400
      );
    }
    
    // Đếm tổng số bài viết theo danh mục
    const total = await HometownPost.countDocuments({
      category,
      status: 'published'
    });
    
    // Lấy danh sách bài viết
    const posts = await HometownPost.find({
      category,
      status: 'published'
    })
      .populate('author_id', 'name avatar')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);
    
    return response.sendSuccess(
      res,
      {
        posts,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      },
      `Lấy danh sách bài viết danh mục ${category} thành công`
    );
  } catch (error) {
    console.error('Error getting posts by category:', error);
    return response.sendError(
      res,
      'Không thể lấy danh sách bài viết theo danh mục',
      500,
      error.message
    );
  }
};

/**
 * Lấy bài viết theo địa điểm
 */
export const getPostsByLocation = async (req, res) => {
  try {
    const { district } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Kiểm tra district hợp lệ
    const validDistricts = [
      'phu_yen_city', 'dong_hoa', 'tuy_an', 'son_hoa', 
      'song_hinh', 'tay_hoa', 'phu_hoa', 'dong_xuan', 'song_cau'
    ];
    
    if (!validDistricts.includes(district)) {
      return response.sendError(
        res,
        'Địa điểm không hợp lệ',
        400
      );
    }
    
    // Đếm tổng số bài viết theo địa điểm
    const total = await HometownPost.countDocuments({
      'location.district': district,
      status: 'published'
    });
    
    // Lấy danh sách bài viết
    const posts = await HometownPost.find({
      'location.district': district,
      status: 'published'
    })
      .populate('author_id', 'name avatar')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);
    
    return response.sendSuccess(
      res,
      {
        posts,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      },
      `Lấy danh sách bài viết địa điểm ${district} thành công`
    );
  } catch (error) {
    console.error('Error getting posts by location:', error);
    return response.sendError(
      res,
      'Không thể lấy danh sách bài viết theo địa điểm',
      500,
      error.message
    );
  }
};

/**
 * Tìm kiếm bài viết
 */
export const searchPosts = async (req, res) => {
  try {
    const { q } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    if (!q) {
      return response.sendError(
        res,
        'Vui lòng cung cấp từ khóa tìm kiếm',
        400
      );
    }
    
    // Tạo regex pattern cho tìm kiếm không phân biệt hoa thường
    const searchRegex = new RegExp(q, 'i');
    
    // Điều kiện tìm kiếm
    const searchCondition = {
      $or: [
        { title: searchRegex },
        { content: searchRegex },
        { excerpt: searchRegex },
        { 'location.specific_place': searchRegex }
      ],
      status: 'published'
    };
    
    // Đếm tổng số kết quả
    const total = await HometownPost.countDocuments(searchCondition);
    
    // Lấy kết quả tìm kiếm
    const posts = await HometownPost.find(searchCondition)
      .populate('author_id', 'name avatar')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);
    
    return response.sendSuccess(
      res,
      {
        posts,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      },
      `Tìm thấy ${total} kết quả cho "${q}"`
    );
  } catch (error) {
    console.error('Error searching posts:', error);
    return response.sendError(
      res,
      'Không thể tìm kiếm bài viết',
      500,
      error.message
    );
  }
};