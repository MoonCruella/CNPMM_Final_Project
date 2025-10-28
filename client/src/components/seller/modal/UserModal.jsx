import React, { useMemo, useEffect, useState, useRef } from "react";
import orderService from "@/services/order.service";

const formatVND = (v) => {
  const n = Number(v) || 0;
  return n === 0 ? "0 ₫" : n.toLocaleString("vi-VN") + " ₫";
};

const fmtDate = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt)) return "-";
  return dt.toLocaleDateString("vi-VN");
};

const UserModal = ({ isOpen, onClose, user = {} }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // pagination state
  const [page, setPage] = useState(1);
  const limit = 10;
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const lastUserId = useRef(null);
  const abortControllerRef = useRef(null);

  const parseResponse = (resp) => {
    const data = resp?.data ?? resp ?? {};
    const arr = Array.isArray(data.orders)
      ? data.orders
      : Array.isArray(data.data)
      ? data.data
      : [];
    const pg = data.pagination ?? data;
    if (
      pg &&
      (pg.current_page != null ||
        pg.total_pages != null ||
        pg.total_orders != null)
    ) {
      return {
        orders: arr,
        pagination: {
          page: Number(pg.current_page ?? 1),
          per_page: Number(pg.per_page ?? pg.limit ?? limit),
          total: Number(pg.total_orders ?? pg.total ?? 0),
          pages: Number(
            pg.total_pages ??
              pg.pages ??
              Math.max(
                1,
                Math.ceil(
                  (pg.total_orders ?? arr.length) / (pg.per_page ?? limit)
                )
              )
          ),
          has_next: !!(
            pg.has_next ??
            (pg.current_page != null &&
              pg.total_pages != null &&
              Number(pg.current_page) < Number(pg.total_pages))
          ),
        },
      };
    }
    return { orders: arr, pagination: null };
  };

  // reset page when opening modal for a new user
  useEffect(() => {
    if (!isOpen) {
      setOrders([]);
      setPage(1);
      setPages(1);
      setTotal(0);
      lastUserId.current = null;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      return;
    }

    const userId = user?._id ?? user?.id;
    if (String(lastUserId.current) !== String(userId)) {
      lastUserId.current = userId ?? null;
      setPage(1);
    }
  }, [isOpen, user]);

  // fetch page (replace, not append)
  useEffect(() => {
    if (!isOpen) return;

    const userId = user?._id ?? user?.id;
    if (!userId) {
      setOrders([]);
      setPages(1);
      setTotal(0);
      return;
    }

    // abort previous
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    let mounted = true;
    const fetchPage = async () => {
      setLoading(true);
      try {
        const resp = await orderService.getUserOrdersByAdmin(
          "all",
          page,
          limit,
          String(userId)
        );
        if (!mounted) return;

        const { orders: arr, pagination } = parseResponse(resp);
        setOrders(arr);
        if (pagination) {
          setPages(pagination.pages || 1);
          setTotal(pagination.total || arr.length);
        } else {
          setPages(arr.length >= limit ? page + 1 : page);
          setTotal((prev) => (page === 1 ? arr.length : prev));
        }
      } catch (err) {
        if (err.name !== "CanceledError" && err.name !== "AbortError") {
          console.error("Fetch orders page error", err);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPage();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [isOpen, page, user]);

  const goPrev = () => {
    if (page <= 1 || loading) return;
    setPage((p) => p - 1);
  };
  const goNext = () => {
    if (page >= pages || loading) return;
    setPage((p) => p + 1);
  };

  const totalAmount = useMemo(() => {
    return (orders || []).reduce((s, o) => {
      const fromOrder =
        Number(o.total ?? o.total_amount ?? o.totalAmount ?? 0) || 0;
      if (fromOrder > 0) return s + fromOrder;
      // fallback: sum item totals if order total missing
      const items = Array.isArray(o.items)
        ? o.items
        : Array.isArray(o.data?.items)
        ? o.data.items
        : [];
      const itemsSum = items.reduce((is, it) => {
        const itTotal =
          Number(it.total ?? it.sale_price ?? it.price ?? 0) *
          (Number(it.quantity ?? it.qty ?? 1) || 1);
        return is + (Number(it.total ?? 0) || itTotal || 0);
      }, 0);
      return s + itemsSum;
    }, 0);
  }, [orders]);

  // helper: xuất text sản phẩm từ các shape khác nhau (ưu tiên product_id.name)
  const productsText = (o) => {
    const items = o.items ?? o.products ?? o.order_items ?? o.cart ?? [];
    if (!Array.isArray(items) || items.length === 0) return "-";
    const parts = items.map((it) => {
      const name =
        it.product_id?.name ??
        it.product?.name ??
        it.name ??
        it.title ??
        it.product_name ??
        it.sku ??
        "Sản phẩm";
      const qty =
        it.quantity ?? it.qty ?? it.count ?? it.amount ?? it.qty_ordered ?? 1;
      return `${name} x${qty}`;
    });
    // limit displayed items to avoid overflowing table cell
    if (parts.length <= 3) return parts.join(", ");
    return parts.slice(0, 3).join(", ") + ` +${parts.length - 3} khác`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-[92%] max-w-7xl bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            Chi tiết người dùng
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 rounded-md p-1"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Top: user info */}
          <div className="flex gap-4 items-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-2xl text-gray-500 overflow-hidden">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                (user.name || "U").charAt(0).toUpperCase()
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {user.name ?? "-"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {user.email ?? "-"}
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      user.active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {user.active ? "Đang hoạt động" : "Không hoạt động"}
                  </div>
                  <div className="text-sm mt-1 ml-2 bg-yellow-100 text-yellow-800 font-bold rounded-full px-3 py-1 inline-block">
                    Vai trò: {user.role ?? "-"}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-sm text-gray-600">
                <div>
                  <div className="text-xs text-gray-400">Số điện thoại</div>
                  <div className="mt-1">{user.phone ?? "-"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Ngày tạo</div>
                  <div className="mt-1">{fmtDate(user.createdAt)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">
                    Lần cuối đăng nhập
                  </div>
                  <div className="mt-1">{fmtDate(user.last_login)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Orders */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-800">Đơn hàng</h4>
              <div className="text-sm text-gray-600">
                Tổng:{" "}
                <span className="font-semibold text-gray-900">
                  {formatVND(totalAmount)}
                </span>
              </div>
            </div>

            {/* remove inner scrolling: show one page at a time and use pagination buttons */}
            <div className="w-full border rounded relative">
              {orders && orders.length > 0 ? (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-sm text-white border-b bg-gray-800">
                      <th className="py-2 px-2">Mã</th>
                      <th className="py-2 px-2">Sản phẩm</th>
                      <th className="py-2 px-2">Ngày</th>
                      <th className="py-2 px-2">Trạng thái</th>
                      <th className="py-2 px-2 text-right">Giá trị</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => {
                      const key = o.order_number ?? o._id ?? o.id ?? o.code;
                      const amount =
                        Number(
                          o.total ?? o.total_amount ?? o.totalAmount ?? 0
                        ) ||
                        // fallback to sum item totals
                        (Array.isArray(o.items)
                          ? o.items.reduce(
                              (s, it) =>
                                s +
                                (Number(it.total ?? 0) ||
                                  Number(it.sale_price ?? it.price ?? 0) *
                                    (Number(it.quantity ?? it.qty ?? 1) || 1)),
                              0
                            )
                          : 0);
                      return (
                        <tr key={key} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-2 text-gray-800">
                            {o.code ?? key}
                          </td>
                          <td className="py-3 px-2 text-gray-700 max-w-[340px] break-words">
                            {productsText(o)}
                          </td>
                          <td className="py-3 px-2 text-gray-600">
                            {fmtDate(o.created_at ?? o.createdAt)}
                          </td>
                          <td className="py-3 px-2 text-gray-600">
                            {o.status ?? "-"}
                          </td>
                          <td className="py-3 px-2 text-right text-gray-800 font-medium">
                            {formatVND(amount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : !loading ? (
                <div className="py-8 text-center text-gray-500">
                  Chưa có đơn hàng
                </div>
              ) : (
                <div className="min-h-[160px]" />
              )}

              {loading && (
                <div className="absolute inset-0 bg-white/70 z-20 flex items-center justify-center pointer-events-none">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-400 border-t-transparent" />
                    <div className="text-sm font-medium text-gray-700">
                      Loading
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-3">
              <div className="text-sm text-gray-600">Tổng đơn: {total}</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={goPrev}
                  disabled={page <= 1 || loading}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  {"<"}
                </button>
                <div className="text-sm px-3">
                  {page} / {pages || 1}
                </div>
                <button
                  onClick={goNext}
                  disabled={page >= pages || loading}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  {">"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserModal;
