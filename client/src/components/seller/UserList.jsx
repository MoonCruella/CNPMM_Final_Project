import React, { useEffect, useState } from "react";
import userService from "@/services/user.service";
import {
  IconSearch,
  IconFilterX,
  IconEye,
  IconLock,
  IconLockOpen,
} from "@tabler/icons-react";
import UserModal from "./modal/UserModal";
import { assets } from "@/assets/assets";
import { Link, useNavigate } from "react-router-dom";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // user modal state (modal will lazy-load orders itself)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // filters
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [activeFilter, setActiveFilter] = useState("");

  // local paging
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // debounce search
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  // reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, role, activeFilter, limit]);

  // fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError("");
      try {
        const params = {
          page: Number(page) || 1,
          limit: Number(limit) || 10,
          search: debouncedSearch || "",
        };
        if (role) params.role = role;
        if (activeFilter !== "") params.active = String(activeFilter);

        const resp = await userService.getUserList(params);
        if (resp.success) {
          setUsers(resp.users || []);
          setPagination(
            resp.pagination || {
              page: params.page,
              limit: params.limit,
              total: 0,
              pages: 0,
            }
          );
        } else {
          setError(resp.message || "Lỗi khi tải danh sách");
          setUsers([]);
        }
      } catch (err) {
        console.error(err);
        setError(err?.message || "Lỗi không xác định");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [page, limit, debouncedSearch, role, activeFilter]);

  // confirm and toggle status
  const confirmAndToggle = async (user) => {
    const action = user.active ? "vô hiệu hóa" : "kích hoạt";
    const name = user.email || user.username || user.name || user._id;
    const ok = window.confirm(
      `Bạn có chắc muốn ${action} tài khoản "${name}"?`
    );
    if (!ok) return;

    try {
      setLoading(true);
      const resp = await userService.toggleUserStatus(user._id);
      if (resp.success) {
        const params = { page, limit, search: debouncedSearch || "" };
        if (role) params.role = role;
        if (activeFilter !== "") params.active = String(activeFilter);
        const refreshed = await userService.getUserList(params);
        if (refreshed.success) {
          setUsers(refreshed.users || []);
          setPagination(refreshed.pagination || pagination);
        }
      } else {
        alert(resp.message || "Không thể thay đổi trạng thái");
      }
    } catch (err) {
      console.error("confirmAndToggle error:", err);
      alert(err?.message || "Lỗi khi thay đổi trạng thái");
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (p) => {
    if (p < 1 || p > (pagination.pages || 1)) return;
    setPage(p);
  };

  // view user details
  const handleView = async (u) => {
    if (!u) return;
    // just set user and open modal — UserModal will fetch orders lazily on open
    setSelectedUser(u);
    setIsUserModalOpen(true);
  };

  const closeUserModal = () => {
    setIsUserModalOpen(false);
    setSelectedUser(null);
  };

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* Banner Section - Full width, outside container */}
      <section
        className="bg-cover bg-center py-20 text-center text-white relative"
        style={{ backgroundImage: `url(${assets.page_banner})` }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40"></div>
        
        {/* Content */}
        <div className="relative z-10">
          <h1 className="text-5xl font-bold drop-shadow-lg">Quản lý người dùng</h1>
          <ul className="flex justify-center gap-2 mt-2 text-sm">
            <li>
              <Link to="/seller" className="hover:underline font-medium">
                Dashboard
              </Link>
            </li>
            <li className="font-medium">/ Quản lý người dùng</li>
          </ul>
          {/* Show total count */}
          {!loading && pagination.total > 0 && (
            <p className="text-gray-200 text-sm mt-2">
              Tổng số {pagination.total} người dùng
            </p>
          )}
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* Filter bar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <IconSearch
                  size={18}
                  className="absolute left-3 top-2.5 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Tìm kiếm (tên/email)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-2 border rounded-lg w-84 bg-white text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-gray-400 focus:outline-none"
                />
              </div>

              {/* Role filter */}
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="px-3 py-2 border rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-gray-400"
              >
                <option value="">Tất cả vai trò</option>
                <option value="user">User</option>
                <option value="seller">Seller</option>
              </select>

              {/* Active filter */}
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-gray-400"
              >
                <option value="">Tất cả</option>
                <option value="true">Chỉ Active</option>
                <option value="false">Chỉ Inactive</option>
              </select>

              {/* Clear filters */}
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setRole("");
                  setActiveFilter("");
                  setPage(1);
                }}
                className="flex items-center gap-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition"
              >
                <IconFilterX size={16} />
                Xóa bộ lọc
              </button>
            </div>

            {/* Limit selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Hiển thị</label>
              <select
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value || 10))}
                className="px-3 py-2 border rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-gray-400"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-gray-100 rounded-lg">
            <table className="w-full text-sm border-collapse table-fixed">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-left text-gray-700 w-12">#</th>
                  <th className="p-3 text-left text-gray-700 w-48">Tên</th>
                  <th className="p-3 text-left text-gray-700 w-56">Email</th>
                  <th className="p-3 text-left text-gray-700 w-28">Vai trò</th>
                  <th className="p-3 text-left text-gray-700 w-28">Trạng thái</th>
                  <th className="p-3 text-left text-gray-700 w-36">Ngày tạo</th>
                  <th className="p-3 text-center text-gray-700 w-48">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="p-6">
                      <div className="flex items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-600 border-t-transparent" />
                        <div className="text-sm text-gray-700 font-medium">
                          Đang tải...
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-6 text-center text-gray-500">
                      Không có user
                    </td>
                  </tr>
                ) : (
                  users.map((u, idx) => (
                    <tr key={u._id || u.id} className="border-t last:border-b">
                      <td className="p-3 text-gray-800">
                        {(pagination.page - 1) * pagination.limit + idx + 1}
                      </td>
                      <td className="p-3 text-gray-800">{u.name}</td>
                      <td className="p-3 text-gray-700">{u.email}</td>
                      <td className="p-3 text-gray-700">{u.role}</td>
                      <td className="p-3">
                        <span
                          className={`text-sm font-medium ${
                            u.active ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {u.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString()
                          : "-"}
                      </td>

                      <td className="p-3 w-46">
                        <div className="inline-flex items-center gap-3 justify-center">
                          {/* View */}
                          <button
                            onClick={() => handleView(u)}
                            className="w-20 h-10 flex items-center justify-center gap-2 rounded-full bg-blue-50 border border-blue-100 text-black-800 hover:bg-blue-100 shadow-sm transition transform hover:-translate-y-0.5 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-300 whitespace-nowrap"
                            title="Xem"
                          >
                            <span className="text-sm">Xem</span>
                          </button>

                          {/* Lock / Unlock */}
                          <button
                            onClick={() => confirmAndToggle(u)}
                            className={`w-22 h-10 flex items-center ml-5 justify-center gap-2 rounded-full transition transform hover:-translate-y-0.5 active:scale-95 focus:outline-none focus:ring-2 focus:ring-black-300 whitespace-nowrap border border-blue-100 ${
                              u.active
                                ? "bg-white text-red-600 hover:bg-red-50"
                                : "bg-white text-green-600 hover:bg-green-50"
                            }`}
                            title={u.active ? "Khóa user" : "Mở khóa user"}
                          >
                            <span className="text-sm font-medium">
                              {u.active ? "Khóa" : "Mở khóa"}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* User detail modal */}
          <UserModal
            isOpen={isUserModalOpen}
            onClose={closeUserModal}
            user={selectedUser}
          />

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              Tổng: {pagination.total ?? 0}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1 border rounded text-gray-700 disabled:opacity-50"
              >
                {"<"}
              </button>
              {Array.from({ length: pagination.pages || 1 }).map((_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1 border rounded ${
                      page === p ? "bg-gray-800 text-white" : "text-gray-700"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= (pagination.pages || 1)}
                className="px-3 py-1 border rounded text-gray-700 disabled:opacity-50"
              >
                {">"}
              </button>
            </div>
          </div>

          {error && <div className="mt-3 text-sm text-red-500">{error}</div>}
        </div>
      </div>
    </main>
  );
};

export default UserList;