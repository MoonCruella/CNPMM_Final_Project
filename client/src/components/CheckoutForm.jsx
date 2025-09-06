import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import { useAddressContext } from "@/context/AddressContext";
import AddressModal from "./modal/AddressModal";
import AddressItem from "./item/AddressItem";

const CheckoutForm = () => {
  const {
    addresses,
    loadAddresses,
    addAddress,
    updateAddress,
    removeAddress,
    selectedAddress,
    setSelectedAddress,
    paymentMethod,
    setPaymentMethod,
  } = useAddressContext();

  const [showModal, setShowModal] = useState(false);
  const [editAddress, setEditAddress] = useState(null);

  // load danh sách địa chỉ khi mở trang
  useEffect(() => {
    loadAddresses();
  }, []);

  // Lưu địa chỉ (thêm hoặc sửa)
  const handleSaveAddress = async (data) => {
    if (editAddress) {
      await updateAddress(editAddress._id, data);
    } else {
      await addAddress(data);
    }
    setShowModal(false);
    setEditAddress(null);
  };

  return (
    <div>
      {/* Payment Method */}
      <div>
        <h4 className="text-xl font-semibold mb-4">Phương thức thanh toán</h4>
        <div className="space-y-3 w-full sm:w-2/3">
          {[
            {
              value: "cod",
              label: "Thanh toán khi nhận hàng (COD)",
              icon: assets.cod_icon,
            },
            { value: "vnpay", label: "VNPAY", icon: assets.vnpay_icon },
            { value: "zalopay", label: "ZaloPay", icon: assets.zalo_pay },
          ].map((method) => (
            <label
              key={method.value}
              className="flex items-center gap-3 border rounded-lg p-3 cursor-pointer hover:bg-gray-50"
            >
              <input
                type="radio"
                name="payment"
                value={method.value}
                checked={paymentMethod === method.value}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-5 h-5 accent-green-600"
              />
              <img src={method.icon} alt={method.label} className="w-8 h-8" />
              <span>{method.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Shipping Address */}
      <h4 className="text-lg font-semibold mt-8 mb-4">Địa chỉ nhận hàng</h4>
      <div className="space-y-3">
        {addresses.length === 0 && (
          <p className="text-gray-500">
            Chưa có địa chỉ nào, vui lòng thêm mới.
          </p>
        )}

        {addresses.map((addr) => (
          <AddressItem
            key={addr._id}
            address={addr}
            selected={selectedAddress?._id === addr._id} // thêm ? để tránh lỗi null
            onSelect={() => setSelectedAddress(addr)} // set toàn bộ object
            onEdit={(a) => {
              setEditAddress(a);
              setShowModal(true);
            }}
            onDelete={removeAddress}
            isDefault={addr.is_default}
          />
        ))}

        {/* Nút mở modal thêm địa chỉ */}
        <button
          type="button"
          onClick={() => {
            setEditAddress(null);
            setShowModal(true);
          }}
          className="px-4 py-2 mt-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          + Thêm địa chỉ mới
        </button>
      </div>

      {/* Modal Form */}
      {showModal && (
        <AddressModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditAddress(null);
          }}
          onSubmit={handleSaveAddress}
          addressToEdit={editAddress}
        />
      )}
    </div>
  );
};

export default CheckoutForm;
