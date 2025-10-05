import React, { useEffect, useState } from "react";
import VoucherCard from "../item/VoucherCard";
import voucherService from "../../../services/voucherService";

const VoucherModal = ({ isOpen, onClose, onApply, options = {}, subtotal }) => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFreeship, setSelectedFreeship] = useState(null);
  const [selectedDiscount, setSelectedDiscount] = useState(null);

  const normalizeKey = (val) => {
    if (val == null) return null;
    if (typeof val === "string" || typeof val === "number") return String(val);
    if (typeof val === "object") {
      if (val.code) return String(val.code);
      if (val._id) return String(val._id);
    }
    return null;
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const formatVND = (value) => {
    if (!value) return "0₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(value);
  };

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const payload = await voucherService.getAvailable({});
        const list =
          (payload && payload.vouchers) ||
          (payload && payload.data) ||
          payload ||
          [];
        const arr = Array.isArray(list)
          ? list
          : list.vouchers || list.data || [];
        if (mounted) setVouchers(Array.isArray(arr) ? arr : []);
      } catch (err) {
        if (mounted) setError("Không thể tải danh sách voucher");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [isOpen, options]);

  useEffect(() => {
    if (!isOpen) return;
    const init = options?.initialSelected ?? {};
    const sf =
      init.freeship ?? options?.selectedFreeship ?? options?.initialFreeship;
    const sd =
      init.discount ?? options?.selectedDiscount ?? options?.initialDiscount;

    setSelectedFreeship(normalizeKey(sf));
    setSelectedDiscount(normalizeKey(sd));
  }, [isOpen, options]);

  useEffect(() => {
    if (!isOpen || !Array.isArray(vouchers) || vouchers.length === 0) return;

    if (selectedFreeship) {
      const found = vouchers.find(
        (v) =>
          String(v.code) === String(selectedFreeship) ||
          String(v._id) === String(selectedFreeship)
      );
      if (found) setSelectedFreeship(String(found.code || found._id));
    }

    if (selectedDiscount) {
      const found = vouchers.find(
        (v) =>
          String(v.code) === String(selectedDiscount) ||
          String(v._id) === String(selectedDiscount)
      );
      if (found) setSelectedDiscount(String(found.code || found._id));
    }
  }, [isOpen, vouchers, selectedFreeship, selectedDiscount]);

  if (!isOpen) return null;

  // Sort helper
  const computeEffective = (v) => {
    const rawPercent = Number(v.discountValue ?? v.value ?? 0);
    const flat = Number(v.discountValue ?? v.value ?? 0);
    const cap = Number(v.maxDiscount ?? v.max_value ?? 0) || 0;
    const isPercent = v.isPercent === true;

    if (isPercent) {
      const fromPercent = (Number(subtotal) || 0) * (rawPercent / 100);
      return cap > 0 ? Math.min(fromPercent, cap) : fromPercent;
    }
    return flat;
  };

  const sortVouchers = (list) => {
    return [...list].sort((a, b) => {
      const aDisabled = subtotal < (a.minOrderValue || 0);
      const bDisabled = subtotal < (b.minOrderValue || 0);

      // Ưu tiên voucher khả dụng (disabled xuống dưới)
      if (aDisabled && !bDisabled) return 1;
      if (!aDisabled && bDisabled) return -1;

      // Nếu cùng trạng thái, sort theo giá trị giảm thực tế (tính % → VND khi cần)
      const aValue = computeEffective(a) || 0;
      const bValue = computeEffective(b) || 0;
      return bValue - aValue;
    });
  };

  const freeshipList = sortVouchers(
    vouchers.filter(
      (v) =>
        String(v.type).toLowerCase() === "freeship" ||
        String(v.type).toUpperCase() === "FREESHIP"
    )
  );

  const discountList = sortVouchers(
    vouchers.filter(
      (v) =>
        !(
          String(v.type).toLowerCase() === "freeship" ||
          String(v.type).toUpperCase() === "FREESHIP"
        )
    )
  );

  // compute best (deepest) voucher keys for each list
  const bestKeyForList = (list) => {
    let best = null;
    let bestVal = -Infinity;
    (list || []).forEach((v) => {
      const val = computeEffective(v) || 0;
      if (val > bestVal) {
        bestVal = val;
        best = v;
      }
    });
    return best ? String(best.code ?? best._id) : null;
  };

  const bestFreeshipKey = bestKeyForList(freeshipList);
  const bestDiscountKey = bestKeyForList(discountList);

  const handleApply = () => {
    const freeshipObj =
      selectedFreeship &&
      (vouchers.find((x) => x.code === selectedFreeship) ||
        vouchers.find((x) => String(x._id) === String(selectedFreeship)));
    const discountObj =
      selectedDiscount &&
      (vouchers.find((x) => x.code === selectedDiscount) ||
        vouchers.find((x) => String(x._id) === String(selectedDiscount)));

    if (onApply)
      onApply({ freeship: freeshipObj || null, discount: discountObj || null });
    if (onClose) onClose();
  };

  const toggleFreeship = (val) => {
    setSelectedFreeship((prev) => (prev === val ? null : val));
  };
  const toggleDiscount = (val) => {
    setSelectedDiscount((prev) => (prev === val ? null : val));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-1/2 mx-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Chọn voucher
          </h3>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 mr-2 text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        <div className="p-4 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-4">
          {error && <div className="text-sm text-red-500">{error}</div>}

          <section>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                Mã freeship
              </h4>
              <span className="text-xs text-gray-500">
                {freeshipList.length} có sẵn
              </span>
            </div>

            {freeshipList.length === 0 ? (
              <div className="text-sm text-gray-500">Không có mã freeship</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-4 px-4">
                {freeshipList.map((v) => {
                  const key = String(v.code || v._id);
                  const isDisabled = subtotal < (v.minOrderValue || 0);
                  return (
                    <button
                      key={key}
                      onClick={() => toggleFreeship(key)}
                      type="button"
                      disabled={isDisabled}
                      className={`text-left ${
                        isDisabled ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <div className="relative">
                        <VoucherCard
                          type="freeship"
                          labelLeft="Freeship"
                          discountValue={formatVND(v.discountValue)}
                          maxDiscount={
                            v.maxDiscount ? formatVND(v.maxDiscount) : "-"
                          }
                          minOrder={formatVND(v.minOrderValue)}
                          expireText={
                            v.endDate
                              ? new Date(v.endDate).toLocaleDateString()
                              : "N/A"
                          }
                          checked={selectedFreeship === key}
                          onCheck={() => toggleFreeship(key)}
                        />
                        {String(bestFreeshipKey) === key && (
                          <span className="absolute top-2 right-2 bg-orange-100 text-orange-800 text-xs font-semibold px-2 py-0.5 rounded-2xl">
                            Giảm nhiều nhất
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                Mã giảm giá
              </h4>
              <span className="text-xs text-gray-500">
                {discountList.length} có sẵn
              </span>
            </div>

            {discountList.length === 0 ? (
              <div className="text-sm text-gray-500">Không có mã giảm giá</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-4 px-4">
                {discountList.map((v) => {
                  const key = String(v.code || v._id);
                  const isDisabled = subtotal < (v.minOrderValue || 0);
                  return (
                    <button
                      key={key}
                      onClick={() => toggleDiscount(key)}
                      type="button"
                      disabled={isDisabled}
                      className={`text-left ${
                        isDisabled ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <div className="relative">
                        <VoucherCard
                          type={v.type || "discount"}
                          labelLeft={
                            v.type === "percent" ? `${v.value}%` : "Giảm giá"
                          }
                          isPercent={v.isPercent}
                          discountValue={
                            v.isPercent === true
                              ? `${v.discountValue}%`
                              : formatVND(v.discountValue)
                          }
                          maxDiscount={
                            v.maxDiscount ? formatVND(v.maxDiscount) : "-"
                          }
                          minOrder={formatVND(v.minOrderValue)}
                          expireText={
                            v.endDate
                              ? new Date(v.endDate).toLocaleDateString()
                              : "N/A"
                          }
                          checked={selectedDiscount === key}
                          onCheck={() => toggleDiscount(key)}
                        />
                        {String(bestDiscountKey) === key && (
                          <span className="absolute top-1 right-2 bg-orange-100 text-orange-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                            Giảm nhiều nhất
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium bg-gray-200 dark:bg-slate-600 rounded-2xl hover:bg-gray-300 dark:hover:bg-slate-500 transition"
          >
            Hủy
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2 text-sm rounded-2xl font-medium  bg-green-600 text-white hover:bg-green-700 transition"
          >
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoucherModal;
