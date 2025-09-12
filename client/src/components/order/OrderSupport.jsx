import React from "react";

const OrderSupport = () => (
  <div className="space-y-3 text-sm">
    <div className="flex items-center gap-3 text-gray-600">
      <span>📞</span>
      <div>
        <p className="font-medium">Hotline: 1900-xxxx</p>
        <p className="text-xs">Hỗ trợ 24/7</p>
      </div>
    </div>
    <div className="flex items-center gap-3 text-gray-600">
      <span>✉️</span>
      <div>
        <p className="font-medium">support@example.com</p>
        <p className="text-xs">Email hỗ trợ</p>
      </div>
    </div>
    <div className="flex items-center gap-3 text-gray-600">
      <span>💬</span>
      <div>
        <p className="font-medium">Chat trực tuyến</p>
        <p className="text-xs">8:00 - 22:00 hàng ngày</p>
      </div>
    </div>
    <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
      Liên hệ hỗ trợ
    </button>
  </div>
);

export default OrderSupport;