// context/AddressContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import addressService from "@/services/addressService";
import { useSelector } from "react-redux";

const AddressContext = createContext();

export const AddressProvider = ({ children }) => {
  const { user, isAuthenticated } = useSelector(state => state.auth);

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

      let list = [];
      if (Array.isArray(res)) {
        list = res;
      } else if (res.success && Array.isArray(res.data)) {
        list = res.data;
      }

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
      if (res?.success && res.data) {
        setAddresses((prev) => {
          let updated = [...prev, res.data];

          // Nếu địa chỉ mới là mặc định -> reset các địa chỉ khác
          if (res.data.is_default) {
            updated = updated.map((a) => ({
              ...a,
              is_default: a._id === res.data._id,
            }));
          }

          return updated;
        });

        setSelectedAddress(res.data); // lưu object
        return res.data;
      } else {
        await loadAddresses(); // fallback
      }
    } catch (err) {
      console.error("Error adding address:", err);
    }
  };

  /* Cập nhật địa chỉ */
  const updateAddress = async (id, data) => {
    try {
      const res = await addressService.updateAddress(id, data);
      if (res?.success && res.data) {
        setAddresses((prev) => {
          let updated = prev.map((addr) => (addr._id === id ? res.data : addr));

          // Nếu địa chỉ vừa cập nhật là mặc định -> reset các địa chỉ khác
          if (res.data.is_default) {
            updated = updated.map((a) => ({
              ...a,
              is_default: a._id === res.data._id,
            }));
          }

          return updated;
        });

        setSelectedAddress(res.data); // lưu object
        return res.data;
      } else {
        await loadAddresses();
      }
    } catch (err) {
      console.error("Error updating address:", err);
    }
  };

  /* Xóa địa chỉ */
  const removeAddress = async (id) => {
    try {
      const res = await addressService.removeAddress(id);
      if (res?.success) {
        setAddresses((prev) => prev.filter((addr) => addr._id !== id));

        // Nếu xóa địa chỉ đang chọn => set lại
        if (selectedAddress?._id === id) {
          const remaining = addresses.filter((a) => a._id !== id);
          setSelectedAddress(
            remaining.length > 0
              ? remaining.find((a) => a.is_default) || remaining[0]
              : null
          );
        }
      }
    } catch (err) {
      console.error("Error removing address:", err);
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
