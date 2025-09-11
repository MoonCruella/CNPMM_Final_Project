import React from "react";
import { assets } from "@/assets/assets";

const ItemRow = ({ item }) => {
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
        </div>
      </td>

      {/* Quantity */}
      <td className="py-4 px-4">
        <div className="flex items-center ">
          <h4 className="font-semibold p-1">X{quantity}</h4>
        </div>
      </td>

      {/* Subtotal */}
      <td className="py-4 px-4 text-right font-medium">
        {(displayPrice * quantity).toLocaleString("vi-VN")}₫
      </td>
    </tr>
  );
};

export default ItemRow;
