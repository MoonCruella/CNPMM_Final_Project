import React from "react";
import { assets } from "@/assets/assets";

const CartItemRow = ({ 
  item, 
  updateQuantity, 
  removeFromCart,
  isSelected = false, // ✅ NEW
  onToggleSelect // ✅ NEW
}) => {
  const quantity = Number(item.quantity) || 0;
  const price = Number(item.product_id?.price) || 0;
  const salePrice = Number(item.product_id?.sale_price) || 0;
  const displayPrice = salePrice || price;
  const name = item.product_id?.name || "Unknown Product";
  const image =
    item.product_id?.images?.find((img) => img.is_primary)?.image_url ||
    assets.placeholder;

  return (
    <tr className={`border-t transition ${isSelected ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
      {/* ✅ NEW: Checkbox column */}
      <td className="py-4 px-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
        />
      </td>

      {/* Product info */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={image}
              alt={name}
              className="w-16 h-16 object-cover rounded"
            />
            {/* ✅ Selected badge overlay */}
            {isSelected && (
              <div className="absolute -top-1 -right-1 bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                ✓
              </div>
            )}
          </div>
          <div>
            <h4 className="font-medium">{name}</h4>
            <p className="text-sm text-gray-500">
              {salePrice ? (
                <>
                  <span className="text-green-700 font-semibold">
                    {salePrice.toLocaleString("vi-VN")}₫
                  </span>{" "}
                  <span className="line-through text-gray-400">
                    {price.toLocaleString("vi-VN")}₫
                  </span>
                </>
              ) : (
                <span className="text-green-700 font-semibold">
                  {price.toLocaleString("vi-VN")}₫
                </span>
              )}
            </p>
            <button
              onClick={() => removeFromCart(item._id)}
              className="text-xs text-red-600 hover:underline mt-1"
            >
              Xóa
            </button>
          </div>
        </div>
      </td>

      {/* Quantity */}
      <td className="py-4 px-4">
        <div className="flex items-center border rounded w-28">
          <button
            onClick={() => {
              if (quantity <= 1) removeFromCart(item._id);
              else updateQuantity(item._id, quantity - 1);
            }}
            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100"
          >
            -
          </button>
          <input
            type="text"
            value={quantity}
            readOnly
            className="w-12 text-center border-x text-gray-700"
          />
          <button
            onClick={() => updateQuantity(item._id, quantity + 1)}
            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100"
          >
            +
          </button>
        </div>
      </td>

      {/* Subtotal */}
      <td className="py-4 px-4 text-right">
        <span className={`font-semibold ${isSelected ? 'text-green-700' : 'text-gray-800'}`}>
          {(displayPrice * quantity).toLocaleString("vi-VN")}₫
        </span>
      </td>
    </tr>
  );
};

export default CartItemRow;