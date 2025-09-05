import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import User from '../models/user.model.js';
import mongoose from 'mongoose';
import response from '../helpers/response.js';

//Get user orders with filter and pagination
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      status = 'all', 
      page = 1, 
      limit = 10,
      sort = 'created_at',
      order = 'desc'
    } = req.query;

    // Build filter object
    const filter = { user_id: userId };
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get orders with pagination
    const orders = await Order.find(filter)
      .populate({
        path: 'items.product_id',
        select: 'name images price category brand'
      })
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / parseInt(limit));

    // Calculate order statistics
    const allUserOrders = await Order.find({ user_id: userId }).lean();
    const orderStats = {
      total: allUserOrders.length,
      pending: allUserOrders.filter(order => order.status === 'pending').length,
      processing: allUserOrders.filter(order => order.status === 'processing').length,
      shipped: allUserOrders.filter(order => order.status === 'shipped').length,
      delivered: allUserOrders.filter(order => order.status === 'delivered').length,
      cancelled: allUserOrders.filter(order => order.status === 'cancelled').length,
      totalAmount: allUserOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
    };

    const data = {
      orders,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_orders: totalOrders,
        per_page: parseInt(limit),
        has_next: parseInt(page) < totalPages,
        has_prev: parseInt(page) > 1
      },
      stats: orderStats,
      filter: {
        status,
        sort,
        order
      }
    };

    return response.sendSuccess(res, data, 'Lấy danh sách đơn hàng thành công', 200);

  } catch (error) {
    console.error('Get user orders error:', error);
    return response.sendError(res, 'Có lỗi xảy ra khi lấy danh sách đơn hàng', 500, error.message);
  }
};

// Get order by ID
export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;

    // Validate orderId format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return response.sendError(res, 'ID đơn hàng không hợp lệ', 400);
    }

    // Find order and verify ownership
    const order = await Order.findOne({ 
      _id: orderId, 
      user_id: userId 
    })
    .populate({
      path: 'items.product_id',
      select: 'name images price category brand description'
    })
    .populate({
      path: 'user_id',
      select: 'name email phone'
    })
    .lean();

    if (!order) {
      return response.sendError(res, 'Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập', 404);
    }

    // Add order timeline
    const timeline = [
      {
        status: 'pending',
        label: 'Chờ xác nhận',
        date: order.created_at,
        completed: true,
        description: 'Đơn hàng đã được tạo'
      }
    ];

    if (order.status !== 'cancelled') {
      timeline.push({
        status: 'processing',
        label: 'Đang xử lý',
        date: order.confirmed_at || null,
        completed: ['processing', 'shipped', 'delivered'].includes(order.status),
        description: 'Đơn hàng đang được xử lý'
      });

      timeline.push({
        status: 'shipped',
        label: 'Đang giao hàng',
        date: order.shipped_at || null,
        completed: ['shipped', 'delivered'].includes(order.status),
        description: 'Đơn hàng đang được giao'
      });

      timeline.push({
        status: 'delivered',
        label: 'Đã giao',
        date: order.delivered_at || null,
        completed: order.status === 'delivered',
        description: 'Đơn hàng đã được giao thành công'
      });
    } else {
      timeline.push({
        status: 'cancelled',
        label: 'Đã hủy',
        date: order.cancelled_at || null,
        completed: true,
        description: 'Đơn hàng đã bị hủy'
      });
    }

    const data = {
      order: {
        ...order,
        timeline
      }
    };

    return response.sendSuccess(res, data, 'Lấy thông tin đơn hàng thành công', 200);

  } catch (error) {
    console.error('Get order by ID error:', error);
    return response.sendError(res, 'Có lỗi xảy ra khi lấy thông tin đơn hàng', 500, error.message);
  }
};

// ✅ Cancel order
export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;
    const { reason = '' } = req.body;

    // Validate orderId format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return response.sendError(res, 'ID đơn hàng không hợp lệ', 400);
    }

    // Find order and verify ownership
    const order = await Order.findOne({ 
      _id: orderId, 
      user_id: userId 
    });

    if (!order) {
      return response.sendError(res, 'Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập', 404);
    }

    // Check if order can be cancelled
    if (!['pending', 'processing'].includes(order.status)) {
      return response.sendError(res, 'Không thể hủy đơn hàng ở trạng thái này', 400);
    }

    // Update order status
    order.status = 'cancelled';
    order.cancelled_at = new Date();
    order.cancel_reason = reason;
    
    await order.save();

    // Log the cancellation
    console.log(`Order ${order.order_number} cancelled by user ${userId}. Reason: ${reason}`);

    const data = {
      order: {
        _id: order._id,
        order_number: order.order_number,
        status: order.status,
        cancelled_at: order.cancelled_at,
        cancel_reason: order.cancel_reason
      }
    };

    return response.sendSuccess(res, data, 'Hủy đơn hàng thành công', 200);

  } catch (error) {
    console.error('Cancel order error:', error);
    return response.sendError(res, 'Có lỗi xảy ra khi hủy đơn hàng', 500, error.message);
  }
};

// ✅ Reorder - Add items to cart again
export const reorder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;

    // Validate orderId format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return response.sendError(res, 'ID đơn hàng không hợp lệ', 400);
    }

    // Find order and verify ownership
    const order = await Order.findOne({ 
      _id: orderId, 
      user_id: userId 
    })
    .populate('items.product_id')
    .lean();

    if (!order) {
      return response.sendError(res, 'Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập', 404);
    }

    // Check if order can be reordered
    if (!['delivered', 'cancelled'].includes(order.status)) {
      return response.sendError(res, 'Chỉ có thể đặt lại đơn hàng đã giao hoặc đã hủy', 400);
    }

    // Prepare cart items
    const cartItems = [];
    const unavailableItems = [];

    for (const item of order.items) {
      const product = item.product_id;
      
      if (!product) {
        unavailableItems.push({
          name: 'Sản phẩm không tồn tại',
          reason: 'Sản phẩm đã bị xóa'
        });
        continue;
      }

      // Check product availability (assuming you have stock field)
      if (product.stock < item.quantity) {
        unavailableItems.push({
          name: product.name,
          reason: `Chỉ còn ${product.stock} sản phẩm trong kho`
        });
        continue;
      }

      cartItems.push({
        product_id: product._id,
        name: product.name,
        price: product.price, // Use current price
        quantity: item.quantity,
        total: product.price * item.quantity
      });
    }

    const data = {
      cart_items: cartItems,
      unavailable_items: unavailableItems,
      total_added: cartItems.length,
      total_unavailable: unavailableItems.length
    };

    const message = unavailableItems.length > 0 
      ? 'Một số sản phẩm không thể thêm vào giỏ hàng' 
      : 'Đã thêm tất cả sản phẩm vào giỏ hàng';

    return response.sendSuccess(res, data, message, 200);

  } catch (error) {
    console.error('Reorder error:', error);
    return response.sendError(res, 'Có lỗi xảy ra khi đặt lại đơn hàng', 500, error.message);
  }
};

// Create new order
export const createOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      items,
      shipping_info,
      payment_method,
      notes = ''
    } = req.body;
    

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return response.sendError(res, 'Danh sách sản phẩm không được để trống', 400);
    }

    if (!shipping_info || !shipping_info.name || !shipping_info.phone || !shipping_info.address) {
      return response.sendError(res, 'Thông tin giao hàng không đầy đủ', 400);
    }

    if (!payment_method) {
      return response.sendError(res, 'Phương thức thanh toán không được để trống', 400);
    }

    // Generate order number
    const orderNumber = `ORD${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Calculate totals and validate products
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      // Validate product_id format
      if (!mongoose.Types.ObjectId.isValid(item.product_id)) {
        return response.sendError(res, `ID sản phẩm ${item.product_id} không hợp lệ`, 400);
      }

      const product = await Product.findById(item.product_id);
      
      if (!product) {
        return response.sendError(res, `Sản phẩm với ID ${item.product_id} không tồn tại`, 400);
      }

      // Validate quantity
      if (!item.quantity || item.quantity < 1) {
        return response.sendError(res, `Số lượng sản phẩm ${product.name} không hợp lệ`, 400);
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product_id: product._id,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal
      });
    }

    // Calculate shipping fee (you can implement your logic here)
    const shippingFee = totalAmount >= 500000 ? 0 : 30000; // Free shipping for orders >= 500k
    totalAmount += shippingFee;

    // Create order
    const newOrder = new Order({
      user_id: userId,
      order_number: orderNumber,
      items: orderItems,
      total_amount: totalAmount,
      shipping_fee: shippingFee,
      payment_method,
      shipping_info,
      notes,
      status: 'pending'
    });

    await newOrder.save();

    // Populate the created order
    const populatedOrder = await Order.findById(newOrder._id)
      .populate('items.product_id', 'name images price')
      .populate('user_id', 'name email phone')
      .lean();

    const data = {
      order: populatedOrder
    };

    return response.sendSuccess(res, data, 'Đặt hàng thành công', 201);

  } catch (error) {
    console.error('Create order error:', error);
    return response.sendError(res, 'Có lỗi xảy ra khi tạo đơn hàng', 500, error.message);
  }
};

// ✅ Get order statistics
export const getOrderStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return response.sendError(res, 'ID người dùng không hợp lệ', 400);
    }

    const stats = await Order.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total_amount: { $sum: '$total_amount' }
        }
      }
    ]);

    const formattedStats = {
      total: 0,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      total_amount: 0
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
      formattedStats.total_amount += stat.total_amount;
    });

    const data = {
      stats: formattedStats
    };

    return response.sendSuccess(res, data, 'Lấy thống kê đơn hàng thành công', 200);

  } catch (error) {
    console.error('Get order stats error:', error);
    return response.sendError(res, 'Có lỗi xảy ra khi lấy thống kê đơn hàng', 500, error.message);
  }
};