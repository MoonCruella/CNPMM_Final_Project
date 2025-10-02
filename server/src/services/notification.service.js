import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';
import Order from '../models/order.model.js';
import { getIO } from '../config/socket.js';

// Service để tạo và gửi thông báo
const createNotification = async (data) => {
  try {
    const { recipient_id, type, title, message, reference_id, reference_model, sender_id } = data;
    
    // Tạo thông báo trong database
    const notification = await Notification.create({
      recipient_id,
      type,
      title,
      message,
      reference_id,
      reference_model,
      sender_id: sender_id || null
    });
    
    // Populate sender nếu có
    const populatedNotification = await Notification.findById(notification._id)
      .populate('sender_id', 'name avatar');
    
    // Emit event qua socket
    const io = getIO();
    io.to(`user:${recipient_id}`).emit('new_notification', populatedNotification);
    
    // Emit số lượng thông báo chưa đọc
    const unreadCount = await Notification.countUnread(recipient_id);
    io.to(`user:${recipient_id}`).emit('notification_count', { count: unreadCount });
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Gửi thông báo cho sellers
const notifySellers = async (data) => {
  try {
    const { type, title, message, reference_id, reference_model, sender_id } = data;
    
    // Lấy danh sách seller
    const sellers = await User.find({ role: 'seller' });
    
    // Tạo thông báo cho từng seller
    const notifications = [];
    for (const seller of sellers) {
      const notification = await createNotification({
        recipient_id: seller._id,
        type,
        title,
        message,
        reference_id,
        reference_model,
        sender_id
      });
      notifications.push(notification);
    }
    
    // Emit event đến room seller
    const io = getIO();
    io.to('seller').emit('seller_notification', {
      type,
      title,
      message,
      reference_id,
      reference_model,
      created_at: new Date()
    });
    
    return notifications;
  } catch (error) {
    console.error('Error notifying sellers:', error);
    throw error;
  }
};

// Thông báo đơn hàng mới cho seller
const notifyNewOrder = async (order) => {
  return notifySellers({
    type: 'new_order',
    title: 'Đơn hàng mới',
    message: `Có đơn hàng mới #${order.order_number} với giá trị ${order.total_amount.toLocaleString('vi-VN')}đ`,
    reference_id: order._id,
    reference_model: 'Order',
    sender_id: order.user_id
  });
};

// Thông báo đánh giá mới cho seller
const notifyNewRating = async (rating) => {
  return notifySellers({
    type: 'new_rating',
    title: 'Đánh giá mới',
    message: `Có đánh giá mới ${rating.rating} sao cho sản phẩm`,
    reference_id: rating._id,
    reference_model: 'Rating',
    sender_id: rating.user_id
  });
};

// Thông báo sản phẩm mới cho người dùng
const notifyNewProduct = async (product) => {
  try {
    // Lấy danh sách user không phải seller
    const users = await User.find({ role: { $ne: 'seller' } });
    
    // Tạo thông báo cho từng user
    const notifications = [];
    for (const user of users) {
      const notification = await createNotification({
        recipient_id: user._id,
        type: 'new_product',
        title: 'Sản phẩm mới',
        message: `Sản phẩm mới "${product.name}" đã được thêm vào cửa hàng`,
        reference_id: product._id,
        reference_model: 'Product'
      });
      notifications.push(notification);
    }
    
    return notifications;
  } catch (error) {
    console.error('Error notifying new product:', error);
    throw error;
  }
};

// Thông báo bình luận mới cho seller
const notifyNewComment = async (comment, productId, productName) => {
  return notifySellers({
    type: 'new_comment',
    title: 'Bình luận mới',
    message: `Có bình luận mới cho sản phẩm "${productName}"`,
    reference_id: productId,
    reference_model: 'Product',
    sender_id: comment.user_id
  });
};

const notifyOrderStatusUpdate = async (order, previousStatus) => {
  try {
    // Lấy thông tin đầy đủ của đơn hàng
    const populatedOrder = await order.populate('user_id', 'name email');
    
    // Tạo tiêu đề và nội dung thông báo dựa trên trạng thái mới
    let title, message;
    switch(order.status) {
      case 'confirmed':
        title = 'Đơn hàng đã xác nhận';
        message = `Đơn hàng #${order.order_number} của bạn đã được xác nhận và đang chờ xử lý`;
        break;
      case 'processing':
        title = 'Đơn hàng đang xử lý';
        message = `Đơn hàng #${order.order_number} của bạn đang được chuẩn bị`;
        break;
      case 'shipped':
        title = 'Đơn hàng đang giao';
        message = `Đơn hàng #${order.order_number} của bạn đang được giao${order.tracking_number ? `. Mã vận đơn: ${order.tracking_number}` : ''}`;
        break;
      case 'delivered':
        title = 'Đơn hàng đã giao thành công';
        message = `Đơn hàng #${order.order_number} của bạn đã được giao thành công. Cảm ơn bạn đã mua sắm!`;
        break;
      case 'cancelled':
        title = 'Đơn hàng đã hủy';
        message = `Đơn hàng #${order.order_number} của bạn đã bị hủy${order.cancel_reason ? ` với lý do: ${order.cancel_reason}` : ''}`;
        break;
      default:
        title = 'Cập nhật đơn hàng';
        message = `Đơn hàng #${order.order_number} của bạn đã được cập nhật từ ${previousStatus} sang ${order.status}`;
    }
    
    // Tạo thông báo cho người dùng
    const notification = await createNotification({
      recipient_id: order.user_id._id,
      type: 'order_status',
      title: title,
      message: message,
      reference_id: order._id,
      reference_model: 'Order'
    });
    
    // Gửi cập nhật trực tiếp đến phòng của người dùng cụ thể
    const io = getIO();
    io.to(`user:${order.user_id._id}`).emit('order_status_update', {
      order_id: order._id,
      order_number: order.order_number,
      previous_status: previousStatus,
      new_status: order.status,
      updated_at: new Date(),
      tracking_number: order.tracking_number || null,
      carrier: order.carrier || null
    });
    
    return notification;
  } catch (error) {
    console.error('Error sending order status notification:', error);
    throw error;
  }
};

export { 
  createNotification, 
  notifySellers, 
  notifyNewOrder, 
  notifyNewRating, 
  notifyNewProduct,
  notifyNewComment,
  notifyOrderStatusUpdate
};