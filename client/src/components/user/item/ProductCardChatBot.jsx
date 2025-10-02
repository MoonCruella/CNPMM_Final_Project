import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Eye, Star } from 'lucide-react';
import { useCartContext } from '../../../context/CartContext';
import { Button } from '../../ui/button';

const ProductCardChatBot = ({ product, onClose }) => {
  const navigate = useNavigate();
  const { addToCart } = useCartContext();
  const [imageError, setImageError] = useState(false);

  // Format giá tiền
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  // Xử lý lỗi ảnh
  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
    }
  };

  // Lấy URL ảnh
  const getImageSrc = () => {
    if (imageError) {
      return '/src/assets/logo.png';
    }
    
    if (product.images && product.images.length > 0) {
      const primaryImage = product.images.find(img => img.is_primary === true);
      if (primaryImage) {
        return primaryImage.image_url;
      }
      return product.images[0].image_url;
    }
    
    return '/src/assets/logo.png';
  };

  // Tính toán giá sale
  const salePrice = product.sale_price && product.sale_price < product.price 
    ? product.sale_price 
    : null;

  const discountPercent = salePrice 
    ? Math.round(((product.price - salePrice) / product.price) * 100)
    : 0;

  // Xử lý click vào sản phẩm - sử dụng _id
  const handleProductClick = () => {
    navigate(`/products/${product._id}`); // Sử dụng _id thay vì slug
    onClose?.();
  };

  // Xử lý thêm vào giỏ hàng
  const handleAddToCart = (e) => {
    e.stopPropagation();
    
    if (product.stock_quantity <= 0) {
      return;
    }

    const cartItem = {
      id: product._id,
      name: product.name,
      price: salePrice || product.price,
      image: getImageSrc(),
      stock: product.stock_quantity,
      slug: product.slug
    };

    addToCart(cartItem);
  };

  return (
    <div 
      className="border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
      onClick={handleProductClick}
    >
      <div className="relative">
        {/* Hình ảnh sản phẩm */}
        <div className="relative h-32 bg-gray-100">
          <img
            src={getImageSrc()}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
          
          {/* Badge giảm giá */}
          {salePrice && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
              -{discountPercent}%
            </div>
          )}

          {/* Badge nổi bật */}
          {product.featured && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded flex items-center">
              <Star size={10} className="mr-1" />
              Hot
            </div>
          )}
        </div>

        {/* Thông tin sản phẩm */}
        <div className="p-3">
          {/* Tên sản phẩm */}
          <h4 className="font-medium text-sm line-clamp-2 text-gray-800 mb-2 min-h-[2.5rem]">
            {product.name}
          </h4>

          {/* Giá */}
          <div className="flex items-center gap-2 mb-2">
            {salePrice ? (
              <>
                <span className="text-red-600 font-semibold text-sm">
                  {formatPrice(salePrice)}₫
                </span>
                <span className="text-gray-400 line-through text-xs">
                  {formatPrice(product.price)}₫
                </span>
              </>
            ) : (
              <span className="text-primary font-semibold text-sm">
                {formatPrice(product.price)}₫
              </span>
            )}
          </div>

          {/* Thông tin thêm */}
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span className={`${product.stock_quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {product.stock_quantity > 0 ? 'Còn hàng' : 'Hết hàng'}
            </span>
            {product.buyer_count > 0 && (
              <span>Đã bán: {product.buyer_count}</span>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-3">
            {product.category_id?.name && (
              <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                {product.category_id.name}
              </span>
            )}
            {product.hometown_origin?.district && (
              <span className="inline-block bg-blue-100 text-blue-600 text-xs px-1 py-1 rounded">
                🏞️ {product.hometown_origin.district}
              </span>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-8 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleProductClick();
              }}
            >
              <Eye size={12} className="mr-1" />
              Xem
            </Button>
            <Button
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={handleAddToCart}
              disabled={product.stock_quantity <= 0}
            >
              <ShoppingCart size={12} className="mr-1" />
              {product.stock_quantity <= 0 ? 'Hết hàng' : 'Thêm'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCardChatBot;