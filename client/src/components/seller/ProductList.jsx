import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import productService from "../../services/productService.js";
import categoryService from "../../services/categoryService.js"; // fetch categories
import ProductsTable from "./ProductsTable.jsx";
import ProductFormDialog from "./ProductForm.jsx";
import ProductDetailDialog from "./ProductDetailDialog.jsx";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [displayProducts, setDisplayProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [openForm, setOpenForm] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Filters
  const [status, setStatus] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchName, setSearchName] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Load categories
  const loadCategories = async () => {
    try {
      const res = await categoryService.getAll();
      if (res.success) {
        setCategories(res.data); // [{_id, name}]
      }
    } catch (error) {
      console.error("Lỗi tải category:", error);
    }
  };

  // Load products
  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const res = await productService.getAll();
      if (res.success) {
        // map category_id → categoryName
        const formatted = res.data.map((p) => ({
          ...p,
          primary_image: p.images?.find((img) => img.is_primary)?.image_url,
          categoryName:
            categories.find((c) => c._id === p.category_id)?.name ||
            "Chưa xác định",
        }));
        // Apply filters
        let filtered = formatted;
        if (status !== "all")
          filtered = filtered.filter((p) => p.status === status);
        if (categoryFilter !== "all")
          filtered = filtered.filter((p) => p.category_id === categoryFilter);
        if (searchName.trim() !== "")
          filtered = filtered.filter((p) =>
            p.name.toLowerCase().includes(searchName.toLowerCase())
          );

        setProducts(filtered);
        setTotalPages(Math.ceil(filtered.length / limit));
        setPage(1);
      } else {
        toast.error(res.message || "Không tải được sản phẩm");
      }
    } catch (error) {
      console.error("Lỗi tải sản phẩm:", error);
      toast.error("Có lỗi xảy ra khi tải sản phẩm");
    } finally {
      setIsLoading(false);
    }
  };
  console.log("Products to display:", displayProducts);
  // Pagination
  useEffect(() => {
    const start = (page - 1) * limit;
    const end = start + limit;
    setDisplayProducts(products.slice(start, end));
  }, [products, page, limit]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (categories.length > 0) loadProducts();
  }, [categories, status, categoryFilter, searchName]);

  // Handlers
  const handleAddProduct = () => {
    setSelectedProduct(null);
    setOpenForm(true);
  };
  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setOpenForm(true);
  };
  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setOpenDetail(true);
  };
  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;
    try {
      const res = await productService.remove(id);
      if (res.success) {
        toast.success("Xóa sản phẩm thành công");
        loadProducts();
      } else {
        toast.error(res.message || "Xóa sản phẩm thất bại");
      }
    } catch (error) {
      console.error(error);
      toast.error("Lỗi xóa sản phẩm");
    }
  };

  const handleFormSubmit = async (formData) => {
  try {
    let res;
    if (selectedProduct?._id) {
      // Edit product
      res = await productService.update(selectedProduct._id, formData);
    } else {
      // Create new product
      res = await productService.create(formData);
    }

    if (res.success) {
      toast.success(selectedProduct ? "Cập nhật sản phẩm thành công" : "Thêm sản phẩm thành công");
      setOpenForm(false);
      loadProducts(); // Reload danh sách
    } else {
      toast.error(res.message || "Có lỗi xảy ra");
    }
  } catch (err) {
    console.error(err);
    toast.error("Có lỗi xảy ra khi lưu sản phẩm");
  }
};

  return (
    <div className="p-6">
      <section className="container mx-auto px-4 pt-8">
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6 flex flex-wrap gap-4 items-center justify-between">
          {/* Status */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-green-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang bán</option>
            <option value="inactive">Ngừng bán</option>
          </select>

          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-green-500"
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Search */}
          <input
            type="text"
            placeholder="Tìm theo tên sản phẩm..."
            value={searchName}
            onChange={(e) => {
              setSearchName(e.target.value);
              setPage(1);
            }}
            className="border border-gray-300 rounded-xl px-3 py-2 w-56 focus:ring-2 focus:ring-green-500"
          />

          {/* Reset filter */}
          <button
            onClick={() => {
              setStatus("all");
              setCategoryFilter("all");
              setSearchName("");
              setPage(1);
            }}
            className="bg-gray-400 text-white px-4 py-2 rounded-xl hover:bg-gray-500 transition"
          >
            Xóa bộ lọc
          </button>

          {/* Add product */}
          <button
            onClick={handleAddProduct}
            className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition shadow-sm"
          >
            + Thêm sản phẩm
          </button>
        </div>
      </section>

      {/* Table */}
      <ProductsTable
        products={displayProducts}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
        onView={handleViewProduct}
        isLoading={isLoading}
      />

      {/* Pagination */}
      <div className="flex justify-center mt-4 space-x-2">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          &lt;
        </button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => setPage(i + 1)}
            className={`px-3 py-1 border rounded ${
              page === i + 1 ? "bg-blue-600 text-white" : ""
            }`}
          >
            {i + 1}
          </button>
        ))}
        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          &gt;
        </button>
      </div>

      {/* Form & Detail */}
      <ProductFormDialog
        open={openForm}
        onClose={() => setOpenForm(false)}
        onReload={loadProducts}
        initialData={selectedProduct}
        categories={categories || []}
        onSubmit={handleFormSubmit}
      />
      <ProductDetailDialog
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        product={selectedProduct}
      />
    </div>
  );
};

export default ProductList;
