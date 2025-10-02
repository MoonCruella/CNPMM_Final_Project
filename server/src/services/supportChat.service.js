import { SupportMessage, SupportConversation } from '../models/supportChat.model.js';
import User from '../models/user.model.js';
import { v4 as uuidv4 } from 'uuid';
import { getIO } from '../config/socket.js';

class SupportChatService {
  async getOrCreateConversation(customerId) {
    const customer = await User.findById(customerId);
    if (!customer) throw new Error('Customer not found');

    let conversation = await SupportConversation.findOne({
      customerId,
      status: 'active'
    });

    if (!conversation) {
      conversation = await SupportConversation.create({
        conversationId: uuidv4(),
        customerId,
        customerName: customer.full_name,
        customerAvatar: customer.avatar
      });
      
    } else {
    }

    return conversation;
  }

  async sendMessage(conversationId, senderId, senderModel, messageData) {
    const { message, messageType = 'text', attachments = [], productRef } = messageData;


    const sender = await User.findById(senderId);
    
    const newMessage = await SupportMessage.create({
      conversationId,
      senderId,
      senderModel,
      senderName: sender?.full_name,
      senderAvatar: sender?.avatar,
      message,
      messageType,
      attachments,
      productRef
    });


    // Update conversation
    const updateData = {
      lastMessage: message,
      lastMessageAt: new Date()
    };

    if (senderModel === 'User') {
      await SupportConversation.findOneAndUpdate(
        { conversationId },
        { 
          ...updateData,
          $inc: { unreadCountSeller: 1 }
        }
      );
    } else {
      await SupportConversation.findOneAndUpdate(
        { conversationId },
        { 
          ...updateData,
          $inc: { unreadCountCustomer: 1 },
          sellerId: senderId
        }
      );
    }

    // Populate product if exists
    if (productRef) {
      await newMessage.populate('productRef', 'name price images slug');
    }

    // Emit socket event using getIO()
    try {
      const io = getIO();
      const roomName = `support:${conversationId}`;
      
      // Kiểm tra số client trong room
      const room = io.sockets.adapter.rooms.get(roomName);
      const clientCount = room ? room.size : 0;
      if (clientCount > 0) {
        // Convert mongoose document to plain object
        const messageObject = newMessage.toObject();
        
        // Emit to specific room
        io.to(roomName).emit('support_new_message', messageObject);
      } else {
      }
      
      // Emit conversation update to seller room
      io.to('seller').emit('support_conversation_update', { 
        conversationId,
        lastMessage: message,
        lastMessageAt: new Date(),
        senderModel
      });
      
    } catch (error) {
      console.error('❌ Error emitting socket event:', error.message);
      // Không throw error, vẫn trả về message đã lưu
    }

    return newMessage;
  }

  async getMessages(conversationId, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const messages = await SupportMessage.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('productRef', 'name price images slug');

    const total = await SupportMessage.countDocuments({ conversationId });


    return {
      messages: messages.reverse(),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async markAsRead(conversationId, userType) {
    const result = await SupportMessage.updateMany(
      { 
        conversationId,
        senderModel: userType === 'customer' ? 'Seller' : 'User',
        isRead: false
      },
      { isRead: true, readAt: new Date() }
    );

    const updateField = userType === 'customer' 
      ? { unreadCountCustomer: 0 }
      : { unreadCountSeller: 0 };

    await SupportConversation.findOneAndUpdate({ conversationId }, updateField);
    
    
    // Emit event khi đánh dấu đã đọc
    try {
      const io = getIO();
      io.to(`support:${conversationId}`).emit('support_messages_read', {
        conversationId,
        userType,
        readCount: result.modifiedCount
      });
    } catch (error) {
      console.error(' Error emitting read event:', error.message);
    }
  }

  async getConversations(filters = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const query = { status: filters.status || 'active' };

    const conversations = await SupportConversation.find(query)
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('customerId', 'full_name avatar email')
      .populate('sellerId', 'full_name avatar');

    const total = await SupportConversation.countDocuments(query);


    return {
      conversations,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async closeConversation(conversationId) {
    const conversation = await SupportConversation.findOneAndUpdate(
      { conversationId },
      { status: 'closed' },
      { new: true }
    );
    
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    
    
    // Emit event khi đóng conversation
    try {
      const io = getIO();
      
      // Emit to conversation room
      io.to(`support:${conversationId}`).emit('support_conversation_closed', {
        conversationId,
        closedAt: new Date()
      });
      
      // Emit to seller room
      io.to('seller').emit('support_conversation_update', {
        conversationId,
        status: 'closed'
      });
      
    } catch (error) {
      console.error('❌ Error emitting close event:', error.message);
    }
    
    return conversation;
  }

  async getStats() {
    const active = await SupportConversation.countDocuments({ status: 'active' });
    const closed = await SupportConversation.countDocuments({ status: 'closed' });
    
    const totalUnreadResult = await SupportConversation.aggregate([
      { $match: { status: 'active', unreadCountSeller: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$unreadCountSeller' } } }
    ]);

    const totalUnread = totalUnreadResult[0]?.total || 0;


    return {
      activeConversations: active,
      closedConversations: closed,
      totalUnread
    };
  }
}

export default new SupportChatService();