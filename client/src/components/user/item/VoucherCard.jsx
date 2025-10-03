// ...existing code...
import React from "react";
import { assets } from "@/assets/assets";

export default function VoucherCard({
  type = "discount", // "freeship" or "discount"
  labelLeft,
  isPercent,
  discountValue,
  maxDiscount,
  minOrder,
  expireText,
  checked,
  onCheck,
}) {
  const leftBgClass = type === "freeship" ? "bg-[#009688]" : "bg-[#fb5a1d]";
  const accentColor = type === "freeship" ? "#009688" : "#f53d2d";

  // use freeship icon when type is freeship
  const iconSrc =
    type === "freeship" && assets.freeship_icon
      ? assets.freeship_icon
      : assets.voucher_icon;
  const iconAlt = type === "freeship" ? "Freeship" : "Voucher";

  return (
    <div className="flex items-stretch w-[360px] rounded-lg shadow-sm overflow-hidden border">
      {/* Left colored area */}
      <div
        className={`${leftBgClass} flex flex-col justify-center items-center w-20 p-3 relative`}
      >
        <img src={iconSrc} alt={iconAlt} className="w-8 h-8 mb-1" />
        <p className="text-white font-medium text-center text-xs leading-tight">
          {labelLeft}
        </p>
      </div>

      {/* Right info area */}
      <div className="flex-1 bg-white p-3 relative hover:shadow cursor-pointer">
        {type === "freeship" ? (
          <h3 className="text-sm font-semibold text-gray-900 my-2 leading-snug">
            Giảm {maxDiscount}
          </h3>
        ) : isPercent === true ? (
          <h3 className="text-sm font-semibold text-gray-900 my-2 leading-snug">
            Giảm {discountValue}{" "}
            <span className="font-medium ">Giảm tối đa {maxDiscount}</span>
          </h3>
        ) : (
          <h3 className="text-sm font-semibold text-gray-900 my-2 leading-snug">
            Giảm {discountValue}
          </h3>
        )}
        <p className="text-gray-900 text-xs my-2  mt-0.5">
          Đơn tối thiểu {minOrder}
        </p>

        <p className="text-gray-500 text-[11px] my-2 mt-1">
          HSD: {expireText}{" "}
        </p>

        {/* radio circle */}
        <div className="absolute top-1/2 right-1 -translate-y-1/2">
          <input
            type="radio"
            checked={checked}
            onChange={onCheck}
            className="w-4 h-4 mx-2 rounded-full border-gray-400"
            style={{ accentColor }}
          />
        </div>
      </div>
    </div>
  );
}
