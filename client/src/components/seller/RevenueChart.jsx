import React from "react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const fmtCurrency = (v = 0) => Number(v || 0).toLocaleString("vi-VN") + " ₫";

const formatPeriodLabel = (p) => {
  if (!p) return "";
  const dayMatch = /^\d{4}-\d{2}-\d{2}$/;
  const monthMatch = /^\d{4}-\d{2}$/;
  if (dayMatch.test(p)) {
    const [y, m, d] = p.split("-");
    return `${d}/${m}/${y}`;
  }
  if (monthMatch.test(p)) {
    const [y, m] = p.split("-");
    return `${m}/${y}`;
  }
  return String(p);
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload || {};
    const revenue = Number(data.revenue ?? payload[0].value ?? 0);
    const orders = Number(data.orders ?? 0);

    return (
      <div className="bg-white shadow p-2 rounded text-sm border border-gray-200">
        <div className="font-medium">{formatPeriodLabel(label)}</div>
        <div className="text-sm text-gray-700 mt-1">
          <span className="text-blue-600">{fmtCurrency(revenue)}</span>
        </div>
        <div className="text-sm text-gray-700">
          Số đơn hàng: <span className="font-medium">{orders}</span>
        </div>
      </div>
    );
  }
  return null;
};

const RevenueChart = ({ points = [], loading }) => {
  return (
    <div>
      <div className="h-[260px] flex items-center justify-center">
        {loading ? (
          <div className="w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : points && points.length ? (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart
              data={points}
              margin={{ top: 10, right: 20, bottom: 10, left: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <CartesianGrid stroke="#e6e9ee" strokeDasharray="3 3" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 11 }}
                tickFormatter={formatPeriodLabel}
              />
              <YAxis
                tickFormatter={(v) => fmtCurrency(v)}
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#2563EB"
                strokeWidth={2.5}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-sm text-gray-500">Không có dữ liệu</div>
        )}
      </div>

      <div className="mt-3 text-sm text-gray-500 flex items-center justify-between">
        <div>
          {points && points.length
            ? `${formatPeriodLabel(points[0].period)} → ${formatPeriodLabel(
                points[points.length - 1].period
              )}`
            : "Không có dữ liệu"}
        </div>
        <div>Nguồn: Hệ thống</div>
      </div>
    </div>
  );
};

export default RevenueChart;
