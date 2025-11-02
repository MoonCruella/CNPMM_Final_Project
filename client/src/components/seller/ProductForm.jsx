import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

const ProductForm = ({ open, onClose, initialData, onSubmit, categories }) => {
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    sale_price: "",
    stock_quantity: "",
    status: "active",
    category_id: "",
    images: [],
    tags: [], // ✅ Add tags
  });

  const [previews, setPreviews] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || "",
        description: initialData.description || "",
        price: initialData.price || "",
        sale_price: initialData.sale_price || "",
        stock_quantity: initialData.stock_quantity || "",
        status: initialData.status || "active",
        category_id: initialData.category_id?._id || initialData.category_id || "",
        images: Array.isArray(initialData.images) ? initialData.images : [],
        tags: Array.isArray(initialData.tags) ? initialData.tags : [],
      });

      if (Array.isArray(initialData.images) && initialData.images.length > 0) {
        setPreviews(initialData.images.map(img => img.image_url || img));
      }
    } else {
      setForm({
        name: "",
        description: "",
        price: "",
        sale_price: "",
        stock_quantity: "",
        status: "active",
        category_id: "",
        images: [],
        tags: [],
      });
      setPreviews([]);
    }
  }, [initialData, open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? Number(value)
            : value,
    }));
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const toastId = toast.loading(`Đang upload ${files.length} ảnh...`);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("images", file));

      const res = await fetch("http://localhost:3000/api/upload/multiple", {
        method: "POST",
        body: formData,
      });

      const response = await res.json();

      if (response.success && response.data) {
        const { successful = [], failed = [], totalUploaded = 0, totalFailed = 0 } = response.data;

        if (Array.isArray(successful) && successful.length > 0) {
          const newImages = successful.map((img, index) => ({
            image_url: img.url,
            is_primary: (form.images?.length || 0) === 0 && index === 0,
          }));

          setForm((prev) => ({
            ...prev,
            images: [...(prev.images || []), ...newImages],
          }));

          setPreviews((prev) => [
            ...(prev || []),
            ...newImages.map((img) => img.image_url),
          ]);

          toast.success(
            `Upload thành công ${totalUploaded} ảnh${totalFailed > 0 ? `, ${totalFailed} ảnh thất bại` : ""}`,
            { id: toastId }
          );
        } else {
          toast.error("Không có ảnh nào được upload thành công!", { id: toastId });
        }

        if (Array.isArray(failed) && failed.length > 0) {
          console.warn("⚠️ Failed uploads:", failed);
        }
      } else {
        toast.error(response.message || "Upload ảnh thất bại!", { id: toastId });
      }
    } catch (err) {
      console.error("❌ Upload error:", err);
      toast.error("Có lỗi khi upload ảnh: " + err.message, { id: toastId });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = (index) => {
    setPreviews((prev) => (prev || []).filter((_, i) => i !== index));
    setForm((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate required fields
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên sản phẩm");
      return;
    }

    if (!form.category_id) {
      toast.error("Vui lòng chọn danh mục");
      return;
    }

    if (!form.price || Number(form.price) <= 0) {
      toast.error("Vui lòng nhập giá sản phẩm hợp lệ");
      return;
    }

    // ✅ Chỉ gửi những field BE cần
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      sale_price: form.sale_price ? Number(form.sale_price) : 0,
      category_id: form.category_id,
      tags: form.tags || [],
      stock_quantity: Number(form.stock_quantity) || 0,
      images: form.images || [],
    };

    console.log("📤 Sending payload to BE:", payload);
    onSubmit(payload);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex justify-between items-center">
          {initialData ? "✏️ Chỉnh sửa sản phẩm" : "➕ Thêm sản phẩm mới"}
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-2xl font-bold"
          >
            ×
          </button>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Thông tin cơ bản */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-gray-600 mb-1">
                Tên sản phẩm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-3 py-2 focus:ring focus:ring-gray-200"
                placeholder="VD: Bánh Hồng (2.5kg/ 5gói)"
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Slug sẽ được tự động tạo từ tên sản phẩm ở phía Backend
              </p>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Giá <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                required
                min="0"
                step="1000"
                className="w-full border rounded-lg px-3 py-2"
                placeholder="175000"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Giá khuyến mãi
              </label>
              <input
                type="number"
                name="sale_price"
                value={form.sale_price}
                onChange={handleChange}
                min="0"
                step="1000"
                className="w-full border rounded-lg px-3 py-2"
                placeholder="150000 (Để trống = 0)"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Số lượng tồn
              </label>
              <input
                type="number"
                name="stock_quantity"
                value={form.stock_quantity}
                onChange={handleChange}
                min="0"
                className="w-full border rounded-lg px-3 py-2"
                placeholder="100"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Danh mục <span className="text-red-500">*</span>
              </label>
              <select
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">-- Chọn danh mục --</option>
                {Array.isArray(categories) && categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Mô tả chi tiết
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 h-32"
              placeholder="Nhập mô tả chi tiết về sản phẩm, cách sử dụng, bảo quản..."
            />
          </div>

          {/* Upload ảnh */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Ảnh sản phẩm
            </label>
            <div className="flex flex-wrap gap-3">
              {Array.isArray(previews) && previews.map((src, i) => (
                <div key={i} className="relative">
                  <img
                    src={src}
                    className="w-24 h-24 object-cover rounded-lg border"
                    alt={`Preview ${i + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-700"
                  >
                    ×
                  </button>
                  {form.images?.[i]?.is_primary && (
                    <div className="absolute bottom-0 left-0 right-0 bg-green-600 text-white text-xs text-center py-0.5 rounded-b-lg">
                      Ảnh chính
                    </div>
                  )}
                </div>
              ))}

              <label className="cursor-pointer border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg w-24 h-24 flex items-center justify-center text-gray-500 text-3xl transition">
                +
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Ảnh đầu tiên sẽ là ảnh chính. Click dấu + để thêm nhiều ảnh.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-gray-800 hover:bg-gray-900 text-white font-medium transition"
            >
              {initialData ? "💾 Cập nhật" : "➕ Thêm mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;