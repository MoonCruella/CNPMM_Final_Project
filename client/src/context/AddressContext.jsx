// context/AddressContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import addressService from "@/services/addressService";
import { toast } from "sonner";
import { useSelector } from "react-redux";

const AddressContext = createContext();

export const AddressProvider = ({ children }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null); // lưu object
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [loading, setLoading] = useState(false);

  /* Load danh sách địa chỉ từ API */
  const loadAddresses = async () => {
    if (!user) {
      setAddresses([]);
      setSelectedAddress(null);
      return;
    }
    try {
      setLoading(true);
      const res = await addressService.getAddresses();

      // normalize possible shapes
      const normalized = Array.isArray(res)
        ? res
        : res?.data ?? res?.addresses ?? [];

      const list = Array.isArray(normalized) ? normalized : [];
      setAddresses(list);

      // Nếu chưa chọn địa chỉ => chọn mặc định hoặc địa chỉ đầu tiên
      if (list.length > 0) {
        const defaultAddr = list.find((a) => a.is_default);
        setSelectedAddress(defaultAddr || list[0]); // lưu object
      } else {
        setSelectedAddress(null);
      }
    } catch (err) {
      console.error("Error loading addresses:", err);
      setAddresses([]);
      setSelectedAddress(null);
    } finally {
      setLoading(false);
    }
  };

  const addAddress = async (data) => {
    try {
      const res = await addressService.addAddress(data);
      console.log("Add address response:", res);

      if (res?.success) {
        // nếu API trả về danh sách addresses
        if (Array.isArray(res.addresses) && res.addresses.length > 0) {
          setAddresses(res.addresses);
          const newAddr = res.addresses[res.addresses.length - 1];
          setSelectedAddress(newAddr);
          toast.success("Thêm địa chỉ thành công");
          return newAddr;
        }

        // nếu trả về object address trong res.data
        if (res.data) {
          setAddresses((prev) => {
            let updated = [...prev, res.data];
            if (res.data.is_default) {
              updated = updated.map((a) => ({
                ...a,
                is_default: a._id === res.data._id,
              }));
            }
            return updated;
          });
          setSelectedAddress(res.data);
          toast.success("Thêm địa chỉ thành công");
          return res.data;
        }

        // fallback: refresh list
        await loadAddresses();
        toast.success("Thêm địa chỉ thành công");
        return null;
      } else {
        toast.error(res?.message || "Thêm địa chỉ thất bại");
        await loadAddresses();
      }
    } catch (err) {
      console.error("Error adding address:", err);
      toast.error("Thêm địa chỉ thất bại");
    }
  };

  /* Cập nhật địa chỉ */
  const updateAddress = async (id, data) => {
    try {
      const res = await addressService.updateAddress(id, data);
      if (res?.success) {
        if (res.data) {
          setAddresses((prev) => {
            let updated = prev.map((addr) =>
              addr._id === id ? res.data : addr
            );
            if (res.data.is_default) {
              updated = updated.map((a) => ({
                ...a,
                is_default: a._id === res.data._id,
              }));
            }
            return updated;
          });
          setSelectedAddress(res.data);
          toast.success("Cập nhật địa chỉ thành công");
          return res.data;
        }

        if (Array.isArray(res.addresses)) {
          setAddresses(res.addresses);
          const updatedItem = res.addresses.find((a) => a._id === id);
          if (updatedItem) setSelectedAddress(updatedItem);
          toast.success("Cập nhật địa chỉ thành công");
          return updatedItem || null;
        }

        await loadAddresses();
        toast.success("Cập nhật địa chỉ thành công");
        return null;
      } else {
        toast.error(res?.message || "Cập nhật địa chỉ thất bại");
        await loadAddresses();
      }
    } catch (err) {
      console.error("Error updating address:", err);
      toast.error("Cập nhật địa chỉ thất bại");
    }
  };

  /* Xóa địa chỉ */
  const removeAddress = async (id) => {
    // xác nhận xóa
    if (!window.confirm("Bạn có chắc muốn xóa địa chỉ này?")) return false;
    try {
      const res = await addressService.removeAddress(id);
      if (res?.success) {
        if (Array.isArray(res.addresses)) {
          setAddresses(res.addresses);
        } else {
          setAddresses((prev) => prev.filter((addr) => addr._id !== id));
        }

        if (selectedAddress?._id === id) {
          const remaining = (
            Array.isArray(res.addresses) ? res.addresses : addresses
          ).filter((a) => a._id !== id);
          setSelectedAddress(
            remaining.length > 0
              ? remaining.find((a) => a.is_default) || remaining[0]
              : null
          );
        }
        toast.success("Xóa địa chỉ thành công");
        return true;
      } else {
        toast.error(res?.message || "Xóa địa chỉ thất bại");
        return false;
      }
    } catch (err) {
      console.error("Error removing address:", err);
      toast.error("Xóa địa chỉ thất bại");
      return false;
    }
  };

  useEffect(() => {
    loadAddresses();
  }, [user]);

  return (
    <AddressContext.Provider
      value={{
        addresses,
        selectedAddress,
        setSelectedAddress,
        paymentMethod,
        setPaymentMethod,
        loading,
        loadAddresses,
        addAddress,
        updateAddress,
        removeAddress,
      }}
    >
      {children}
    </AddressContext.Provider>
  );
};

export const useAddressContext = () => useContext(AddressContext);
