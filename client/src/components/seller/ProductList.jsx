import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import productService from "../../services/productService.js";
import categoryService from "../../services/categoryService.js";
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

  const loadCategories = async () => {
    try {
      const res = await categoryService.getAll();
      if (res.success) setCategories(res.data);
    } catch (error) {
      console.error("Lỗi tải category:", error);
    }
  };

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const res = await productService.getAll();
      if (res.success) {
        const formatted = res.data.map((p) => ({
          ...p,
          primary_image: p.images?.find((img) => img.is_primary)?.image_url,
          categoryName:
            categories.find((c) => c._id === p.category_id)?.name ||
            "Chưa xác định",
        }));

        let filtered = formatted;
        if (status !== "all") filtered = filtered.filter((p) => p.status === status);
        if (categoryFilter !== "all")
          filtered = filtered.filter((p) => p.category_id === categoryFilter);
        if (searchName.trim() !== "")
          filtered = filtered.filter((p) =>
            p.name.toLowerCase().includes(searchName.toLowerCase())
          );

        setProducts(filtered);
        setTotalPages(Math.ceil(filtered.length / limit));
        setPage(1);
      } else toast.error(res.message || "Không tải được sản phẩm");
    } catch (error) {
      console.error("Lỗi tải sản phẩm:", error);
      toast.error("Có lỗi xảy ra khi tải sản phẩm");
    } finally {
      setIsLoading(false);
    }
  };

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
      } else toast.error(res.message || "Xóa sản phẩm thất bại");
    } catch (error) {
      console.error(error);
      toast.error("Lỗi xóa sản phẩm");
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      let res;
      if (selectedProduct?._id) {
        res = await productService.update(selectedProduct._id, formData);
      } else {
        res = await productService.create(formData);
      }

      if (res.success) {
        toast.success(selectedProduct ? "Cập nhật sản phẩm thành công" : "Thêm sản phẩm thành công");
        setOpenForm(false);
        loadProducts();
      } else toast.error(res.message || "Có lỗi xảy ra");
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi lưu sản phẩm");
    }
  };

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* Bộ lọc */}
      <section className="container mx-auto px-4 pt-8">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
          {/* Trạng thái */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="border rounded-lg px-3 py-2"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang bán</option>
            <option value="inactive">Ngừng bán</option>
          </select>

          {/* Danh mục */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="border rounded-lg px-3 py-2"
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Tìm kiếm */}
          <input
            type="text"
            placeholder="Tìm theo tên sản phẩm..."
            value={searchName}
            onChange={(e) => {
              setSearchName(e.target.value);
              setPage(1);
            }}
            className="border rounded-lg px-3 py-2 w-56"
          />

          {/* Nút reset */}
          <button
            onClick={() => {
              setStatus("all");
              setCategoryFilter("all");
              setSearchName("");
              setPage(1);
            }}
            className="flex items-center gap-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition"
          >
            Xóa bộ lọc
          </button>

          {/* Nút thêm */}
          <button
            onClick={handleAddProduct}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition"
          >
            + Thêm sản phẩm
          </button>
        </div>
      </section>

      {/* Bảng sản phẩm */}
      <section className="pb-16 container mx-auto px-4">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-gray-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700">Đang tải sản phẩm...</p>
          </div>
        ) : (
          <>
            <ProductsTable
              products={displayProducts}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
              onView={handleViewProduct}
              isLoading={isLoading}
            />

            {/* Phân trang */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-4 gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className={`px-3 py-1 rounded ${
                    page === 1
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gray-800 text-white"
                  }`}
                >
                  {"<"}
                </button>

                {[...Array(totalPages)].map((_, idx) => (
                  <button
                    key={idx + 1}
                    onClick={() => setPage(idx + 1)}
                    className={`px-3 py-1 rounded ${
                      page === idx + 1
                        ? "bg-gray-800 text-white"
                        : "bg-gray-200"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}

                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className={`px-3 py-1 rounded ${
                    page === totalPages
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gray-800 text-white"
                  }`}
                >
                  {">"}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Form & Chi tiết */}
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
    </main>
  );
};

export default ProductList;
