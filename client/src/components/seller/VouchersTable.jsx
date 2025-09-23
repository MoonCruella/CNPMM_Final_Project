import React, { useState, useMemo } from "react";

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
    if (sortBy !== field) return "↕️";
    return sortOrder === "asc" ? "↑" : "↓";
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Đang tải voucher...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto shadow rounded-xl bg-white">
      <table className="w-full text-left">
        <thead className="bg-green-700">
          <tr>
            <th
              className="py-3 px-4 text-white cursor-pointer hover:bg-green-800 transition"
              onClick={() => handleSort("code")}
            >
              <div className="flex items-center gap-2">
                Mã voucher {getSortIcon("code")}
              </div>
            </th>
            <th className="py-3 px-4 text-white text-center">Loại</th>
            <th
              className="py-3 px-4 text-white text-center cursor-pointer hover:bg-green-800 transition"
              onClick={() => handleSort("discountValue")}
            >
              <div className="flex items-center justify-center gap-2">
                Giá trị giảm {getSortIcon("discountValue")}
              </div>
            </th>
            <th
              className="py-3 px-4 text-white text-center cursor-pointer hover:bg-green-800 transition"
              onClick={() => handleSort("startDate")}
            >
              <div className="flex items-center justify-center gap-2">
                Ngày bắt đầu {getSortIcon("startDate")}
              </div>
            </th>
            <th
              className="py-3 px-4 text-white text-center cursor-pointer hover:bg-green-800 transition"
              onClick={() => handleSort("endDate")}
            >
              <div className="flex items-center justify-center gap-2">
                Ngày kết thúc {getSortIcon("endDate")}
              </div>
            </th>
            <th className="py-3 px-4 text-white text-center">Trạng thái</th>
            <th className="py-3 px-4 text-white text-center">Thao tác</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {sortedVouchers.length > 0 ? (
            sortedVouchers.map((voucher) => (
              <tr key={voucher._id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">{voucher.code}</td>
                <td className="py-3 px-4 text-center">
                  {voucher.type === "DISCOUNT" ? "Giảm giá" : "Freeship"}
                </td>
                <td className="py-3 px-4 text-center">
                  {voucher.isPercent
                    ? `${voucher.discountValue}%`
                    : `${voucher.discountValue.toLocaleString()}₫`}
                </td>
                <td className="py-3 px-4 text-center">
                  {new Date(voucher.startDate).toLocaleDateString("vi-VN")}
                </td>
                <td className="py-3 px-4 text-center">
                  {new Date(voucher.endDate).toLocaleDateString("vi-VN")}
                </td>
                <td className="py-3 px-4 text-center">
                  {voucher.active ? (
                    <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-sm">
                      Hoạt động
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-sm">
                      Không hoạt động
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => onEdit && onEdit(voucher)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => onDelete && onDelete(voucher._id)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))
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
                    <p className="font-medium text-lg">Chưa có voucher nào</p>
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
