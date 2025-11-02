import React, { useEffect, useState } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { IconArrowDownRight, IconArrowUpRight } from "@tabler/icons-react";
import revenueService from "@/services/revenueService";

const fmtVND = (n = 0) => Number(n || 0).toLocaleString("vi-VN") + " ₫";

const pad = (n) => (n < 10 ? `0${n}` : String(n));

const SummaryCards = ({ summary }) => {
  console.log("SummaryCards summary prop:", summary);
  const [revenueMonth, setRevenueMonth] = useState(summary?.revenueMonth ?? 0);
  const [percentChange, setPercentChange] = useState(
    summary?.revenueMonthChange ?? null
  );
  const [loading, setLoading] = useState(false);

  // sparkline real data
  const [sparkData, setSparkData] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const now = new Date();
        const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // fetch monthly aggregated data for prev month .. today
        const startISO = new Date(
          prev.getFullYear(),
          prev.getMonth(),
          1
        ).toISOString();
        const endISO = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999
        ).toISOString();

        const resp = await revenueService.getRevenue(
          { period: "month", start: startISO, end: endISO },
          { signal: controller.signal }
        );

        const arr = Array.isArray(resp?.data)
          ? resp.data
          : resp?.data?.data ?? [];

        const prevKey = `${prev.getFullYear()}-${pad(prev.getMonth() + 1)}`;
        const curKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;

        const prevItem = arr.find((x) => x.period === prevKey) || {
          revenue: 0,
        };
        const curItem = arr.find((x) => x.period === curKey) || { revenue: 0 };

        const prevVal = Number(prevItem.revenue || 0);
        const curVal = Number(curItem.revenue || 0);

        setRevenueMonth(curVal);

        if (prevVal === 0) {
          setPercentChange(prevVal === curVal ? 0 : null); // null => cannot compute %
        } else {
          setPercentChange(((curVal - prevVal) / prevVal) * 100);
        }
      } catch (err) {
        if (err?.name !== "AbortError") {
          setPercentChange(null);
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // fetch real sparkline (last 6 days including today)
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const days = 6;
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        const start = new Date();
        start.setDate(start.getDate() - (days - 1));
        start.setHours(0, 0, 0, 0);

        const resp = await revenueService.getRevenue(
          { period: "day", start: start.toISOString(), end: end.toISOString() },
          { signal: controller.signal }
        );

        const arr = Array.isArray(resp?.data)
          ? resp.data
          : resp?.data?.data ?? [];
        // build map period -> revenue
        const map = new Map(
          (arr || []).map((a) => [a.period, Number(a.revenue || 0)])
        );

        const list = [];
        const cur = new Date(start);
        for (let i = 0; i < days; i++) {
          const key = `${cur.getFullYear()}-${pad(cur.getMonth() + 1)}-${pad(
            cur.getDate()
          )}`;
          list.push({ value: map.get(key) ?? 0, period: key });
          cur.setDate(cur.getDate() + 1);
        }
        setSparkData(list);
      } catch (err) {
        if (err?.name !== "AbortError") setSparkData([]);
      }
    })();

    return () => controller.abort();
  }, []);

  const isPositive = percentChange !== null ? percentChange >= 0 : null;

  return (
    <div className="grid grid-cols-1 m-3 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {/* Doanh thu hôm nay */}
      <div className="bg-white p-3 rounded-2xl shadow-sm">
        <div className="text-sm font-bold text-gray-700 uppercase">Hôm nay</div>
        <div className="mt-2 font-semibold">
          {fmtVND(summary?.revenueToday ?? 0)}
        </div>
        <div className="text-xs text-gray-400">
          {summary?.ordersToday ?? 0} đơn
        </div>
      </div>

      {/* Doanh thu tuần */}
      <div className="bg-white p-3 rounded-2xl shadow-sm">
        <div className="text-sm font-bold text-gray-700 uppercase">
          Tuần này
        </div>
        <div className="mt-2 font-semibold">
          {fmtVND(summary?.revenueWeek ?? 0)}
        </div>
        <div className="text-xs text-gray-400">
          {summary?.ordersWeek ?? 0} đơn
        </div>
      </div>

      {/* Doanh thu tháng - kiểu như ảnh, lấy dữ liệu qua API */}
      <div className="bg-white p-3 rounded-2xl shadow-sm flex flex-col">
        <div className="text-xs font-bold text-gray-700 uppercase">
          Tháng này
        </div>

        <div className="mt-1 text-2xl font-bold text-gray-900">
          {loading ? "..." : fmtVND(revenueMonth)}
        </div>

        <div
          className={`flex items-center gap-1 text-sm font-medium mt-1 ${
            percentChange === null
              ? "text-gray-600"
              : isPositive
              ? "text-green-600"
              : "text-red-500"
          }`}
        >
          {percentChange === null ? (
            <span className="text-xs text-gray-500">—</span>
          ) : isPositive ? (
            <>
              <IconArrowUpRight size={16} />
              {`${percentChange.toFixed(1)}%`}
            </>
          ) : (
            <>
              <IconArrowDownRight size={16} />
              {`${percentChange.toFixed(1)}%`}
            </>
          )}
        </div>

        {/* Sparkline chart using real data */}
        <div className="h-[40px] mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={isPositive ? "#16a34a" : "#ef4444"}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;
