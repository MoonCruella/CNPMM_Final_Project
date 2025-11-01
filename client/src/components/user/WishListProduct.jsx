import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import productService from "../../services/productService";
import { formatCurrency } from "../../utils/format";
import LoadingSpinner from "./LoadingSpinner";
import EmptyState from "./EmptyState";

const WishListProduct = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await productService.getFavorites(page);
      
      if (response.success) {
        setProducts(response.data.products);
        setTotalPages(response.data.pagination.total_pages);
      } else {
        toast.error("Không thể tải danh sách sản phẩm yêu thích");
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      toast.error("Đã xảy ra lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [page]);

  const handleToggleFavorite = async (productId) => {
    try {
      const response = await productService.toggleFavorite(productId);
      if (response.success) {
        toast.success("Đã xóa khỏi danh sách yêu thích");
        // Refresh list
        fetchWishlist();
      }
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toast.error("Không thể xóa sản phẩm khỏi danh sách yêu thích");
    }
  };

  const navigateToProduct = (slug) => {
    navigate(`/product/${slug}`);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (products.length === 0) {
    return (
      <EmptyState
        title="Chưa có sản phẩm yêu thích"
        description="Bạn chưa thêm sản phẩm nào vào danh sách yêu thích."
        buttonText="Khám phá sản phẩm"
        buttonAction={() => navigate("/products")}
      />
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Sản phẩm yêu thích</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pr-8">
        {products.map((product) => (
          <div 
            key={product._id} 
            className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 transition-transform hover:shadow-lg hover:-translate-y-1"
          >
            <div className="relative">
              {/* Ảnh sản phẩm */}
              <img
                src={product.images[0]?.image_url || "https://via.placeholder.com/300"}
                alt={product.name}
                className="w-full h-48 object-cover cursor-pointer"
                onClick={() => navigateToProduct(product.slug)}
              />
              
              {/* Nút yêu thích */}
              <button
                onClick={() => handleToggleFavorite(product._id)}
                className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md hover:bg-red-50"
              >
                <span className="text-red-500 text-xl">❤️</span>
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
                  {product.sold_quantity || 0} đã bán
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

export default WishListProduct;