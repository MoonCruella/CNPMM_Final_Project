import React, { useState } from "react";

const OrderSearchForm = ({ onSearch, userRole = "user" }) => {
  const [searchParams, setSearchParams] = useState({
    q: "",
    order_number: "",
    customer_name: "",
    customer_phone: "",
    date_from: "",
    date_to: "",
    min_amount: "",
    max_amount: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchParams);
  };

  const handleReset = () => {
    setSearchParams({
      q: "",
      order_number: "",
      customer_name: "",
      customer_phone: "",
      date_from: "",
      date_to: "",
      min_amount: "",
      max_amount: ""
    });
    onSearch({});
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Tìm kiếm chung */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tìm kiếm chung
          </label>
          <input
            type="text"
            value={searchParams.q}
            onChange={e => setSearchParams(prev => ({ ...prev, q: e.target.value }))}
            placeholder="Mã đơn, tên khách hàng, SĐT..."
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        {/* Mã đơn hàng */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mã đơn hàng
          </label>
          <input
            type="text"
            value={searchParams.order_number}
            onChange={e => setSearchParams(prev => ({ ...prev, order_number: e.target.value }))}
            placeholder="ORD123456..."
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        {/* Chỉ hiển thị cho seller */}
        {userRole === "seller" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên khách hàng
              </label>
              <input
                type="text"
                value={searchParams.customer_name}
                onChange={e => setSearchParams(prev => ({ ...prev, customer_name: e.target.value }))}
                placeholder="Nguyễn Văn A..."
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="text"
                value={searchParams.customer_phone}
                onChange={e => setSearchParams(prev => ({ ...prev, customer_phone: e.target.value }))}
                placeholder="0123456789"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </>
        )}

        {/* Khoảng thời gian */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Từ ngày
          </label>
          <input
            type="date"
            value={searchParams.date_from}
            onChange={e => setSearchParams(prev => ({ ...prev, date_from: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Đến ngày
          </label>
          <input
            type="date"
            value={searchParams.date_to}
            onChange={e => setSearchParams(prev => ({ ...prev, date_to: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        {/* Khoảng giá */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Giá từ
          </label>
          <input
            type="number"
            value={searchParams.min_amount}
            onChange={e => setSearchParams(prev => ({ ...prev, min_amount: e.target.value }))}
            placeholder="100000"
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Giá đến
          </label>
          <input
            type="number"
            value={searchParams.max_amount}
            onChange={e => setSearchParams(prev => ({ ...prev, max_amount: e.target.value }))}
            placeholder="1000000"
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
      </div>

      <div className="flex  justify-end gap-3 mt-4">
        <button
          type="submit"
          className="px-4 py-2  bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          🔍 Tìm kiếm
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          🗑️ Xóa bộ lọc
        </button>
      </div>
    </form>
  );
};

export default OrderSearchForm;