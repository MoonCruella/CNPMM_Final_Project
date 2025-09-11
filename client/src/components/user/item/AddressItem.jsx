import React from "react";

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
    <label className="flex items-start gap-3 border rounded-xl p-3 cursor-pointer hover:shadow">
      {showRadio && (
        <input
          type="radio"
          name="address"
          value={address._id}
          checked={selected}
          onChange={() => onSelect?.(address._id)}
          className="w-5 h-5 accent-green-600 mt-1"
        />
      )}
      <div className="flex-1">
        <p className="font-semibold flex items-center gap-2">
          {address.full_name} - {address.phone}
          {isDefault && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              Mặc định
            </span>
          )}
        </p>
        <p className="text-sm text-gray-600">
          {address.street}, {address.ward?.name}, {address.district?.name},{" "}
          {address.province?.name}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onEdit(address)}
          className="text-blue-600 hover:underline text-sm"
        >
          Sửa
        </button>
        <button
          type="button"
          onClick={() => onDelete(address._id)}
          className="text-red-600 hover:underline text-sm"
        >
          Xóa
        </button>
      </div>
    </label>
  );
};

export default AddressItem;
