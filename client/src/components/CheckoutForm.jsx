import React, { useState } from "react";
import { assets } from "@/assets/assets";

const CheckoutForm = () => {
  const [payment, setPayment] = useState("cod");
  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState("");
  const [selectedAddress, setSelectedAddress] = useState("");

  const handleAddAddress = (e) => {
    e.preventDefault();
    if (newAddress.trim() === "") return;
    setAddresses([...addresses, newAddress]);
    setSelectedAddress(newAddress);
    setNewAddress("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedAddress) {
      alert("Vui lòng chọn hoặc nhập địa chỉ giao hàng!");
      return;
    }
    alert(`Thanh toán bằng: ${payment}\nGiao hàng đến: ${selectedAddress}`);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-2xl font-extrabold mb-6 text-green-800">
        Billing Details
      </h2>

      {/* Payment Method */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Payment Method</h3>
        <div className="space-y-3">
          {/* COD */}
          <label className="flex items-center gap-3 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="payment"
              value="cod"
              checked={payment === "cod"}
              onChange={(e) => setPayment(e.target.value)}
              className="w-5 h-5 accent-green-600"
            />
            <img src={assets.cod_icon} alt="COD" className="w-8 h-8" />
            <span>Cash on Delivery (COD)</span>
          </label>

          {/* VNPAY */}
          <label className="flex items-center gap-3 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="payment"
              value="vnpay"
              checked={payment === "vnpay"}
              onChange={(e) => setPayment(e.target.value)}
              className="w-5 h-5 accent-green-600"
            />
            <img src={assets.vnpay_icon} alt="VNPAY" className="w-8 h-8" />
            <span>VNPAY</span>
          </label>

          {/* ZaloPay */}
          <label className="flex items-center gap-3 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="payment"
              value="zalopay"
              checked={payment === "zalopay"}
              onChange={(e) => setPayment(e.target.value)}
              className="w-5 h-5 accent-green-600"
            />
            <img src={assets.zalo_pay} alt="ZaloPay" className="w-8 h-8" />
            <span>ZaloPay</span>
          </label>
        </div>
      </div>

      {/* Shipping Address */}
      <h3 className="text-lg font-semibold mt-8 mb-4">Shipping Address</h3>
      <div className="space-y-3">
        {addresses.length > 0 ? (
          <>
            {addresses.map((addr, idx) => (
              <label
                key={idx}
                className="flex items-center gap-3 border rounded-xl p-3 cursor-pointer hover:shadow"
              >
                <input
                  type="radio"
                  name="address"
                  value={addr}
                  checked={selectedAddress === addr}
                  onChange={(e) => setSelectedAddress(e.target.value)}
                  className="w-5 h-5 accent-green-600"
                />
                <span>{addr}</span>
              </label>
            ))}

            {/* Thêm địa chỉ mới */}
            <div className="mt-3">
              <input
                type="text"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="Nhập địa chỉ mới"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none mb-2"
              />
              <button
                onClick={handleAddAddress}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
              >
                + Lưu địa chỉ
              </button>
            </div>
          </>
        ) : (
          <>
            <input
              type="text"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="Nhập địa chỉ giao hàng"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none mb-2"
              required
            />
            <button
              onClick={handleAddAddress}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
            >
              + Lưu địa chỉ
            </button>
          </>
        )}
      </div>

      {/* Terms */}
      <div className="mt-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            className="w-4 h-4 accent-green-600 focus:ring-0"
            required
          />
          <span className="ml-2 text-sm text-gray-600">
            I have read and agree to the Terms and Conditions.
          </span>
        </label>
      </div>
    </form>
  );
};

export default CheckoutForm;
