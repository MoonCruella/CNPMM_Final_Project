import axios from "axios";
import Product from "../models/product.model.js";
import mongoose from "mongoose";

class ChatbotService {
  constructor() {
    this.GROQ_API_KEY = process.env.GROQ_API_KEY;
    this.GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
    this.GROQ_BASE = "https://api.groq.com/openai/v1";
  }

  // Tìm kiếm sản phẩm thông minh theo nhiều tiêu chí
  async searchRelevantProducts(query) {
    try {
      const searchTerms = query.toLowerCase();
      
      // Tạo các điều kiện tìm kiếm
      const searchConditions = [
        // Tìm theo tên sản phẩm
        { name: { $regex: searchTerms, $options: "i" } },
        // Tìm theo mô tả
        { description: { $regex: searchTerms, $options: "i" } },
        { short_description: { $regex: searchTerms, $options: "i" } },
      ];

      // Tìm kiếm theo từ khóa đặc biệt
      if (searchTerms.includes('rẻ') || searchTerms.includes('giá thấp')) {
        // Sắp xếp theo giá tăng dần
        const cheapProducts = await Product.find({ status: 'active' })
          .populate('category_id', 'name')
          .sort({ price: 1 })
          .limit(5)
          .select('_id name price sale_price images stock_quantity description category_id slug featured');
        return cheapProducts;
      }

      if (searchTerms.includes('bán chạy') || searchTerms.includes('phổ biến')) {
        // Sắp xếp theo số lượng đã bán
        const popularProducts = await Product.find({ status: 'active' })
          .populate('category_id', 'name')
          .sort({ sold_quantity: -1, purchase_count: -1 })
          .limit(5)
          .select('_id name price sale_price images stock_quantity description category_id slug sold_quantity');
        return popularProducts;
      }

      if (searchTerms.includes('mới') || searchTerms.includes('mới nhất')) {
        // Sắp xếp theo sản phẩm mới nhất
        const newProducts = await Product.find({ status: 'active' })
          .populate('category_id', 'name')
          .sort({ created_at: -1 })
          .limit(5)
          .select('_id name price sale_price images stock_quantity description category_id slug created_at');
        return newProducts;
      }

      if (searchTerms.includes('nổi bật') || searchTerms.includes('đặc sản')) {
        // Tìm sản phẩm nổi bật hoặc có hometown_origin
        const featuredProducts = await Product.find({ 
          $or: [
            { featured: true },
            { 'hometown_origin.district': { $exists: true } }
          ],
          status: 'active'
        })
        .populate('category_id', 'name')
        .limit(5)
        .select('_id name price sale_price images stock_quantity description category_id slug featured hometown_origin');
        return featuredProducts;
      }

      // Tìm kiếm theo giá
      const priceMatch = searchTerms.match(/(\d+)/);
      if (priceMatch && (searchTerms.includes('dưới') || searchTerms.includes('từ') || searchTerms.includes('đến'))) {
        const price = parseInt(priceMatch[1]);
        const priceQuery = searchTerms.includes('dưới') 
          ? { price: { $lt: price * 1000 } } // Giả sử người dùng nhập nghìn
          : { price: { $gte: price * 1000 } };

        const priceProducts = await Product.find({ 
          ...priceQuery,
          status: 'active' 
        })
        .populate('category_id', 'name')
        .limit(5)
        .select('_id name price sale_price images stock_quantity description category_id slug');
        return priceProducts;
      }

      // Tìm kiếm thông thường
      const products = await Product.find({
        $or: searchConditions,
        status: 'active'
      })
      .populate('category_id', 'name')
      .sort({ 
        sold_quantity: -1, // Ưu tiên sản phẩm bán chạy
        view_count: -1,    // Ưu tiên sản phẩm được xem nhiều
        created_at: -1     // Ưu tiên sản phẩm mới
      })
      .limit(6)
      .select('_id name price sale_price images stock_quantity description category_id slug sold_quantity view_count featured');

      return products;
    } catch (error) {
      console.error("Error searching products:", error);
      return [];
    }
  }

  // Format thông tin sản phẩm cho AI
  formatProductsForContext(products) {
    if (!products?.length) return "";
    
    return products.map((product, index) => {
      const salePrice = product.sale_price && product.sale_price < product.price 
        ? ` (Giá khuyến mãi: ${product.sale_price.toLocaleString()} VNĐ)` 
        : '';
      
      const stock = product.stock_quantity > 0 ? 'Còn hàng' : 'Hết hàng';
      const category = product.category_id?.name || 'Chưa phân loại';
      
      return `Sản phẩm ${index + 1}:
- ID: ${product._id}
- Tên: ${product.name}
- Giá: ${product.price.toLocaleString()} VNĐ${salePrice}
- Danh mục: ${category}
- Tình trạng: ${stock}
- Đã bán: ${product.sold_quantity || 0} sản phẩm
- Lượt xem: ${product.view_count || 0}
- Mô tả: ${product.description ? product.description.substring(0, 100) + '...' : 'Không có mô tả'}
${product.featured ? '- ⭐ Sản phẩm nổi bật' : ''}
${product.hometown_origin?.district ? `- 🏞️ Đặc sản từ ${product.hometown_origin.district}` : ''}`;
    }).join('\n\n');
  }

  // Tạo prompt thông minh dựa trên context
  createSmartPrompt(userQuery, productsContext, products) {
    const hasProducts = products && products.length > 0;
    
    let systemPrompt = `Bạn là trợ lý AI chuyên nghiệp của cửa hàng thực phẩm hữu cơ và đặc sản Phú Yên.

NHIỆM VỤ:
1. Trả lời câu hỏi khách hàng một cách thân thiện, chuyên nghiệp
2. Đưa ra gợi ý sản phẩm phù hợp từ danh sách có sẵn
3. Nêu rõ lý do tại sao gợi ý những sản phẩm đó
4. Đưa ra thông tin giá, tình trạng kho, ưu đãi (nếu có)
5. Khuyến khích khách hàng mua hàng một cách tự nhiên

NGUYÊN TẮC:
- Luôn gọi khách hàng bằng "anh/chị"
- Nêu rõ ID sản phẩm để khách hàng dễ tìm
- Ưu tiên sản phẩm còn hàng và có ưu đãi
- Giải thích lợi ích của thực phẩm hữu cơ`;

    if (!hasProducts) {
      systemPrompt += `\n\nHiện tại không tìm thấy sản phẩm phù hợp. Hãy xin lỗi và gợi ý khách hàng:
- Thử từ khóa khác
- Liên hệ để được tư vấn trực tiếp
- Xem các sản phẩm nổi bật khác`;
    }

    const userPrompt = hasProducts 
      ? `Câu hỏi của khách hàng: "${userQuery}"

DANH SÁCH SẢN PHẨM PHÙHỢP:
${productsContext}

Hãy tư vấn cho khách hàng dựa trên danh sách sản phẩm trên.`
      : `Câu hỏi của khách hàng: "${userQuery}"

Không tìm thấy sản phẩm phù hợp. Hãy trả lời thân thiện và gợi ý cách khác.`;

    return { systemPrompt, userPrompt };
  }

  async getChatbotResponse(userQuery) {
    try {
      // Tìm sản phẩm liên quan
      const products = await this.searchRelevantProducts(userQuery);
      const productsContext = this.formatProductsForContext(products);
      
      // Tạo prompt thông minh
      const { systemPrompt, userPrompt } = this.createSmartPrompt(userQuery, productsContext, products);

      // Gọi Groq API
      const response = await axios.post(
        `${this.GROQ_BASE}/chat/completions`,
        {
          model: this.GROQ_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 1000
        },
        {
          headers: {
            Authorization: `Bearer ${this.GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      const aiResponse = response.data?.choices?.[0]?.message?.content?.trim() || 
        "Xin lỗi anh/chị, hiện tại tôi không thể trả lời câu hỏi này. Vui lòng liên hệ trực tiếp để được hỗ trợ tốt nhất.";

      // Trả về cả phản hồi AI và danh sách sản phẩm
      return {
        response: aiResponse,
        products: products || [],
        metadata: {
          provider: "groq",
          model: this.GROQ_MODEL,
          query: userQuery,
          productsFound: products?.length || 0,
          searchType: this.detectSearchType(userQuery)
        }
      };

    } catch (error) {
      console.error("Error in getChatbotResponse:", error);
      
      // Fallback response
      return {
        response: "Xin lỗi anh/chị, hệ thống đang gặp sự cố. Vui lòng thử lại sau hoặc liên hệ trực tiếp để được hỗ trợ.",
        products: [],
        metadata: {
          error: true,
          message: error.message
        }
      };
    }
  }

  // Phát hiện loại tìm kiếm
  detectSearchType(query) {
    const q = query.toLowerCase();
    if (q.includes('rẻ') || q.includes('giá thấp')) return 'price_low';
    if (q.includes('bán chạy') || q.includes('phổ biến')) return 'popular';
    if (q.includes('mới')) return 'newest';
    if (q.includes('nổi bật') || q.includes('đặc sản')) return 'featured';
    if (/\d+/.test(q) && (q.includes('dưới') || q.includes('từ'))) return 'price_range';
    return 'general';
  }
}

export default new ChatbotService();