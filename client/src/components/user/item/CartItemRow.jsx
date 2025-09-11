import React from "react";
import { assets } from "@/assets/assets";

const CartItemRow = ({ item, updateQuantity, removeFromCart }) => {
  const quantity = Number(item.quantity) || 0;
  const price = Number(item.product_id?.price) || 0;
  const salePrice = Number(item.product_id?.sale_price) || 0;
  const displayPrice = salePrice || price;
  const name = item.product_id?.name || "Unknown Product";
  const image =
    item.product_id?.images?.find((img) => img.is_primary)?.image_url ||
    assets.placeholder;

  return (
    <tr className="border-t hover:bg-gray-50 transition">
      {/* Product info */}
      <td className="py-4 px-4 flex items-center gap-4">
        <img
          src={image}
          alt={name}
          className="w-16 h-16 object-cover rounded"
        />
        <div>
          <h4 className="font-medium">{name}</h4>
          <p className="text-sm text-gray-500">
            {salePrice ? (
              <>
                <span className="text-red-600">
                  {salePrice.toLocaleString("vi-VN")}₫
                </span>{" "}
                <span className="line-through text-gray-400">
                  {price.toLocaleString("vi-VN")}₫
                </span>
              </>
            ) : (
              <span>{price.toLocaleString("vi-VN")}₫</span>
            )}
          </p>
          <button
            onClick={() => removeFromCart(item._id)}
            className="text-xs text-red-500 hover:underline mt-1"
          >
            Remove
          </button>
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
      <td className="py-4 px-4 text-right font-semibold">
        {(displayPrice * quantity).toLocaleString("vi-VN")}₫
      </td>
    </tr>
  );
};

export default CartItemRow;
