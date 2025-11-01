import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import productService from "../../services/productService";
import { formatCurrency } from "../../utils/format";
import LoadingSpinner from "./LoadingSpinner";
import EmptyState from "./EmptyState";

const ViewRecent = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  const fetchRecentViews = async () => {
    try {
      setLoading(true);
      const response = await productService.getViewedProducts(page);
      
      if (response.success) {
        setProducts(response.data.products);
        setTotalPages(response.data.pagination.total_pages);
      } else {
        toast.error("Không thể tải danh sách sản phẩm đã xem");
      }
    } catch (error) {
      console.error("Error fetching recent views:", error);
      toast.error("Đã xảy ra lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentViews();
  }, [page]);

  const navigateToProduct = (slug) => {
    navigate(`/product/${slug}`);
  };

  // Thêm sản phẩm vào yêu thích
  const handleToggleFavorite = async (productId) => {
    try {
      const response = await productService.toggleFavorite(productId);
      if (response.success) {
        toast.success(response.message);
        // Cập nhật UI khi thêm yêu thích
        setProducts(products.map(p => 
          p._id === productId 
            ? {...p, isFavorited: !p.isFavorited} 
            : p
        ));
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Không thể thêm/xóa sản phẩm khỏi yêu thích");
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (products.length === 0) {
    return (
      <EmptyState
        title="Chưa có sản phẩm đã xem"
        description="Bạn chưa xem sản phẩm nào gần đây."
        buttonText="Khám phá sản phẩm"
        buttonAction={() => navigate("/products")}
      />
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Sản phẩm đã xem gần đây</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pr-8">
        {products.map((product) => (
          <div 
            key={product._id} 
            className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 transition-transform hover:shadow-lg hover:-translate-y-1"
          >
            <div className="relative cursor-pointer">
              {/* Ảnh sản phẩm */}
              <img
                src={product.images[0]?.image_url || "https://via.placeholder.com/300"}
                alt={product.name}
                className="w-full h-48 object-cover cursor-pointer"
                onClick={() => navigateToProduct(product.slug)}
              />
              
              {/* Thời gian xem gần đây */}
              <div className="absolute bottom-2 left-2 bg-white/80 backdrop-blur-sm text-xs px-2 py-1 rounded">
                {new Date(product.last_viewed_at).toLocaleDateString('vi-VN')}
              </div>
              
              {/* Nút yêu thích */}
              <button
                onClick={() => handleToggleFavorite(product._id)}
                className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md hover:bg-red-50"
              >
                <span className="text-xl">
                  {product.isFavorited ? "❤️" : "🤍"}
                </span>
              </button>
            </div>
            
            <div className="p-4">
              <h3 
                className="text-lg font-medium mb-1 line-clamp-2 h-14 cursor-pointer" 
                onClick={() => navigateToProduct(product.slug)}
              >
                {product.name}
              </h3>
              
              <div className="mb-2 text-sm text-gray-500">
                {product.category_id?.name || "Danh mục"}
              </div>
              
              <div className="flex justify-between items-center mt-2">
                <div>
                  <p className="text-green-700 font-bold">
                    {formatCurrency(product.sale_price || product.price)}
                  </p>
                  {product.sale_price && (
                    <p className="text-gray-500 text-sm line-through">
                      {formatCurrency(product.price)}
                    </p>
                  )}
                </div>
                
                <div className="text-sm text-gray-500">
                  {product.view_count || 0} lượt xem
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex space-x-1">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setPage(index + 1)}
                className={`px-3 py-1 rounded ${
                  page === index + 1
                    ? "bg-green-700 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewRecent;