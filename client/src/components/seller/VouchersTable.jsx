import React, { useState, useMemo } from "react";
import {
  IconEdit,
  IconTrash,
  IconArrowsSort,
  IconChevronUp,
  IconChevronDown,
} from "@tabler/icons-react";

const VouchersTable = ({ vouchers, onEdit, onDelete, isLoading }) => {
  const [sortBy, setSortBy] = useState("startDate");
  const [sortOrder, setSortOrder] = useState("desc");

  // Sắp xếp
  const sortedVouchers = useMemo(() => {
    if (!Array.isArray(vouchers)) return [];

    return [...vouchers].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === "startDate" || sortBy === "endDate") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (sortBy === "discountValue" || sortBy === "maxDiscount") {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [vouchers, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field)
      return (
        <IconArrowsSort size={16} className="inline-block text-gray-400" />
      );
    return sortOrder === "asc" ? (
      <IconChevronUp size={16} className="inline-block text-gray-600" />
    ) : (
      <IconChevronDown size={16} className="inline-block text-gray-600" />
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="w-8 h-8 border-4 border-gray-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-700">Đang tải voucher...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto shadow rounded-xl bg-white">
      <table className="w-full text-left">
        <thead className="bg-gray-200">
          <tr>
            <th
              className="py-3 px-4 text-gray-700 cursor-pointer hover:bg-gray-200 transition"
              onClick={() => handleSort("code")}
            >
              <div className="flex items-center gap-2">
                Mã voucher {getSortIcon("code")}
              </div>
            </th>
            <th className="py-3 px-4 text-gray-700 text-center">Loại</th>
            <th
              className="py-3 px-4 text-gray-700 text-center cursor-pointer hover:bg-gray-200 transition"
              onClick={() => handleSort("discountValue")}
            >
              <div className="flex items-center justify-center gap-2">
                Giá trị giảm {getSortIcon("discountValue")}
              </div>
            </th>
            <th
              className="py-3 px-4 text-gray-700 text-center cursor-pointer hover:bg-gray-200 transition"
              onClick={() => handleSort("startDate")}
            >
              <div className="flex items-center justify-center gap-2">
                Ngày bắt đầu {getSortIcon("startDate")}
              </div>
            </th>
            <th
              className="py-3 px-4 text-gray-700 text-center cursor-pointer hover:bg-gray-200 transition"
              onClick={() => handleSort("endDate")}
            >
              <div className="flex items-center justify-center gap-2">
                Ngày kết thúc {getSortIcon("endDate")}
              </div>
            </th>
            <th className="py-3 px-4 text-gray-700 text-center">Trạng thái</th>
            <th className="py-3 px-4 text-gray-700 text-center">Thao tác</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {sortedVouchers.length > 0 ? (
            sortedVouchers.map((voucher) => {
              return (
                <tr key={voucher._id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-800">
                    {voucher.code}
                  </td>
                  {/* chỉ tô màu quanh ô "Loại" */}
                  <td className="py-3 px-4 text-center">
                    {(() => {
                      const t = String(voucher.type || "").toUpperCase();
                      const badgeClass =
                        t === "FREESHIP"
                          ? "ring-1 ring-green-200 bg-green-100 text-green-800"
                          : t === "DISCOUNT"
                          ? "ring-1 ring-amber-200 bg-orange-100 text-amber-800"
                          : "text-gray-700";
                      const label = t === "DISCOUNT" ? "Giảm giá" : "Freeship";
                      return (
                        <span
                          className={`inline-block px-3 py-1 rounded-md text-sm font-medium ${badgeClass}`}
                        >
                          {label}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="py-3 px-4 text-center text-gray-700">
                    {String(voucher.type || "").toUpperCase() === "FREESHIP"
                      ? (voucher.maxDiscount ??
                          voucher.maxValue ??
                          voucher.max_value) !== undefined &&
                        (voucher.maxDiscount ??
                          voucher.maxValue ??
                          voucher.max_value) !== null
                        ? `${Number(
                            voucher.maxDiscount ??
                              voucher.maxValue ??
                              voucher.max_value
                          ).toLocaleString("vi-VN")} ₫`
                        : "-"
                      : voucher.isPercent
                      ? `${voucher.discountValue}%`
                      : `${Number(voucher.discountValue || 0).toLocaleString(
                          "vi-VN"
                        )} ₫`}
                  </td>
                  <td className="py-3 px-4 text-center text-gray-700">
                    {voucher.startDate
                      ? new Date(voucher.startDate).toLocaleDateString("vi-VN")
                      : "-"}
                  </td>
                  <td className="py-3 px-4 text-center text-gray-700">
                    {voucher.endDate
                      ? new Date(voucher.endDate).toLocaleDateString("vi-VN")
                      : "-"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {/* text-only status like UserList */}
                    {voucher.active ? (
                      <span className="text-sm font-medium text-green-600">
                        Hoạt động
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-red-600">
                        Không hoạt động
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => onEdit && onEdit(voucher)}
                        className="w-24 h-10 flex items-center justify-center gap-2 rounded-full bg-blue-50 border border-blue-100 text-blue-800 hover:bg-blue-100 shadow-sm transition transform hover:-translate-y-0.5 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-300 whitespace-nowrap"
                      >
                        <IconEdit size={16} />
                        <span>Sửa</span>
                      </button>
                      <button
                        onClick={() => onDelete && onDelete(voucher._id)}
                        className="w-24 h-10 flex items-center justify-center gap-2 rounded-full bg-white border border-blue-100 text-red-600 hover:bg-red-50 shadow-sm transition transform hover:-translate-y-0.5 active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-300 whitespace-nowrap"
                      >
                        <IconTrash size={16} />
                        <span>Xóa</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td
                colSpan="7"
                className="py-12 text-center text-gray-500 bg-white"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    🎟️
                  </div>
                  <div>
                    <p className="font-medium text-lg text-gray-800">
                      Chưa có voucher nào
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Hãy thêm voucher mới để bắt đầu
                    </p>
                  </div>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default React.memo(VouchersTable);
