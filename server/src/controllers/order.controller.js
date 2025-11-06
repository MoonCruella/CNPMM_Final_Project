import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import Voucher from "../models/voucher.model.js";
import mongoose from "mongoose";
import response from "../helpers/response.js";
import * as notificationService from "../services/notification.service.js";
import CartItem from "../models/cart.model.js";
import {
  createFuzzyMongoQuery,
  sortByRelevance,
  removeVietnameseTones,
  createVietnameseRegex,
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

    //  Get orders without populating product_id - use hardcoded data
    const orders = await Order.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    //  Enrich items with product existence check
    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const enrichedItems = await Promise.all(
          order.items.map(async (item) => {
            const productExists = await Product.exists({
              _id: item.product_id,
            });
            return {
              ...item,
              product_exists: !!productExists,
              product_deleted: !productExists,
            };
          })
        );
        return {
          ...order,
          items: enrichedItems,
        };
      })
    );

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / parseInt(limit));

    // Calculate order statistics
    const allUserOrders = await Order.find({ user_id: userId }).lean();
    const orderStats = {
      total: allUserOrders.length,
      pending: allUserOrders.filter((order) => order.status === "pending")
        .length,
      confirmed: allUserOrders.filter((order) => order.status === "confirmed")
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
      orders: enrichedOrders,
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

export const getUserOrdersByAdmin = async (req, res) => {
  try {
    const userId = req.params?.userId ?? req.query?.userId ?? null;
    const {
      status = "all",
      page = 1,
      limit = 10,
      sort = "created_at",
      order = "desc",
    } = req.query;

    // validate userId
    if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
      return response.sendError(res, "ID người dùng không hợp lệ", 400);
    }

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

    // Get orders without populating product_id - use hardcoded data
    const orders = await Order.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Enrich items with product existence check
    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const enrichedItems = await Promise.all(
          order.items.map(async (item) => {
            const productExists = await Product.exists({
              _id: item.product_id,
            });
            return {
              ...item,
              product_exists: !!productExists,
              product_deleted: !productExists,
            };
          })
        );
        return {
          ...order,
          items: enrichedItems,
        };
      })
    );

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / parseInt(limit));

    // Calculate order statistics
    const allUserOrders = await Order.find({ user_id: userId }).lean();
    const orderStats = {
      total: allUserOrders.length,
      pending: allUserOrders.filter((order) => order.status === "pending")
        .length,
      confirmed: allUserOrders.filter((order) => order.status === "confirmed")
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
      orders: enrichedOrders,
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
    const userRole = req.user.role;

    // Validate orderId format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return response.sendError(res, "ID đơn hàng không hợp lệ", 400);
    }

    //  Build query based on role
    let query = { _id: orderId };

    // Nếu không phải admin/seller, chỉ cho phép xem đơn hàng của chính mình
    if (userRole !== "admin" && userRole !== "seller") {
      query.user_id = userId;
    }

    //  Find order - KHÔNG populate product_id nữa, dùng hardcoded data
    const order = await Order.findOne(query)
      .populate({
        path: "user_id",
        select: "name email phone",
      })
      .lean();

    if (!order) {
      return response.sendError(
        res,
        userRole === "admin" || userRole === "seller"
          ? "Không tìm thấy đơn hàng"
          : "Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập",
        404
      );
    }

    // Enrich items with product existence check (optional)
    const enrichedItems = await Promise.all(
      order.items.map(async (item) => {
        const productExists = await Product.exists({ _id: item.product_id });
        return {
          ...item,
          product_exists: !!productExists,
          product_deleted: !productExists,
        };
      })
    );

    //  Add order timeline
    const timeline = [
      {
        status: "pending",
        label: "Đơn hàng mới",
        date: order.created_at,
        completed: true,
        description: "Đơn hàng đã được tạo",
      },
      {
        status: "confirmed",
        label: "Đã xác nhận",
        date: order.confirmed_at,
        completed: ["confirmed", "processing", "shipped", "delivered"].includes(
          order.status
        ),
        description: "Đơn hàng đã được xác nhận",
      },
      {
        status: "processing",
        label: "Đang chuẩn bị",
        date: order.processing_at,
        completed: ["processing", "shipped", "delivered"].includes(
          order.status
        ),
        description: "Shop đang chuẩn bị hàng",
      },
      {
        status: "shipped",
        label: "Đang giao hàng",
        date: order.shipped_at,
        completed: ["shipped", "delivered"].includes(order.status),
        description: "Đơn hàng đang được giao",
      },
      {
        status: "delivered",
        label: "Đã giao thành công",
        date: order.delivered_at,
        completed: order.status === "delivered",
        description: "Đơn hàng đã giao thành công",
      },
    ];

    //  Add cancelled step if applicable
    if (order.status === "cancelled" || order.cancelled_at) {
      timeline.push({
        status: "cancelled",
        label: "Đã hủy",
        date: order.cancelled_at,
        completed: order.status === "cancelled",
        description: order.cancel_reason || "Đơn hàng đã bị hủy",
      });
    }

    //  Add cancel request step if applicable
    if (order.status === "cancel_request" || order.cancel_requested_at) {
      timeline.push({
        status: "cancel_request",
        label: "Yêu cầu hủy",
        date: order.cancel_requested_at,
        completed: order.status === "cancel_request",
        description: order.cancel_reason || "Đang chờ shop xác nhận hủy",
      });
    }

    const data = {
      order: {
        ...order,
        items: enrichedItems, //  Use enriched items with product existence flag
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
    const timeElapsed = now - order.created_at;
    const thirtyMinutes = 30 * 60 * 1000;

    //  Cho phép hủy trực tiếp nếu:
    // 1. Status là "pending" hoặc "confirmed"
    // 2. Trong vòng 30 phút kể từ khi tạo đơn
    const canDirectCancel =
      ["pending", "confirmed"].includes(order.status) &&
      timeElapsed <= thirtyMinutes;

    if (canDirectCancel) {
      //  Hủy trực tiếp
      order.status = "cancelled";
      order.cancelled_at = now;
      order.cancel_reason = reason;

      order.history = order.history || [];
      order.history.push({
        status: "cancelled",
        date: now,
        note: reason || "Khách hàng hủy đơn hàng",
      });

      await order.save();

      try {
        await notificationService.notifyOrderCancelled(order);
      } catch (notifyError) {
        console.error("Error sending cancellation notification:", notifyError);
      }

      return response.sendSuccess(
        res,
        { order },
        "Hủy đơn hàng thành công",
        200
      );
    }
    // Nếu đã quá 30 phút nhưng vẫn ở pending/confirmed hoặc đang processing
    // → Gửi yêu cầu hủy
    else if (["pending", "confirmed", "processing"].includes(order.status)) {
      order.status = "cancel_request";
      order.cancel_reason = reason;
      order.cancel_requested_at = now;

      order.history = order.history || [];
      order.history.push({
        status: "cancel_request",
        date: now,
        note: reason || "Yêu cầu hủy đơn hàng",
      });

      await order.save();

      try {
        await notificationService.notifyCancelRequest(order);
      } catch (notifyError) {
        console.error(
          "Error sending cancel request notification:",
          notifyError
        );
      }

      return response.sendSuccess(
        res,
        { order },
        "Đã gửi yêu cầu hủy đơn hàng đến shop",
        200
      );
    } else {
      // Các trạng thái khác không thể hủy
      return response.sendError(
        res,
        `Không thể hủy đơn hàng ở trạng thái "${order.status}". Vui lòng liên hệ shop để được hỗ trợ.`,
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
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const orders = await Order.find({
      status: "pending",
      created_at: { $lte: thirtyMinutesAgo },
    });

    for (const order of orders) {
      order.status = "confirmed";
      order.confirmed_at = new Date();
      await order.save();

      // Send notification to user
      try {
        await notificationService.notifyOrderAutoConfirmed(order);
        console.log(
          `Sent auto-confirm notification for order ${order.order_number}`
        );
      } catch (notifyError) {
        console.error(
          `Error sending auto-confirm notification for order ${order.order_number}:`,
          notifyError
        );
      }
    }

    return orders.length;
  } catch (error) {
    console.error("Auto-confirm orders error:", error);
    throw error;
  }
};

//   Reorder - Add items to cart again
export const reorder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;

    // Validate orderId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return response.sendError(res, "ID đơn hàng không hợp lệ", 400);
    }

    // Find order
    const order = await Order.findOne({
      _id: orderId,
      user_id: userId,
    }).lean();

    if (!order) {
      return response.sendError(
        res,
        "Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập",
        404
      );
    }

    const unavailableItems = [];
    let addedCount = 0;

    //  Process each order item
    for (const item of order.items) {
      const productId = item.product_id.toString();

      // Fetch product
      const product = await Product.findById(productId);

      if (!product) {
        unavailableItems.push({
          name: "Sản phẩm không tồn tại",
          reason: "Sản phẩm đã bị xóa",
        });
        continue;
      }

      // Check status
      if (product.status === "inactive") {
        unavailableItems.push({
          name: product.name,
          reason: "Sản phẩm không còn bán",
        });
        continue;
      }

      // Check stock
      if (product.stock < item.quantity) {
        unavailableItems.push({
          name: product.name,
          reason: `Chỉ còn ${product.stock} sản phẩm`,
        });
        continue;
      }

      // Check if already in cart
      let cartItem = await CartItem.findOne({
        user_id: userId,
        product_id: productId,
      });

      if (cartItem) {
        // Update quantity
        const newQuantity = cartItem.quantity + item.quantity;

        if (newQuantity > product.stock) {
          cartItem.quantity = product.stock;
          unavailableItems.push({
            name: product.name,
            reason: `Đã tăng số lượng lên tối đa ${product.stock}`,
          });
        } else {
          cartItem.quantity = newQuantity;
        }

        await cartItem.save();
      } else {
        // Create new cart item
        cartItem = new CartItem({
          user_id: userId,
          product_id: productId,
          quantity: item.quantity,
        });

        await cartItem.save();
        console.log(
          "➕ Added new cart item:",
          product.name,
          "qty:",
          item.quantity
        );
      }

      addedCount++;
    }

    //  Get all cart items for response
    const cartItems = await CartItem.find({ user_id: userId })
      .populate("product_id", "name images price sale_price stock status")
      .sort({ updated_at: -1 });

    const data = {
      cart: { items: cartItems },
      unavailable_items: unavailableItems,
      total_added: addedCount,
      total_unavailable: unavailableItems.length,
    };

    const message =
      unavailableItems.length > 0
        ? `Đã thêm ${addedCount} sản phẩm vào giỏ hàng. ${unavailableItems.length} sản phẩm không khả dụng.`
        : `Đã thêm ${addedCount} sản phẩm vào giỏ hàng`;

    return response.sendSuccess(res, data, message, 200);
  } catch (error) {
    console.error("❌ Reorder error:", error);
    return response.sendError(
      res,
      "Có lỗi xảy ra khi đặt lại đơn hàng",
      500,
      error.message
    );
  }
};

// Create new order
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

    let subtotal = 0; // Tổng tiền sản phẩm
    const orderItems = [];

    // Process each item with hardcoded data
    for (const item of items) {
      if (!mongoose.Types.ObjectId.isValid(item.product_id)) {
        return response.sendError(
          res,
          `ID sản phẩm ${item.product_id} không hợp lệ`,
          400
        );
      }

      // Populate full product data
      const product = await Product.findById(item.product_id)
        .populate("category_id", "name")
        .lean();

      if (!product) {
        return response.sendError(
          res,
          `Sản phẩm với ID ${item.product_id} không tồn tại`,
          400
        );
      }

      if (product.status !== "active") {
        return response.sendError(
          res,
          `Sản phẩm ${product.name} không còn bán`,
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

      if (product.stock_quantity < item.quantity) {
        return response.sendError(
          res,
          `Sản phẩm ${product.name} chỉ còn ${product.stock_quantity} sản phẩm`,
          400
        );
      }

      //  Get primary image
      const primaryImage = product.images?.find((img) => img.is_primary);
      const productImage =
        primaryImage?.image_url || product.images?.[0]?.image_url || "";

      // Calculate prices
      const salePrice = product.sale_price || 0;
      const finalPrice =
        salePrice > 0 && salePrice < product.price ? salePrice : product.price;
      const itemTotal = finalPrice * item.quantity;
      const discountAmount = product.price - finalPrice;
      const discountPercent =
        discountAmount > 0
          ? Math.round((discountAmount / product.price) * 100)
          : 0;

      subtotal += itemTotal;

      // Create order item with hardcoded data
      orderItems.push({
        product_id: product._id,
        // Hardcoded product info
        product_name: product.name,
        product_slug: product.slug,
        product_image: productImage,
        product_description:
          product.description || product.short_description || "",
        category_name: product.category_id?.name || "",
        category_id: product.category_id?._id,
        // Pricing
        quantity: item.quantity,
        price: finalPrice,
        sale_price: salePrice,
        original_price: product.price,
        total: itemTotal,
        // Additional info
        sku: product.sku,
        weight: product.weight,
        unit: product.unit || "sản phẩm",
        // Variant
        variant: item.variant || {},
        // Discount
        discount_percent: discountPercent,
        discount_amount: discountAmount,
        // Product status
        was_on_sale: salePrice > 0 && salePrice < product.price,
        was_featured: product.featured || false,
        // Hometown
        hometown_origin: product.hometown_origin || {},
        created_at: new Date(),
      });
    }

    // Tính total_amount = subtotal + shipping_fee - discount - freeship
    const shippingFee = 30000;
    const totalAmount =
      subtotal + shippingFee - (discount_value || 0) - (freeship_value || 0);

    // Tạo đơn với hardcoded items
    const newOrder = new Order({
      user_id: userId,
      order_number: orderNumber,
      items: orderItems,
      subtotal: subtotal,
      total_amount: totalAmount,
      shipping_fee: shippingFee,
      freeship_value: freeship_value || 0,
      discount_value: discount_value || 0,
      payment_method,
      shipping_info,
      notes,
      status: "pending",
      history: [
        {
          status: "pending",
          date: new Date(),
          note: "Đơn hàng được tạo",
        },
      ],
    });

    await newOrder.save();

    // Update product stock and sold quantity
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product_id, {
        $inc: {
          stock_quantity: -item.quantity,
          sold_quantity: item.quantity,
          purchase_count: 1,
        },
      });
    }

    // Clear cart
    await CartItem.deleteMany({ user_id: userId });

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

    // Không populate nữa, dùng hardcoded data
    const createdOrder = await Order.findById(newOrder._id)
      .populate("user_id", "name email phone")
      .lean();

    const data = {
      order: createdOrder,
    };

    // Send notification
    try {
      await notificationService.notifyNewOrder(newOrder);
    } catch (notifyError) {
      console.error("Error sending notification:", notifyError);
    }

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
      startDate, //
      endDate, //
    } = req.query;

    const filter = {};
    if (status && status !== "all") {
      filter.status = status;
    }

    //  Add date range filter
    if (startDate || endDate) {
      filter.created_at = {};
      if (startDate) {
        filter.created_at.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        filter.created_at.$lte = endDateTime;
      }
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

    //  Calculate statistics (respect date filter)
    const statsFilter =
      startDate || endDate
        ? {
            created_at: {
              ...(startDate ? { $gte: new Date(startDate) } : {}),
              ...(endDate
                ? {
                    $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
                  }
                : {}),
            },
          }
        : {};

    const allOrders = await Order.find(statsFilter).lean();

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
        filter: {
          status,
          sort,
          order,
          startDate: startDate || null,
          endDate: endDate || null,
        },
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
      startDate, //
      endDate, //
    } = req.query;

    if (!q || q.trim() === "") {
      return response.sendError(res, "Vui lòng nhập từ khóa tìm kiếm", 400);
    }

    const normalizedQuery = removeVietnameseTones(q.toLowerCase());
    const words = normalizedQuery.split(/\s+/).filter(Boolean);

    // Build base filter
    const filter = {};

    if (req.user.role === "user") {
      filter.user_id = req.user.userId;
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.created_at = {};
      if (startDate) {
        filter.created_at.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        filter.created_at.$lte = endDateTime;
      }
    }

    const productSearchConditions = words.flatMap((word) => {
      const normalizedPattern = { name: { $regex: word, $options: "i" } };
      const vietnamesePattern = createVietnameseRegex(word);

      return [normalizedPattern, { name: vietnamesePattern }];
    });

    const matchingProducts = await Product.find({
      $or: productSearchConditions,
    })
      .select("_id name")
      .lean();

    const matchingProductIds = matchingProducts.map((p) => p._id);

    //  Order number search
    const orderNumberSearchConditions = words.flatMap((word) => {
      return [
        { order_number: { $regex: word, $options: "i" } },
        { order_number: createVietnameseRegex(word) },
      ];
    });

    const searchConditions = [];

    if (orderNumberSearchConditions.length > 0) {
      searchConditions.push({ $or: orderNumberSearchConditions });
    }

    if (matchingProductIds.length > 0) {
      searchConditions.push({
        "items.product_id": { $in: matchingProductIds },
      });
    }

    if (searchConditions.length === 0) {
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
          },
        },
        "Không tìm thấy đơn hàng nào",
        200
      );
    }

    filter.$or = searchConditions;

    // Execute query with pagination
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

    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / parseInt(limit));

    // STEP 5: Sort by relevance
    const sortedResults = sortByRelevance(orders, q, [
      "order_number",
      "items.product_id.name",
    ]);

    const ordersWithScores = sortedResults.map((result) => ({
      ...result.item,
      relevance_score: result.score.toFixed(2),
    }));

    // Calculate statistics
    const matchedByOrderNumber = orders.filter((order) => {
      const normalized = removeVietnameseTones(
        order.order_number.toLowerCase()
      );
      return words.some((word) => normalized.includes(word));
    }).length;

    const matchedByProductName = orders.filter((order) =>
      order.items.some((item) => {
        const productName = removeVietnameseTones(
          item.product_id?.name || ""
        ).toLowerCase();
        return words.some((word) => productName.includes(word));
      })
    ).length;

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
          startDate: startDate || null,
          endDate: endDate || null,
        },
      },
      `Tìm thấy ${totalOrders} đơn hàng phù hợp`,
      200
    );
  } catch (error) {
    console.error("Search orders error:", error);
    return response.sendError(
      res,
      "Có lỗi xảy ra khi tìm kiếm đơn hàng",
      500,
      error.message
    );
  }
};
