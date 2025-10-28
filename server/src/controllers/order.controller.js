import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import Voucher from "../models/voucher.model.js";
import mongoose from "mongoose";
import response from "../helpers/response.js";
import * as notificationService from "../services/notification.service.js";
import { 
  createFuzzyMongoQuery, 
  sortByRelevance, 
  removeVietnameseTones,
  createVietnameseRegex 
} from "../utils/fuzzySearch.js";
//Get user orders with filter and pagination
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      status = "all",
      page = 1,
      limit = 10,
      sort = "created_at",
      order = "desc",
    } = req.query;

    // Build filter object
    const filter = { user_id: userId };
    if (status && status !== "all") {
      filter.status = status;
    }

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === "desc" ? -1 : 1;

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get orders with pagination
    const orders = await Order.find(filter)
      .populate({
        path: "items.product_id",
        select: "name images price category brand",
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
      pending: allUserOrders.filter((order) => order.status === "pending")
        .length,
      confirmed: allUserOrders.filter((order) => order.status == "confirmed")
        .length,
      processing: allUserOrders.filter((order) => order.status === "processing")
        .length,
      shipped: allUserOrders.filter((order) => order.status === "shipped")
        .length,
      delivered: allUserOrders.filter((order) => order.status === "delivered")
        .length,
      cancel_request: allUserOrders.filter((o) => o.status === "cancel_request")
        .length,
      cancelled: allUserOrders.filter((order) => order.status === "cancelled")
        .length,
      totalAmount: allUserOrders.reduce(
        (sum, order) => sum + (order.total_amount || 0),
        0
      ),
    };

    const data = {
      orders,
      pagination: {
        current_page: parseInt(page),
        total_pages: totalPages,
        total_orders: totalOrders,
        per_page: parseInt(limit),
        has_next: parseInt(page) < totalPages,
        has_prev: parseInt(page) > 1,
      },
      stats: orderStats,
      filter: {
        status,
        sort,
        order,
      },
    };

    return response.sendSuccess(
      res,
      data,
      "Lấy danh sách đơn hàng thành công",
      200
    );
  } catch (error) {
    console.error("Get user orders error:", error);
    return response.sendError(
      res,
      "Có lỗi xảy ra khi lấy danh sách đơn hàng",
      500,
      error.message
    );
  }
};

// Get order by ID
export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;

    // Validate orderId format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return response.sendError(res, "ID đơn hàng không hợp lệ", 400);
    }

    // Find order and verify ownership
    const order = await Order.findOne({
      _id: orderId,
      user_id: userId,
    })
      .populate({
        path: "items.product_id",
        select: "name images price category brand description",
      })
      .populate({
        path: "user_id",
        select: "name email phone",
      })
      .lean();

    if (!order) {
      return response.sendError(
        res,
        "Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập",
        404
      );
    }

    // Add order timeline
    const timeline = [
      {
        status: "pending",
        label: "Đơn hàng mới",
        date: order.created_at,
        completed: order.status !== "pending",
        description: "Đơn hàng đã được tạo",
      },
      {
        status: "confirmed",
        label: "Đã xác nhận đơn hàng",
        date: order.confirmed_at,
        completed: ["processing", "shipped", "delivered", "cancelled"].includes(
          order.status
        ),
        description: "Đơn hàng đã được xác nhận",
      },
      {
        status: "processing",
        label: "Shop đang chuẩn bị hàng",
        date: order.processing_at,
        completed: ["shipped", "delivered", "cancelled"].includes(order.status),
        description: "Shop đang chuẩn bị hàng",
      },
      {
        status: "shipped",
        label: "Đang giao hàng",
        date: order.shipped_at,
        completed: ["delivered", "cancelled"].includes(order.status),
        description: "Đơn hàng đang được giao",
      },
      {
        status: "delivered",
        label: "Đã giao thành công",
        date: order.delivered_at,
        completed: order.status === "delivered",
        description: "Đơn hàng đã giao thành công",
      },
      {
        status: "cancelled",
        label: "Đã hủy đơn hàng",
        date: order.cancelled_at,
        completed: order.status === "cancelled",
        description: order.cancel_reason || "Đơn hàng đã bị hủy",
      },
    ].filter((step) => step.date);

    const data = {
      order: {
        ...order,
        timeline,
      },
    };

    return response.sendSuccess(
      res,
      data,
      "Lấy thông tin đơn hàng thành công",
      200
    );
  } catch (error) {
    console.error("Get order by ID error:", error);
    return response.sendError(
      res,
      "Có lỗi xảy ra khi lấy thông tin đơn hàng",
      500,
      error.message
    );
  }
};

//  Cancel order
export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;
    const { reason = "" } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return response.sendError(res, "ID đơn hàng không hợp lệ", 400);
    }

    const order = await Order.findOne({ _id: orderId, user_id: userId });

    if (!order) {
      return response.sendError(res, "Không tìm thấy đơn hàng", 404);
    }

    const now = new Date();
    const canCancel =
      ["pending", "confirmed"].includes(order.status) &&
      now - order.created_at <= 30 * 60 * 1000;

    if (canCancel) {
      order.status = "cancelled";
      order.cancelled_at = now;
      order.cancel_reason = reason;
      await order.save();
      return response.sendSuccess(
        res,
        { order },
        "Hủy đơn hàng thành công",
        200
      );
    } else if (order.status === "processing") {
      // Chuyển sang trạng thái yêu cầu hủy
      order.status = "cancel_request";
      await order.save();
      return response.sendSuccess(
        res,
        { order },
        "Đã gửi yêu cầu hủy đơn hàng đến shop",
        200
      );
    } else {
      return response.sendError(
        res,
        "Không thể hủy đơn hàng ở trạng thái này",
        400
      );
    }
  } catch (error) {
    return response.sendError(
      res,
      "Có lỗi xảy ra khi hủy đơn hàng",
      500,
      error.message
    );
  }
};
export const autoConfirmOrders = async () => {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  const orders = await Order.find({
    status: "pending",
    created_at: { $lte: thirtyMinutesAgo },
  });

  for (const order of orders) {
    order.status = "confirmed";
    order.confirmed_at = new Date();
    await order.save();
  }
};

//   Reorder - Add items to cart again
export const reorder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;

    // Validate orderId format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return response.sendError(res, "ID đơn hàng không hợp lệ", 400);
    }

    // Find order and verify ownership
    const order = await Order.findOne({
      _id: orderId,
      user_id: userId,
    })
      .populate("items.product_id")
      .lean();

    if (!order) {
      return response.sendError(
        res,
        "Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập",
        404
      );
    }

    // Check if order can be reordered
    if (!["delivered", "cancelled"].includes(order.status)) {
      return response.sendError(
        res,
        "Chỉ có thể đặt lại đơn hàng đã giao hoặc đã hủy",
        400
      );
    }

    // Prepare cart items
    const cartItems = [];
    const unavailableItems = [];

    for (const item of order.items) {
      const product = item.product_id;

      if (!product) {
        unavailableItems.push({
          name: "Sản phẩm không tồn tại",
          reason: "Sản phẩm đã bị xóa",
        });
        continue;
      }

      // Check product availability (assuming you have stock field)
      if (product.stock < item.quantity) {
        unavailableItems.push({
          name: product.name,
          reason: `Chỉ còn ${product.stock} sản phẩm trong kho`,
        });
        continue;
      }

      cartItems.push({
        product_id: product._id,
        name: product.name,
        price: product.price, // Use current price
        quantity: item.quantity,
        total: product.price * item.quantity,
        sale_price: product.sale_price || null,
      });
    }

    const data = {
      cart_items: cartItems,
      unavailable_items: unavailableItems,
      total_added: cartItems.length,
      total_unavailable: unavailableItems.length,
    };

    const message =
      unavailableItems.length > 0
        ? "Một số sản phẩm không thể thêm vào giỏ hàng"
        : "Đã thêm tất cả sản phẩm vào giỏ hàng";

    return response.sendSuccess(res, data, message, 200);
  } catch (error) {
    console.error("Reorder error:", error);
    return response.sendError(
      res,
      "Có lỗi xảy ra khi đặt lại đơn hàng",
      500,
      error.message
    );
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
      notes = "",
      voucherCodes = {},
      freeship_value,
      discount_value,
    } = req.body;
    const { freeship, discount } = voucherCodes;
    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return response.sendError(
        res,
        "Danh sách sản phẩm không được để trống",
        400
      );
    }

    if (
      !shipping_info ||
      !shipping_info.name ||
      !shipping_info.phone ||
      !shipping_info.address
    ) {
      return response.sendError(res, "Thông tin giao hàng không đầy đủ", 400);
    }

    if (!payment_method) {
      return response.sendError(
        res,
        "Phương thức thanh toán không được để trống",
        400
      );
    }

    // Generate order number
    const orderNumber = `ORD${Date.now()}${Math.random()
      .toString(36)
      .substr(2, 4)
      .toUpperCase()}`;

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      if (!mongoose.Types.ObjectId.isValid(item.product_id)) {
        return response.sendError(
          res,
          `ID sản phẩm ${item.product_id} không hợp lệ`,
          400
        );
      }

      const product = await Product.findById(item.product_id);
      if (!product) {
        return response.sendError(
          res,
          `Sản phẩm với ID ${item.product_id} không tồn tại`,
          400
        );
      }

      if (!item.quantity || item.quantity < 1) {
        return response.sendError(
          res,
          `Số lượng sản phẩm ${product.name} không hợp lệ`,
          400
        );
      }

      const itemTotal = product.sale_price
        ? product.sale_price * item.quantity
        : product.price * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product_id: product._id,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal,
        sale_price: product.sale_price || null,
      });
    }

    const shippingFee = 30000;
    totalAmount += shippingFee;
    totalAmount -= discount_value || 0;
    totalAmount -= freeship_value || 0;

    // Tạo đơn
    const newOrder = new Order({
      user_id: userId,
      order_number: orderNumber,
      items: orderItems,
      total_amount: totalAmount,
      shipping_fee: shippingFee,
      freeship_value: freeship_value || 0,
      discount_value: discount_value || 0,
      payment_method,
      shipping_info,
      notes,
      status: "pending",
    });

    await newOrder.save();

    // Tăng usedCount cho voucher freeship nếu có
    if (freeship) {
      await Voucher.findOneAndUpdate(
        { code: freeship },
        { $inc: { usedCount: 1 } }
      );
    }

    // Tăng usedCount cho voucher discount nếu có
    if (discount) {
      await Voucher.findOneAndUpdate(
        { code: discount },
        { $inc: { usedCount: 1 } }
      );
    }

    // Populate the created order
    const populatedOrder = await Order.findById(newOrder._id)
      .populate("items.product_id", "name images price sale_price")
      .populate("user_id", "name email phone")
      .lean();

    const data = {
      order: populatedOrder,
    };
    await notificationService.notifyNewOrder(newOrder);

    return response.sendSuccess(res, data, "Đặt hàng thành công", 201);
  } catch (error) {
    console.error("Create order error:", error);
    return response.sendError(
      res,
      "Có lỗi xảy ra khi tạo đơn hàng",
      500,
      error.message
    );
  }
};

// Get order statistics
export const getOrderStats = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return response.sendError(res, "ID người dùng không hợp lệ", 400);
    }

    const stats = await Order.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          total_amount: { $sum: "$total_amount" },
        },
      },
    ]);

    const formattedStats = {
      total: 0,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      total_amount: 0,
    };

    stats.forEach((stat) => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
      formattedStats.total_amount += stat.total_amount;
    });

    const data = {
      stats: formattedStats,
    };

    return response.sendSuccess(
      res,
      data,
      "Lấy thống kê đơn hàng thành công",
      200
    );
  } catch (error) {
    console.error("Get order stats error:", error);
    return response.sendError(
      res,
      "Có lỗi xảy ra khi lấy thống kê đơn hàng",
      500,
      error.message
    );
  }
};

// Admin cập nhật thông tin vận chuyển đơn hàng
export const updateShippingInfo = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { carrier, tracking_number, shipping_status, note = "" } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return response.sendError(res, "ID đơn hàng không hợp lệ", 400);
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return response.sendError(res, "Không tìm thấy đơn hàng", 404);
    }

    // Không cho phép cập nhật nếu đã hủy
    if (order.status === "cancelled") {
      return response.sendError(
        res,
        "Đơn hàng đã hủy, không thể cập nhật vận chuyển",
        400
      );
    }

    // Lưu trạng thái trước khi cập nhật để thông báo
    const previousStatus = order.status;

    //   Trường hợp đặc biệt: duyệt yêu cầu hủy (cancel_request → cancelled)
    if (order.status === "cancel_request") {
      if (shipping_status === "cancelled") {
        order.status = "cancelled";
        order.cancelled_at = new Date();
        order.history = order.history || [];
        order.history.push({
          status: "cancelled",
          date: new Date(),
          note: note || "Shop đã chấp nhận yêu cầu hủy đơn",
        });
        await order.save();

        // Gửi thông báo khi đơn hàng bị hủy
        try {
          await notificationService.notifyOrderStatusUpdate(
            order,
            previousStatus
          );
        } catch (notifyError) {
          console.error(
            "Không thể gửi thông báo cập nhật đơn hàng:",
            notifyError
          );
        }

        return response.sendSuccess(
          res,
          { shipping: order },
          "Đã chấp nhận hủy đơn hàng",
          200
        );
      } else if (shipping_status) {
        return response.sendError(
          res,
          "Chỉ có thể chuyển từ yêu cầu hủy sang trạng thái 'cancelled'",
          400
        );
      }
      // Nếu không gửi shipping_status mà chỉ cập nhật carrier / tracking_number thì cũng không hợp lệ
      return response.sendError(
        res,
        "Đơn đang yêu cầu hủy, chỉ có thể xác nhận hủy",
        400
      );
    }

    // Quy định thứ tự trạng thái
    const statusOrder = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
    ];
    const currentIndex = statusOrder.indexOf(order.status);
    const nextIndex = statusOrder.indexOf(shipping_status);

    if (shipping_status && !statusOrder.includes(shipping_status)) {
      return response.sendError(res, "Trạng thái không hợp lệ", 400);
    }

    // Biến để theo dõi xem trạng thái có thay đổi không
    let statusChanged = false;

    // Chỉ cho phép chuyển sang trạng thái tiếp theo
    if (
      shipping_status &&
      (nextIndex === currentIndex + 1 || shipping_status === order.status)
    ) {
      statusChanged = shipping_status !== order.status;
      order.status = shipping_status;

      // Ghi nhận thời gian cho từng trạng thái
      if (shipping_status === "confirmed") order.confirmed_at = new Date();
      if (shipping_status === "processing") order.processing_at = new Date();
      if (shipping_status === "shipped") order.shipped_at = new Date();
      if (shipping_status === "delivered") {
        order.delivered_at = new Date();
        try {
          for (const item of order.items) {
            await Product.findByIdAndUpdate(
              item.product_id,
              {
                $inc: {
                  purchase_count: item.quantity,
                  sold_quantity: item.quantity,
                },
                $addToSet: { purchase_users: order.user_id },
              },
              { new: true }
            );
          }
          console.log(
            `Đã cập nhật số lượng người mua cho đơn hàng ${order._id}`
          );
        } catch (updateError) {
          console.error("Lỗi khi cập nhật số lượng người mua:", updateError);
        }
      }
      order.history = order.history || [];
      order.history.push({
        status: shipping_status,
        date: new Date(),
        note,
      });
    } else if (shipping_status && nextIndex > currentIndex + 1) {
      return response.sendError(
        res,
        "Không thể bỏ qua các bước trạng thái",
        400
      );
    } else if (shipping_status && nextIndex < currentIndex) {
      return response.sendError(
        res,
        "Không thể quay lại trạng thái trước",
        400
      );
    }

    // Kiểm tra xem có cập nhật carrier hoặc tracking number không
    const carrierChanged = carrier && carrier !== order.carrier;
    const trackingChanged =
      tracking_number && tracking_number !== order.tracking_number;

    if (carrier) order.carrier = carrier;
    if (tracking_number) order.tracking_number = tracking_number;

    await order.save();

    // Gửi thông báo nếu có thay đổi trạng thái hoặc thông tin vận chuyển quan trọng
    if (
      statusChanged ||
      (order.status === "shipped" && (carrierChanged || trackingChanged))
    ) {
      try {
        await notificationService.notifyOrderStatusUpdate(
          order,
          previousStatus
        );
      } catch (notifyError) {
        console.error(
          "Không thể gửi thông báo cập nhật đơn hàng:",
          notifyError
        );
      }
    }

    return response.sendSuccess(
      res,
      { shipping: order },
      "Cập nhật thông tin vận chuyển thành công",
      200
    );
  } catch (error) {
    console.error("Update shipping info error:", error);
    return response.sendError(
      res,
      "Có lỗi xảy ra khi cập nhật vận chuyển",
      500,
      error.message
    );
  }
};
export const getAllOrders = async (req, res) => {
  try {
    const {
      status = "all",
      page = 1,
      limit = 10,
      sort = "created_at",
      order = "desc",
    } = req.query;

    const filter = {};
    if (status && status !== "all") {
      filter.status = status;
    }

    const sortObj = {};
    sortObj[sort] = order === "desc" ? -1 : 1;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(filter)
      .populate({
        path: "items.product_id",
        select: "name images price category brand",
      })
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / parseInt(limit));
    // Tính thống kê cho tất cả đơn hàng (không phân trang)
    const allOrders = await Order.find({}).lean();
    const stats = {
      total: allOrders.length,
      pending: allOrders.filter((o) => o.status === "pending").length,
      confirmed: allOrders.filter((o) => o.status === "confirmed").length,
      processing: allOrders.filter((o) => o.status === "processing").length,
      shipped: allOrders.filter((o) => o.status === "shipped").length,
      delivered: allOrders.filter((o) => o.status === "delivered").length,
      cancelled: allOrders.filter((o) => o.status === "cancelled").length,
      cancel_request: allOrders.filter((o) => o.status === "cancel_request")
        .length,
      totalAmount: allOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
    };
    return response.sendSuccess(
      res,
      {
        orders,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_orders: totalOrders,
          per_page: parseInt(limit),
        },
        stats,
      },
      "Lấy danh sách đơn hàng thành công",
      200
    );
  } catch (error) {
    return response.sendError(
      res,
      "Có lỗi xảy ra khi lấy danh sách đơn hàng",
      500,
      error.message
    );
  }
};
export const searchOrders = async (req, res) => {
  try {
    const {
      q,
      status,
      page = 1,
      limit = 10,
      sort = "created_at",
      order = "desc",
    } = req.query;

    if (!q || q.trim() === '') {
      return response.sendError(res, "Vui lòng nhập từ khóa tìm kiếm", 400);
    }

    console.log('\n🔍 Searching orders with query:', q);

    const normalizedQuery = removeVietnameseTones(q.toLowerCase());
    const words = normalizedQuery.split(/\s+/).filter(Boolean);

    console.log('📝 Normalized words:', words);

    // Build base filter
    const filter = {};
    
    if (req.user.role === "user") {
      filter.user_id = req.user.userId;
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    // ✅ STEP 1: Tạo regex patterns cho CẢ có dấu VÀ không dấu
    const productSearchConditions = words.flatMap(word => {
      // Pattern 1: Tìm không dấu (normalize)
      const normalizedPattern = { name: { $regex: word, $options: 'i' } };
      
      // Pattern 2: Tìm có dấu - ✅ SỬ DỤNG createVietnameseRegex
      const vietnamesePattern = createVietnameseRegex(word);
      
      return [
        normalizedPattern,
        { name: vietnamesePattern }
      ];
    });

    console.log('🔎 Product search conditions (first 4):', 
      JSON.stringify(productSearchConditions.slice(0, 4), null, 2)
    );

    const matchingProducts = await Product.find({
      $or: productSearchConditions
    }).select('_id name').lean();

    console.log(`✅ Found ${matchingProducts.length} matching products:`, 
      matchingProducts.map(p => p.name).slice(0, 5)
    );

    const matchingProductIds = matchingProducts.map(p => p._id);

    // ✅ STEP 2: Order number search với cả có dấu và không dấu
    const orderNumberSearchConditions = words.flatMap(word => {
      return [
        { order_number: { $regex: word, $options: 'i' } },
        { order_number: createVietnameseRegex(word) } // ✅ SỬ DỤNG createVietnameseRegex
      ];
    });

    console.log('🔎 Order number search conditions (first 4):', 
      JSON.stringify(orderNumberSearchConditions.slice(0, 4), null, 2)
    );

    // ✅ STEP 3: Combine queries
    const searchConditions = [];

    if (orderNumberSearchConditions.length > 0) {
      searchConditions.push({ $or: orderNumberSearchConditions });
    }

    if (matchingProductIds.length > 0) {
      searchConditions.push({
        'items.product_id': { $in: matchingProductIds }
      });
    }

    if (searchConditions.length === 0) {
      console.log('❌ No matching products or orders');
      return response.sendSuccess(
        res,
        {
          orders: [],
          pagination: {
            current_page: parseInt(page),
            total_pages: 0,
            total_orders: 0,
            per_page: parseInt(limit),
          },
          search_query: q,
          normalized_query: normalizedQuery,
          matches: {
            by_order_number: 0,
            by_product_name: 0,
          }
        },
        "Không tìm thấy đơn hàng nào",
        200
      );
    }

    filter.$or = searchConditions;

    console.log('📋 Final filter has', searchConditions.length, 'conditions');

    // ✅ STEP 4: Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(filter)
      .populate({
        path: "items.product_id",
        select: "name images price category brand",
      })
      .populate({
        path: "user_id",
        select: "name email phone",
      })
      .sort({ [sort]: order === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    console.log(`✅ Found ${orders.length} orders from database`);

    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / parseInt(limit));

    // ✅ STEP 5: Sort by relevance (tính điểm phù hợp)
    const sortedResults = sortByRelevance(orders, q, [
      'order_number',
      'items.product_id.name'
    ]);

    console.log('🎯 Top 3 relevance scores:', 
      sortedResults.slice(0, 3).map(r => ({
        order: r.item.order_number,
        product: r.item.items[0]?.product_id?.name,
        score: r.score.toFixed(2)
      }))
    );

    const ordersWithScores = sortedResults.map(result => ({
      ...result.item,
      relevance_score: result.score.toFixed(2)
    }));

    // ✅ STEP 6: Calculate statistics
    const matchedByOrderNumber = orders.filter(order => {
      const normalized = removeVietnameseTones(order.order_number.toLowerCase());
      return words.some(word => normalized.includes(word));
    }).length;

    const matchedByProductName = orders.filter(order =>
      order.items.some(item => {
        const productName = removeVietnameseTones(item.product_id?.name || '').toLowerCase();
        return words.some(word => productName.includes(word));
      })
    ).length;

    console.log(`📊 Stats: ${matchedByOrderNumber} by order#, ${matchedByProductName} by product\n`);

    return response.sendSuccess(
      res,
      {
        orders: ordersWithScores,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_orders: totalOrders,
          per_page: parseInt(limit),
          has_next: parseInt(page) < totalPages,
          has_prev: parseInt(page) > 1,
        },
        search_query: q,
        normalized_query: normalizedQuery,
        search_words: words,
        matches: {
          by_order_number: matchedByOrderNumber,
          by_product_name: matchedByProductName,
          total: totalOrders,
        },
        filter: {
          status,
          sort,
          order,
        }
      },
      `Tìm thấy ${totalOrders} đơn hàng phù hợp`,
      200
    );

  } catch (error) {
    console.error("❌ Search orders error:", error);
    return response.sendError(
      res,
      "Có lỗi xảy ra khi tìm kiếm đơn hàng",
      500,
      error.message
    );
  }
};