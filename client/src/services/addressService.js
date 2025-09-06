import privateApi from "./privateApi";

const addressService = {
  // 1. Lấy danh sách địa chỉ
  getAddresses: async () => {
    const res = await privateApi.get("/api/addresses");
    return res.data;
  },

  // 2. Thêm địa chỉ mới
  addAddress: async (address) => {
    const res = await privateApi.post("/api/addresses", address);
    return res.data;
  },

  // 3. Cập nhật địa chỉ
  updateAddress: async (addressId, newData) => {
    const res = await privateApi.put(`/api/addresses/${addressId}`, newData);
    return res.data;
  },

  // 4. Xóa địa chỉ
  removeAddress: async (addressId) => {
    const res = await privateApi.delete(`/api/addresses/${addressId}`);
    return res.data;
  },

  // 5. Đặt địa chỉ mặc định
  setDefaultAddress: async (addressId) => {
    const res = await privateApi.patch(`/api/addresses/${addressId}/default`);
    return res.data;
  },
};

export default addressService;
