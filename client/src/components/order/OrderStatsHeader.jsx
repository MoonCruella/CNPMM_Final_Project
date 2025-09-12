import React from "react";
import { Link } from "react-router-dom";
import { assets } from "@/assets/assets";

const OrderStatsHeader = ({ orderStats }) => (
  <section
    className="bg-cover bg-center py-20 text-center text-white"
    style={{ backgroundImage: `url(${assets.page_banner})` }}
  >
    <h1 className="text-5xl font-bold mb-6">Quản lý đơn hàng</h1>
    <div className="flex flex-wrap justify-center gap-6 mt-4">
      {[
        { key: "all", label: "Tất cả", count: orderStats.total },
        { key: "pending", label: "Chờ xác nhận", value: orderStats.pending, icon: "⏰", color: "bg-gray-400" },
        { key: "confirmed", label: "Đã xác nhận", value: orderStats.confirmed, icon: "✔️", color: "bg-indigo-500" },
        { key: "processing", label: "Đang chuẩn bị hàng", value: orderStats.processing, icon: "🛒", color: "bg-yellow-500" },
        { key: "shipped", label: "Đang giao hàng", value: orderStats.shipped, icon: "🚚", color: "bg-purple-500" },
        { key: "delivered", label: "Đã giao", value: orderStats.delivered, icon: "✅", color: "bg-green-500" },
        { key: "cancelled", label: "Đã hủy", value: orderStats.cancelled, icon: "❌", color: "bg-red-500" },
      ].map(stat => (
        <div key={stat.key} className="flex flex-col items-center mx-2">
          <div className={`w-12 h-12 ${stat.color} rounded-full flex items-center justify-center text-white text-2xl mb-2`}>
            {stat.icon}
          </div>
          <div className="text-lg font-semibold">{stat.value}</div>
          <div className="text-xs">{stat.label}</div>
        </div>
      ))}
    </div>
    <ul className="flex justify-center gap-2 mt-6 text-sm">
      <li>
        <Link to="/seller/dashboard" className="hover:underline font-medium">
          Dashboard
        </Link>
      </li>
      <li className="font-medium">/ Quản lý đơn hàng</li>
    </ul>
  </section>
);

export default OrderStatsHeader;