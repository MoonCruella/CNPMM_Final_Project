import React, { useState, useEffect, useRef } from "react";

const ProductForm = ({ open, onClose, initialData, onSubmit, categories }) => {
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    short_description: "",
    price: "",
    sale_price: "",
    stock_quantity: "",
    status: "active",
    featured: false,
    hometown_origin: {
      district: "",
      terrain: "",
    },
    category_id: "",
    images: [],
  });

  const [previews, setPreviews] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || "",
        price: initialData.price || 0,
        category_id: initialData.category_id?._id || "",
        hometown_origin: {
          district: initialData.hometown_origin?.district || "",
          terrain: initialData.hometown_origin?.terrain || "",
        },
        description: initialData.description || "",
        stock: initialData.stock || 0,
        is_active: initialData.is_active ?? true,
      });
    } else {
      // 🧹 Reset form khi ở chế độ thêm mới
      setForm({
        name: "",
        price: 0,
        category_id: "",
        hometown_origin: { district: "", terrain: "" },
        description: "",
        stock: 0,
        is_active: true,
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // xử lý riêng cho hometown_origin.*
    if (name.startsWith("hometown_origin.")) {
      const field = name.split(".")[1];
      setForm((prev) => ({
        ...prev,
        hometown_origin: {
          ...prev.hometown_origin,
          [field]: value,
        },
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]:
          type === "checkbox"
            ? checked
            : type === "number"
            ? Number(value)
            : value,
      }));
    }
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
      sale_price: form.sale_price === "" ? null : Number(form.sale_price),
    };
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
          {/* --- Thông tin cơ bản --- */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Tên sản phẩm
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-3 py-2 focus:ring focus:ring-gray-200"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Slug</label>
              <input
                type="text"
                name="slug"
                value={form.slug}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Giá</label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
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
                className="w-full border rounded-lg px-3 py-2"
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
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Trạng thái
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="active">Đang bán</option>
                <option value="inactive">Ngừng bán</option>
              </select>
            </div>
          </div>

          {/* --- Mô tả --- */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Mô tả ngắn
            </label>
            <textarea
              name="short_description"
              value={form.short_description}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 h-20"
            />

            <label className="block text-sm text-gray-600 mb-1 mt-4">
              Mô tả chi tiết
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 h-28"
            />
          </div>

          {/* --- Danh mục, nổi bật, xuất xứ --- */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Danh mục
              </label>
              <select
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Khu vực
              </label>
              <select
                name="hometown_origin.district"
                value={form.hometown_origin.district}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 mb-3"
              >
                <option value="">-- Chọn huyện/thị xã --</option>
                <option value="phu_yen_city">TP. Tuy Hòa</option>
                <option value="dong_hoa">TX. Đông Hòa</option>
                <option value="tuy_an">Tuy An</option>
                <option value="son_hoa">Sơn Hòa</option>
                <option value="song_hinh">Sông Hinh</option>
                <option value="tay_hoa">Tây Hòa</option>
                <option value="phu_hoa">Phú Hòa</option>
                <option value="dong_xuan">Đồng Xuân</option>
                <option value="song_cau">Sông Cầu</option>
              </select>

              <label className="block text-sm text-gray-600 mb-1">
                Địa hình
              </label>
              <select
                name="hometown_origin.terrain"
                value={form.hometown_origin.terrain}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">-- Chọn địa hình --</option>
                <option value="bien">Biển</option>
                <option value="ven_bien">Vén biển</option>
                <option value="dong_bang">Đồng bằng</option>
                <option value="nui">Núi</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="featured"
              checked={form.featured}
              onChange={handleChange}
              id="featured"
            />
            <label htmlFor="featured" className="text-sm text-gray-700">
              Sản phẩm nổi bật
            </label>
          </div>

          {/* --- Upload ảnh --- */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              Ảnh sản phẩm
            </label>
            <div className="flex flex-wrap gap-3">
              {previews.map((src, i) => (
                <div key={i} className="relative">
                  <img
                    src={src}
                    className="w-24 h-24 object-cover rounded-lg border"
                    alt=""
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}

              <label className="cursor-pointer border border-dashed border-gray-300 hover:border-gray-400 rounded-lg w-24 h-24 flex items-center justify-center text-gray-500 text-sm">
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
          </div>

          {/* --- Buttons --- */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-gray-800 hover:bg-gray-900 text-white font-medium"
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
