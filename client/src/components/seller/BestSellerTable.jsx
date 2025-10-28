import React, { useCallback, useEffect, useRef, useState } from "react";
import revenueService from "@/services/revenueService";

const fmtVND = (v = 0) => Number(v || 0).toLocaleString("vi-VN") + " ₫";

const BestSellerTable = ({ initialPeriod = "week", initialSort = "max" }) => {
  const [period, setPeriod] = useState(initialPeriod); // "week" | "month"
  const [sort, setSort] = useState(initialSort); // "max" | "min"
  const [limit, setLimit] = useState(10);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  const debounceRef = useRef(null);

  const fetchData = useCallback(
    async ({ signal } = {}) => {
      // abort previous
      if (abortRef.current) abortRef.current.abort();
      const c = new AbortController();
      abortRef.current = c;
      setLoading(true);
      setError(null);
      try {
        const resp = await revenueService.getTopProducts(
          { period, limit, sort },
          { signal: c.signal }
        );
        if (resp?.success) {
          setRows(Array.isArray(resp.data) ? resp.data : []);
        } else {
          setRows([]);
          setError(resp?.error ?? "Không lấy được dữ liệu");
        }
      } catch (err) {
        if (err?.name !== "AbortError") setError("Lỗi mạng");
      } finally {
        setLoading(false);
      }
    },
    [period, sort, limit]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchData();
    }, 150);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [period, sort, limit, fetchData]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const onClearFilters = () => {
    setPeriod(initialPeriod);
    setSort(initialSort);
    setLimit(10);
  };

  const stopEnter = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <label className="text-xs text-gray-500">Thời gian</label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            onKeyDown={stopEnter}
            className="px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors hover:border-blue-400"
          >
            <option value="week">Tuần</option>
            <option value="month">Tháng</option>
          </select>

          <label className="text-xs text-gray-500">Sắp xếp</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            onKeyDown={stopEnter}
            className="px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors hover:border-blue-400"
          >
            <option value="max">Bán chạy nhất</option>
            <option value="min">Ít bán nhất</option>
          </select>

          <label className="text-xs text-gray-500">Limit</label>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            onKeyDown={stopEnter}
            className="px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors hover:border-blue-400"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>

          <button
            type="button"
            onKeyDown={stopEnter}
            onClick={onClearFilters}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer "
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>
      {error ? <div className="text-sm text-red-600 mb-3">{error}</div> : null}

      <div className="relative overflow-x-auto">
        {loading && (
          <div className="absolute inset-0 z-20 bg-white/60 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-2 pointer-events-auto">
              <div className="w-8 h-8">
                <div className="animate-spin rounded-full border-4 border-gray-600 border-t-transparent w-8 h-8" />
              </div>
            </div>
          </div>
        )}

        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b">
              <th className="py-2 pl-2">#</th>
              <th className="py-2">Sản phẩm</th>
              <th className="py-2">Tên</th>
              <th className="py-2 text-right pr-4">Số lượng</th>
              <th className="py-2 text-right pr-4">Doanh thu</th>
            </tr>
          </thead>
          <tbody>
            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-gray-500">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              rows.map((r, idx) => {
                const img =
                  (r?.image && (r.image.url || r.image.image_url || r.image)) ||
                  null;
                const slug = r.slug || r.key || "";
                const name = r.name || "Unknown";
                return (
                  <tr key={r.key ?? idx} className="border-b last:border-b-0">
                    <td className="py-3 pl-2 w-10">{idx + 1}</td>
                    <td className="py-2 w-16">
                      {img ? (
                        <img
                          src={img}
                          alt={name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                          —
                        </div>
                      )}
                    </td>
                    <td className="py-2">
                      {slug ? (
                        <a
                          href={`/seller/products`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {name}
                        </a>
                      ) : (
                        <div className="text-sm text-gray-800">{name}</div>
                      )}
                    </td>
                    <td className="py-2 text-right pr-4 font-medium">
                      {Number(r.totalQuantity ?? 0).toLocaleString()}
                    </td>
                    <td className="py-2 text-right pr-4">
                      <span className="font-medium">
                        {fmtVND(r.totalRevenue)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BestSellerTable;
