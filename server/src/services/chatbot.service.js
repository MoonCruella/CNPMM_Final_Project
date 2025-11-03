import axios from "axios";
import Product from "../models/product.model.js";
import mongoose from "mongoose";

class ChatbotService {
  constructor() {
    this.GROQ_API_KEY = process.env.GROQ_API_KEY;
    this.GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
    this.GROQ_BASE = "https://api.groq.com/openai/v1";
  }

  // ✅ Lấy top sản phẩm bán chạy để tư vấn
  async getTopSellingProducts(limit = 5) {
    try {
      const topProducts = await Product.find({ status: 'active' })
        .populate('category_id', 'name')
        .sort({ 
          sold_quantity: -1, 
          purchase_count: -1,
          view_count: -1 
        })
        .limit(limit)
        .select('_id name price sale_price images stock_quantity description category_id slug sold_quantity purchase_count view_count avg_rating featured');
      
      return topProducts;
    } catch (error) {
      console.error("Error getting top selling products:", error);
      return [];
    }
  }

  // ✅ Lấy sản phẩm có đánh giá cao
  async getHighRatedProducts(limit = 5) {
    try {
      const highRatedProducts = await Product.find({ 
        status: 'active',
        avg_rating: { $gte: 4.0 } // Rating >= 4.0
      })
        .populate('category_id', 'name')
        .sort({ 
          avg_rating: -1,
          sold_quantity: -1 
        })
        .limit(limit)
        .select('_id name price sale_price images stock_quantity description category_id slug sold_quantity avg_rating featured');
      
      return highRatedProducts;
    } catch (error) {
      console.error("Error getting high rated products:", error);
      return [];
    }
  }

  // ✅ Tư vấn sản phẩm theo ngân sách
  async recommendByBudget(budget, limit = 5) {
    try {
      const products = await Product.find({ 
        status: 'active',
        price: { $lte: budget }
      })
        .populate('category_id', 'name')
        .sort({ 
          sold_quantity: -1,
          avg_rating: -1,
          view_count: -1
        })
        .limit(limit)
        .select('_id name price sale_price images stock_quantity description category_id slug sold_quantity avg_rating');
      
      return products;
    } catch (error) {
      console.error("Error recommending by budget:", error);
      return [];
    }
  }

  // ✅ Tư vấn sản phẩm theo danh mục
  async recommendByCategory(categoryName, limit = 5) {
    try {
      const products = await Product.find({ 
        status: 'active',
        'category_id.name': { $regex: categoryName, $options: 'i' }
      })
        .populate('category_id', 'name')
        .sort({ 
          sold_quantity: -1,
          avg_rating: -1 
        })
        .limit(limit)
        .select('_id name price sale_price images stock_quantity description category_id slug sold_quantity avg_rating');
      
      return products;
    } catch (error) {
      console.error("Error recommending by category:", error);
      return [];
    }
  }

  // Tìm kiếm sản phẩm thông minh theo nhiều tiêu chí
  async searchRelevantProducts(query) {
    try {
      const searchTerms = query.toLowerCase();
      
      // ✅ Tư vấn chung - Top sản phẩm bán chạy
      if (
        searchTerms.includes('tư vấn') || 
        searchTerms.includes('nên mua') || 
        searchTerms.includes('gợi ý') ||
        searchTerms.includes('đề xuất') ||
        searchTerms.includes('giới thiệu') ||
        searchTerms.includes('sản phẩm nào tốt') ||
        searchTerms.includes('mua gì')
      ) {
        const topProducts = await this.getTopSellingProducts(5);
        return {
          products: topProducts,
          type: 'consultation',
          message: 'Top sản phẩm bán chạy nhất được khách hàng tin dùng'
        };
      }

      // ✅ Tư vấn theo ngân sách
      const budgetMatch = searchTerms.match(/(\d+)(?:k|tr|triệu|nghìn)?/i);
      if (budgetMatch && (
        searchTerms.includes('ngân sách') || 
        searchTerms.includes('trong khoảng') ||
        searchTerms.includes('dưới') ||
        searchTerms.includes('khoảng')
      )) {
        let budget = parseInt(budgetMatch[1]);
        
        // Convert to VNĐ
        if (searchTerms.includes('k') || searchTerms.includes('nghìn')) {
          budget *= 1000;
        } else if (searchTerms.includes('tr') || searchTerms.includes('triệu')) {
          budget *= 1000000;
        } else if (budget < 1000) {
          budget *= 1000; // Default to thousands
        }
        
        const products = await this.recommendByBudget(budget, 5);
        return {
          products,
          type: 'budget',
          message: `Sản phẩm phù hợp với ngân sách ${budget.toLocaleString()} VNĐ`
        };
      }

      // ✅ Tìm sản phẩm bán chạy
      if (searchTerms.includes('bán chạy') || searchTerms.includes('phổ biến')) {
        const popularProducts = await Product.find({ status: 'active' })
          .populate('category_id', 'name')
          .sort({ sold_quantity: -1, purchase_count: -1 })
          .limit(5)
          .select('_id name price sale_price images stock_quantity description category_id slug sold_quantity');
        return {
          products: popularProducts,
          type: 'popular',
          message: 'Sản phẩm bán chạy nhất'
        };
      }

      // ✅ Tìm sản phẩm có đánh giá cao
      if (
        searchTerms.includes('đánh giá cao') || 
        searchTerms.includes('chất lượng') ||
        searchTerms.includes('uy tín') ||
        searchTerms.includes('tốt nhất')
      ) {
        const highRatedProducts = await this.getHighRatedProducts(5);
        return {
          products: highRatedProducts,
          type: 'high_rated',
          message: 'Sản phẩm được đánh giá cao bởi khách hàng'
        };
      }

      // ✅ Tìm sản phẩm giá rẻ
      if (searchTerms.includes('rẻ') || searchTerms.includes('giá thấp')) {
        const cheapProducts = await Product.find({ status: 'active' })
          .populate('category_id', 'name')
          .sort({ price: 1 })
          .limit(5)
          .select('_id name price sale_price images stock_quantity description category_id slug featured');
        return {
          products: cheapProducts,
          type: 'cheap',
          message: 'Sản phẩm giá tốt nhất'
        };
      }

      // ✅ Tìm sản phẩm mới
      if (searchTerms.includes('mới') || searchTerms.includes('mới nhất')) {
        const newProducts = await Product.find({ status: 'active' })
          .populate('category_id', 'name')
          .sort({ created_at: -1 })
          .limit(5)
          .select('_id name price sale_price images stock_quantity description category_id slug created_at');
        return {
          products: newProducts,
          type: 'newest',
          message: 'Sản phẩm mới nhất'
        };
      }

      // ✅ Tìm sản phẩm nổi bật
      if (searchTerms.includes('nổi bật') || searchTerms.includes('đặc sản')) {
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
        return {
          products: featuredProducts,
          type: 'featured',
          message: 'Sản phẩm nổi bật và đặc sản'
        };
      }

      // ✅ Tìm kiếm theo giá
      const priceMatch = searchTerms.match(/(\d+)/);
      if (priceMatch && (searchTerms.includes('dưới') || searchTerms.includes('từ') || searchTerms.includes('đến'))) {
        const price = parseInt(priceMatch[1]);
        const priceQuery = searchTerms.includes('dưới') 
          ? { price: { $lt: price * 1000 } }
          : { price: { $gte: price * 1000 } };

        const priceProducts = await Product.find({ 
          ...priceQuery,
          status: 'active' 
        })
        .populate('category_id', 'name')
        .limit(5)
        .select('_id name price sale_price images stock_quantity description category_id slug');
        return {
          products: priceProducts,
          type: 'price_range',
          message: `Sản phẩm trong khoảng giá phù hợp`
        };
      }

      // ✅ Tìm kiếm thông thường
      const searchConditions = [
        { name: { $regex: searchTerms, $options: "i" } },
        { description: { $regex: searchTerms, $options: "i" } },
        { short_description: { $regex: searchTerms, $options: "i" } },
      ];

      const products = await Product.find({
        $or: searchConditions,
        status: 'active'
      })
      .populate('category_id', 'name')
      .sort({ 
        sold_quantity: -1,
        view_count: -1,
        created_at: -1
      })
      .limit(6)
      .select('_id name price sale_price images stock_quantity description category_id slug sold_quantity view_count featured');

      return {
        products: products || [],
        type: 'search',
        message: 'Kết quả tìm kiếm'
      };
    } catch (error) {
      console.error("Error searching products:", error);
      return { products: [], type: 'error', message: 'Lỗi tìm kiếm' };
    }
  }

  // Format thông tin sản phẩm cho AI
  formatProductsForContext(products, searchType = 'general') {
    if (!products?.length) return "";
    
    return products.map((product, index) => {
      const salePrice = product.sale_price && product.sale_price < product.price 
        ? ` (🎉 Giảm giá: ${product.sale_price.toLocaleString()} VNĐ - Tiết kiệm ${((product.price - product.sale_price) / product.price * 100).toFixed(0)}%)` 
        : '';
      
      const stock = product.stock_quantity > 0 ? '✅ Còn hàng' : '❌ Hết hàng';
      const category = product.category_id?.name || 'Chưa phân loại';
      const rating = product.avg_rating ? `⭐ ${product.avg_rating.toFixed(1)}/5` : '';
      
      return `${index + 1}. ${product.name}
   📋 ID: ${product._id}
   💰 Giá: ${product.price.toLocaleString()} VNĐ${salePrice}
   📂 Danh mục: ${category}
   📦 Tình trạng: ${stock}
   🔥 Đã bán: ${product.sold_quantity || 0} sản phẩm
   👀 Lượt xem: ${product.view_count || 0}
   ${rating ? `${rating}` : ''}
   ${product.featured ? '⭐ Sản phẩm nổi bật' : ''}
   ${product.hometown_origin?.district ? `🏞️ Đặc sản từ ${product.hometown_origin.district}` : ''}
   📝 Mô tả: ${product.description ? product.description.substring(0, 150) + '...' : 'Sản phẩm chất lượng cao'}`;
    }).join('\n\n');
  }

  // Tạo prompt thông minh dựa trên context
  createSmartPrompt(userQuery, productsContext, products, searchResult) {
    const hasProducts = products && products.length > 0;
    const searchType = searchResult?.type || 'general';
    const message = searchResult?.message || '';
    
    let systemPrompt = `Bạn là AI Shopping Assistant chuyên nghiệp của cửa hàng thực phẩm hữu cơ và đặc sản Phú Yên - SPKT Store.

🎯 NHIỆM VỤ CHÍNH:
1. Tư vấn sản phẩm thông minh dựa trên nhu cầu khách hàng
2. Giới thiệu top sản phẩm bán chạy nhất khi được hỏi "nên mua gì", "tư vấn"
3. Đưa ra gợi ý cụ thể với lý do thuyết phục
4. So sánh giá, chất lượng, lợi ích của từng sản phẩm
5. Khuyến khích mua hàng tự nhiên, không ép buộc

💡 NGUYÊN TẮC TƯ VẤN:
- Luôn gọi khách bằng "anh/chị" để tôn trọng
- Nêu rõ ID sản phẩm để dễ tìm kiếm
- Ưu tiên sản phẩm: Bán chạy > Đánh giá cao > Còn hàng > Giảm giá
- Giải thích rõ lợi ích của thực phẩm hữu cơ
- Đưa ra 3-5 lựa chọn tốt nhất
- Kết thúc bằng câu hỏi mở để tạo tương tác

📊 CÁCH TRÌNH BÀY:
- Dùng emoji phù hợp (🔥 🎉 ⭐ 💰 ✅)
- Nhóm sản phẩm theo tiêu chí (Top bán chạy, Giá tốt, Đánh giá cao...)
- Làm nổi bật ưu đãi và điểm mạnh
- Format rõ ràng, dễ đọc

🎯 LOẠI TƯ VẤN HIỆN TẠI: ${searchType}
${message ? `📌 ${message}` : ''}`;

    if (searchType === 'consultation') {
      systemPrompt += `\n\n🌟 ĐẶC BIỆT: Đây là yêu cầu TƯ VẤN CHUNG
Hãy giới thiệu TOP 3-5 sản phẩm bán chạy nhất với:
✅ Lý do được khách hàng yêu thích
✅ Điểm nổi bật của từng sản phẩm
✅ Ai nên mua sản phẩm này
✅ Gợi ý kết hợp sản phẩm (nếu phù hợp)`;
    }

    if (searchType === 'budget') {
      systemPrompt += `\n\n💰 ĐẶC BIỆT: Tư vấn theo NGÂN SÁCH
Hãy đề xuất combo/gói sản phẩm tối ưu trong mức giá
Giải thích tại sao là lựa chọn tốt nhất cho số tiền này`;
    }

    if (searchType === 'high_rated') {
      systemPrompt += `\n\n⭐ ĐẶC BIỆT: Sản phẩm CHẤT LƯỢNG CAO
Nhấn mạnh đánh giá của khách hàng
Tại sao đáng tin cậy và đáng mua`;
    }

    if (!hasProducts) {
      systemPrompt += `\n\n❌ Không tìm thấy sản phẩm phù hợp
Hãy:
1. Xin lỗi lịch sự
2. Gợi ý thử từ khóa khác
3. Giới thiệu top sản phẩm bán chạy thay thế
4. Đề nghị liên hệ trực tiếp để được tư vấn chi tiết`;
    }

    const userPrompt = hasProducts 
      ? `Câu hỏi của khách hàng: "${userQuery}"

📦 DANH SÁCH SẢN PHẨM PHÙ HỢP:
${productsContext}

Hãy tư vấn chi tiết, chuyên nghiệp dựa trên danh sách trên.`
      : `Câu hỏi của khách hàng: "${userQuery}"

Không tìm thấy sản phẩm phù hợp. Hãy xin lỗi và đề xuất các sản phẩm bán chạy khác.`;

    return { systemPrompt, userPrompt };
  }

  async getChatbotResponse(userQuery) {
    try {
      // ✅ Tìm sản phẩm liên quan với type
      const searchResult = await this.searchRelevantProducts(userQuery);
      const products = searchResult.products || searchResult;
      const searchType = searchResult.type || 'general';
      const message = searchResult.message || '';
      
      const productsContext = this.formatProductsForContext(products, searchType);
      
      // ✅ Tạo prompt thông minh với search type
      const { systemPrompt, userPrompt } = this.createSmartPrompt(
        userQuery, 
        productsContext, 
        products,
        { type: searchType, message }
      );

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
          max_tokens: 1500
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

      return {
        response: aiResponse,
        products: products || [],
        metadata: {
          provider: "groq",
          model: this.GROQ_MODEL,
          query: userQuery,
          productsFound: products?.length || 0,
          searchType: searchType,
          message: message
        }
      };

    } catch (error) {
      console.error("Error in getChatbotResponse:", error);
      
      // ✅ Fallback: Trả về top sản phẩm bán chạy
      try {
        const topProducts = await this.getTopSellingProducts(3);
        return {
          response: `Xin lỗi anh/chị, hệ thống đang bận. Dưới đây là top 3 sản phẩm bán chạy nhất của shop:\n\n${this.formatProductsForContext(topProducts, 'popular')}\n\nAnh/chị có thể tham khảo hoặc liên hệ trực tiếp để được tư vấn chi tiết hơn! 😊`,
          products: topProducts,
          metadata: {
            error: true,
            fallback: 'top_selling',
            message: error.message
          }
        };
      } catch (fallbackError) {
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
  }

  // ✅ Phát hiện loại tìm kiếm
  detectSearchType(query) {
    const q = query.toLowerCase();
    if (q.includes('tư vấn') || q.includes('nên mua') || q.includes('gợi ý')) return 'consultation';
    if (q.includes('ngân sách') || q.includes('trong khoảng')) return 'budget';
    if (q.includes('đánh giá cao') || q.includes('chất lượng')) return 'high_rated';
    if (q.includes('rẻ') || q.includes('giá thấp')) return 'price_low';
    if (q.includes('bán chạy') || q.includes('phổ biến')) return 'popular';
    if (q.includes('mới')) return 'newest';
    if (q.includes('nổi bật') || q.includes('đặc sản')) return 'featured';
    if (/\d+/.test(q) && (q.includes('dưới') || q.includes('từ'))) return 'price_range';
    return 'general';
  }
}

export default new ChatbotService();