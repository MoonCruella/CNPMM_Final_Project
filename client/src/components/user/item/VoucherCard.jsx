import React from "react";
import { assets } from "@/assets/assets";

export default function VoucherCard({
  labelLeft,
  discountValue,
  maxDiscount,
  minOrder,
  expireText,
  conditionLink,
  quantity,
  checked,
  onCheck,
}) {
  return (
    <div className="flex items-stretch w-[300px] rounded-lg shadow-sm overflow-hidden border">
      {/* Left red area */}
      <div className="bg-[#f53d2d] flex flex-col justify-center items-center w-20 p-2 relative">
        <img src={assets.voucher_icon} alt="Voucher" className="w-8 h-8 mb-1" />
        <p className="text-white font-medium text-center text-xs leading-tight">
          {labelLeft}
        </p>
      </div>

      {/* Right info area */}
      <div className="flex-1 bg-white p-2 relative">
        <h3 className="text-sm font-semibold text-gray-900 leading-snug">
          Giảm {discountValue} Giảm tối đa {maxDiscount}
        </h3>
        <p className="text-gray-700 text-xs mt-0.5">Đơn tối thiểu {minOrder}</p>

        <p className="text-gray-500 text-[11px] mt-1">
          HSD: {expireText}{" "}
          <a href={conditionLink} className="text-blue-500 underline">
            Điều kiện
          </a>
        </p>

        {/* quantity badge */}
        {quantity && (
          <div className="absolute top-1 right-1 bg-[#ffe7e0] text-[#f53d2d] text-xs font-bold px-1.5 py-0.5 rounded-full">
            x{quantity}
          </div>
        )}

        {/* radio circle */}
        <div className="absolute top-1/2 right-1 -translate-y-1/2">
          <input
            type="radio"
            checked={checked}
            onChange={onCheck}
            className="w-4 h-4 rounded-full border-gray-400 text-[#f53d2d] focus:ring-[#f53d2d]"
          />
        </div>
      </div>
    </div>
  );
}
