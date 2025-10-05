import React, { useState, useMemo } from "react";

const ProductsTable = ({ products, onEdit, onDelete, onView, isLoading }) => {
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  // Sắp xếp
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
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
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
        <p className="text-gray-600">Đang tải sản phẩm...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto shadow rounded-xl bg-white">
      <table className="w-full text-left">
        <thead className="bg-green-700">
          <tr>
            <th className="py-3 px-4 text-white text-center">Ảnh</th>
            <th
              className="py-3 px-4 text-white cursor-pointer hover:bg-green-800 transition"
              onClick={() => handleSort("name")}
            >
              <div className="flex items-center gap-2">Tên sản phẩm {getSortIcon("name")}</div>
            </th>
            <th
              className="py-3 px-4 text-white text-center cursor-pointer hover:bg-green-800 transition"
              onClick={() => handleSort("price")}
            >
              <div className="flex items-center justify-center gap-2">Giá {getSortIcon("price")}</div>
            </th>
            <th className="py-3 px-4 text-white text-center">Danh mục</th>
            <th
              className="py-3 px-4 text-white text-center cursor-pointer hover:bg-green-800 transition"
              onClick={() => handleSort("stock_quantity")}
            >
              <div className="flex items-center justify-center gap-2">Tồn Kho {getSortIcon("stock_quantity")}</div>
            </th>
            <th className="py-3 px-4 text-white text-center">Trạng thái</th>
            <th className="py-3 px-4 text-white text-center">Thao tác</th>
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
                <td className="py-3 px-4">{p.name}</td>
                <td className="py-3 px-4 text-center">{p.price?.toLocaleString()}₫</td>
                <td className="py-3 px-4 text-center">{p.categoryName}</td>
                <td className="py-3 px-4 text-center">{p.stock_quantity}</td>
                <td className="py-3 px-4 text-center">
                  {p.status === "active" ? (
                    <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-sm">Đang bán</span>
                  ) : (
                    <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-sm">Ngừng bán</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => onView && onView(p)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                      Chi tiết
                    </button>
                    <button
                      onClick={() => onEdit && onEdit(p)}
                      className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => onDelete && onDelete(p._id)}
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
              <td colSpan="7" className="py-12 text-center text-gray-500 bg-white">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">📦</div>
                  <div>
                    <p className="font-medium text-lg">Chưa có sản phẩm nào</p>
                    <p className="text-sm text-gray-400 mt-1">Hãy thêm sản phẩm mới để bắt đầu</p>
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
