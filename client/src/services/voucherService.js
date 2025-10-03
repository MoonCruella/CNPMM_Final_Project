// src/services/voucherService.js
import privateApi from "./privateApi";

const voucherService = {
  // 📌 1. Lấy danh sách voucher (Admin, có filter + phân trang)
  getAll: async ({
    active,
    type,
    code,
    startDate,
    endDate,
    page = 1,
    limit = 10,
  } = {}) => {
    const params = new URLSearchParams();

    if (active && active !== "all") params.append("active", active);
    if (type && type !== "all") params.append("type", type);
    if (code !== "") params.append("code", code);
    if (startDate != "") params.append("startDate", startDate);
    if (endDate != "") params.append("endDate", endDate);

    params.append("page", page);
    params.append("limit", limit);

    const url = `/api/vouchers?${params.toString()}`;
    const res = await privateApi.get(url);
    return res.data; // { totalItems, totalPages, currentPage, limit, vouchers }
  },

  // 📌 2. Tạo voucher (Admin)
  create: async (voucherData) => {
    const res = await privateApi.post("/api/vouchers", voucherData);
    return res.data;
  },

  // 📌 3. Cập nhật voucher (Admin)
  update: async (id, voucherData) => {
    const res = await privateApi.put(`/api/vouchers/${id}`, voucherData);
    return res.data;
  },

  // 📌 4. Xóa voucher (Admin)
  remove: async (id) => {
    const res = await privateApi.delete(`/api/vouchers/${id}`);
    return res.data;
  },

  // 📌 5. Áp dụng voucher (User)
  apply: async (code, orderValue, shippingFee) => {
    const res = await privateApi.post("/api/vouchers/apply", {
      code,
      orderValue,
      shippingFee,
    });
    return res.data;
  },

  // 📌 6. Áp dụng voucher freeship tự động (User)
  applyAutoFreeship: async (orderValue, shippingFee) => {
    const res = await privateApi.post("/api/vouchers/apply/freeship", {
      orderValue,
      shippingFee,
    });
    return res.data;
  },

  // 📌 1.x Lấy danh sách voucher cho user (không phân trang)
  getAvailable: async (params = {}) => {
    const res = await privateApi.get("/api/vouchers/get-all", { params });
    return res.data;
  },
};

export default voucherService;
