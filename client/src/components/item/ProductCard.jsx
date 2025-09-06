import React from "react";
import { assets } from "@/assets/assets";
import { useCartContext } from "@/context/CartContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const ProductCard = ({ product }) => {
  const { addToCart } = useCartContext();
  const navigate = useNavigate();

  // Định dạng tiền tệ VNĐ
  const formatCurrency = (value) =>
    value?.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  // Xử lý thêm vào giỏ
  const handleAddToCart = async () => {
    try {
      await addToCart(product._id, 1);
      toast.success(`${product.name} đã được thêm vào giỏ hàng!`);
    } catch (err) {
      console.error(err);
      toast.error("Thêm vào giỏ hàng thất bại!");
    }
  };

  return (
    <div className="group p-5 bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition duration-300 min-w-[220px]">
      {/* Thumbnail */}
      <div className="relative overflow-hidden">
        <img
          src={product.primary_image}
          alt={product.name}
          className="w-full h-72 object-cover transform transition-transform duration-500 group-hover:scale-110"
        />
        {product.isNew && (
          <div className="absolute top-2 left-2 bg-green-600 text-white text-xs font-medium px-2 py-1 rounded">
            New
          </div>
        )}

        {/* Nút hành động */}
        <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
          <button
            onClick={handleAddToCart}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow cursor-pointer hover:bg-green-100 transition"
          >
            <img
              src={assets.add_to_cart_icon}
              className="w-5 h-5"
              alt="Add to cart"
            />
          </button>
          <button onClick={() => navigate(`/products/${product._id}`)} className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow cursor-pointer hover:bg-green-100 transition">
            <img src={assets.view_icon} className="w-5 h-5" alt="View" />
          </button>
        </div>
      </div>

      {/* Thông tin sản phẩm */}
      <div className="p-4 text-center">
        <h4 className="font-semibold text-gray-800">{product.name}</h4>
        <p className="text-green-600 font-bold">
          {product.sale_price ? (
            <>
              <span className="line-through text-gray-400 text-sm mr-2">
                {formatCurrency(product.price)}
              </span>
              {formatCurrency(product.sale_price)}
            </>
          ) : (
            formatCurrency(product.price)
          )}
        </p>
      </div>
    </div>
  );
};

export default ProductCard;
