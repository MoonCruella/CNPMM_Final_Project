import React, { useState, useMemo } from "react";
import {
  IconEdit,
  IconTrash,
  IconEye,
  IconArrowsSort,
  IconChevronUp,
  IconChevronDown,
} from "@tabler/icons-react";

const ProductsTable = ({ products, onEdit, onDelete, onView, isLoading }) => {
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  const sortedProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];

    return [...products].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === "price" || sortBy === "stock_quantity") {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      } else if (sortBy === "createdAt") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === "asc") return aValue > bValue ? 1 : -1;
      return aValue < bValue ? 1 : -1;
    });
  }, [products, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else {
      setSortBy(field);
      setSortOrder("asc");
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
        <p className="text-gray-700">Đang tải sản phẩm...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto shadow rounded-xl bg-white">
      <table className="w-full text-left">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-3 px-4 text-gray-700 text-center">Ảnh</th>
            <th
              className="py-3 px-4 text-gray-700 cursor-pointer hover:bg-gray-200 transition"
              onClick={() => handleSort("name")}
            >
              <div className="flex items-center gap-2">
                Tên sản phẩm {getSortIcon("name")}
              </div>
            </th>
            <th
              className="py-3 px-4 text-gray-700 text-center cursor-pointer hover:bg-gray-200 transition"
              onClick={() => handleSort("price")}
            >
              <div className="flex items-center justify-center gap-2">
                Giá {getSortIcon("price")}
              </div>
            </th>
            <th className="py-3 px-4 text-gray-700 text-center">Danh mục</th>
            <th
              className="py-3 px-4 text-gray-700 text-center cursor-pointer hover:bg-gray-200 transition"
              onClick={() => handleSort("stock_quantity")}
            >
              <div className="flex items-center justify-center gap-2">
                Tồn kho {getSortIcon("stock_quantity")}
              </div>
            </th>
            <th className="py-3 px-4 text-gray-700 text-center">Trạng thái</th>
            <th className="py-3 px-4 text-gray-700 text-center">Thao tác</th>
          </tr>
        </thead>

        <tbody className="bg-white">
          {sortedProducts.length > 0 ? (
            sortedProducts.map((p) => (
              <tr key={p._id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 text-center">
                  <img
                    src={p.primary_image}
                    alt={p.name}
                    className="h-12 w-12 object-cover rounded mx-auto"
                  />
                </td>
                <td className="py-3 px-4 font-medium text-gray-800">
                  {p.name}
                </td>
                <td className="py-3 px-4 text-center text-gray-700">
                  {p.price?.toLocaleString()}₫
                </td>
                <td className="py-3 px-4 text-center text-gray-700">
                  {p.category_id.name}
                </td>
                <td className="py-3 px-4 text-center text-gray-700">
                  {p.stock_quantity}
                </td>
                <td className="py-3 px-4 text-center">
                  {p.status === "active" ? (
                    <span className="text-sm font-medium text-green-600">
                      Đang bán
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-red-600">
                      Ngừng bán
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => onView && onView(p)}
                      className="w-24 h-10 flex items-center justify-center gap-2 rounded-full bg-blue-50 border border-blue-100 text-blue-800 hover:bg-blue-100 shadow-sm transition transform hover:-translate-y-0.5 active:scale-95"
                    >
                      <IconEye size={16} />
                      <span>Xem</span>
                    </button>
                    <button
                      onClick={() => onEdit && onEdit(p)}
                      className="w-24 h-10 flex items-center justify-center gap-2 rounded-full bg-yellow-50 border border-yellow-100 text-yellow-800 hover:bg-yellow-100 shadow-sm transition transform hover:-translate-y-0.5 active:scale-95"
                    >
                      <IconEdit size={16} />
                      <span>Sửa</span>
                    </button>
                    <button
                      onClick={() => onDelete && onDelete(p._id)}
                      className="w-24 h-10 flex items-center justify-center gap-2 rounded-full bg-white border border-red-100 text-red-600 hover:bg-red-50 shadow-sm transition transform hover:-translate-y-0.5 active:scale-95"
                    >
                      <IconTrash size={16} />
                      <span>Xóa</span>
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
                    📦
                  </div>
                  <div>
                    <p className="font-medium text-lg text-gray-800">
                      Chưa có sản phẩm nào
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Hãy thêm sản phẩm mới để bắt đầu
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

export default React.memo(ProductsTable);
