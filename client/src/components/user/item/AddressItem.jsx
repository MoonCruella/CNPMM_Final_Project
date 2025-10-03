import React from "react";
import { assets } from "@/assets/assets";

const AddressItem = ({
  address,
  selected,
  onSelect,
  onEdit,
  onDelete,
  showRadio = true,
  isDefault = false,
}) => {
  return (
    <div
      className={`relative rounded-2xl border p-4 transition cursor-pointer
    ${
      selected
        ? "border-green-600 shadow-md bg-green-50"
        : "border-gray-200 hover:shadow-md bg-white"
    }`}
      onClick={() => showRadio && onSelect?.(address._id)}
    >
      {showRadio && (
        <input
          type="radio"
          name="address"
          value={address._id}
          checked={selected}
          onChange={() => onSelect?.(address._id)}
          className="absolute top-5 left-4 w-5 h-5 accent-green-600"
        />
      )}

      {/* Nội dung cách radio 2rem */}
      <div className={`${showRadio ? "pl-10" : ""}`}>
        <p className="font-semibold flex items-center gap-2 text-gray-900">
          {address.full_name} - {address.phone}
          {isDefault && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              Mặc định
            </span>
          )}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          {address.street}, {address.ward?.name}, {address.district?.name},{" "}
          {address.province?.name}
        </p>
      </div>

      {/* Action buttons */}
      <div className="absolute top-3 right-3 flex gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(address);
          }}
          className="p-2 rounded-full hover:bg-gray-100 transition"
        >
          <img
            src={assets.edit_icon}
            alt="Sửa"
            className="w-4 h-4 object-contain"
          />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(address._id);
          }}
          className="p-2 rounded-full hover:bg-gray-100 transition"
        >
          <img
            src={assets.delete_icon}
            alt="Xóa"
            className="w-4 h-4 object-contain"
          />
        </button>
      </div>
    </div>
  );
};

export default AddressItem;
