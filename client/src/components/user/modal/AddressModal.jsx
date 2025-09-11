import React from "react";
import AddressForm from "../AddressForm";

const AddressModal = ({
  isOpen,
  onClose,
  onSubmit,
  addressToEdit = null, // dữ liệu ban đầu nếu sửa địa chỉ
}) => {
  if (!isOpen) return null; // Ẩn modal nếu chưa mở

  return (
    <div className="fixed inset-0 bg-black/40 bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6 relative animate-fade-in">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
        >
          ✕
        </button>

        {/* Form */}
        <AddressForm
          addressToEdit={addressToEdit} // truyền vào nếu edit
          onSubmit={async (data) => {
            await onSubmit(data); // gọi hàm submit từ cha
            onClose(); // đóng modal sau khi submit xong
          }}
          onCancel={onClose}
        />
      </div>
    </div>
  );
};

export default AddressModal;
