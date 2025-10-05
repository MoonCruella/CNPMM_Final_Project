import React, { useState, useEffect, useRef } from "react";

const ProductForm = ({ open, onClose, initialData, onSubmit, categories }) => {
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    short_description: "",
    price: "",
    sale_price: "", // 🆕 thêm trường này
    stock_quantity: "",
    status: "active",
    featured: false,
    hometown_origin: "",
    category_id: "",
    images: [],
  });

  const [previews, setPreviews] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || "",
        slug: initialData.slug || "",
        description: initialData.description || "",
        short_description: initialData.short_description || "",
        price: initialData.price || "",
        sale_price: initialData.sale_price || "", // 🆕
        stock_quantity: initialData.stock_quantity || "",
        status: initialData.status || "active",
        featured: initialData.featured || false,
        hometown_origin: initialData.hometown_origin || "",
        category_id: initialData.category_id || "",
        images: initialData.images || [],
      });

      if (initialData.images && initialData.images.length > 0) {
        setPreviews(initialData.images.map((img) => img.url || img.image_url || img));
      } else {
        setPreviews([]);
      }
    } else {
      setForm({
        name: "",
        slug: "",
        description: "",
        short_description: "",
        price: "",
        sale_price: "", // 🆕
        stock_quantity: "",
        status: "active",
        featured: false,
        hometown_origin: "",
        category_id: "",
        images: [],
      });
      setPreviews([]);
    }
  }, [initialData]);

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

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("images", file));

      const res = await fetch("http://localhost:3000/api/upload/multiple", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        const uploaded = data.data.successful.map((img, index) => ({
          image_url: img.url,
          is_primary: form.images.length === 0 && index === 0,
        }));

        setForm((prev) => ({
          ...prev,
          images: [...prev.images, ...uploaded],
        }));

        setPreviews((prev) => [
          ...prev,
          ...uploaded.map((img) => img.image_url),
        ]);
      } else {
        alert("Upload ảnh thất bại!");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Có lỗi khi upload ảnh");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (index) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      sale_price:
        form.sale_price === "" ? null : Number(form.sale_price), // 🧠 xử lý null khi trống
      images: form.images,
    };

    onSubmit(payload);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">
          {initialData ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Tên sản phẩm"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full border rounded-xl px-3 py-2"
          />

          <input
            type="text"
            name="slug"
            placeholder="Slug"
            value={form.slug}
            onChange={handleChange}
            className="w-full border rounded-xl px-3 py-2"
          />

          <textarea
            name="description"
            placeholder="Mô tả chi tiết"
            value={form.description}
            onChange={handleChange}
            className="w-full border rounded-xl px-3 py-2"
          />

          <textarea
            name="short_description"
            placeholder="Mô tả ngắn"
            value={form.short_description}
            onChange={handleChange}
            className="w-full border rounded-xl px-3 py-2"
          />

          <input
            type="number"
            name="price"
            placeholder="Giá (VNĐ)"
            value={form.price}
            onChange={handleChange}
            className="w-full border rounded-xl px-3 py-2"
          />

          {/* 🆕 Thêm trường Giá khuyến mãi */}
          <input
            type="number"
            name="sale_price"
            placeholder="Giá khuyến mãi (VNĐ)"
            value={form.sale_price}
            onChange={handleChange}
            className="w-full border rounded-xl px-3 py-2"
          />

          <input
            type="number"
            name="stock_quantity"
            placeholder="Số lượng tồn kho"
            value={form.stock_quantity}
            onChange={handleChange}
            className="w-full border rounded-xl px-3 py-2"
          />

          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full border rounded-xl px-3 py-2"
          >
            <option value="active">Đang bán</option>
            <option value="inactive">Ngừng bán</option>
          </select>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="featured"
              checked={form.featured}
              onChange={handleChange}
              id="featured"
            />
            <label htmlFor="featured">Nổi bật</label>
          </div>

          <input
            type="text"
            name="hometown_origin"
            placeholder="Xuất xứ"
            value={form.hometown_origin}
            onChange={handleChange}
            className="w-full border rounded-xl px-3 py-2"
          />

          <select
            name="category_id"
            value={form.category_id}
            onChange={handleChange}
            className="w-full border rounded-xl px-3 py-2"
          >
            <option value="">Chọn danh mục</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Upload ảnh */}
          <div className="flex flex-col gap-2">
            <label className="cursor-pointer bg-gray-200 px-2 py-1 rounded text-sm hover:bg-gray-300 inline-block w-max">
              {form.images.length > 0
                ? `${form.images.length} tệp đã chọn`
                : "Chọn tệp ảnh"}
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                ref={fileInputRef}
              />
            </label>

            <div className="flex flex-wrap gap-2 mt-2">
              {previews.map((src, i) => (
                <div key={i} className="relative">
                  <img
                    src={src}
                    alt={`preview-${i}`}
                    className="w-24 h-24 object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-300 hover:bg-gray-400"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700"
            >
              {initialData ? "Cập nhật" : "Thêm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
