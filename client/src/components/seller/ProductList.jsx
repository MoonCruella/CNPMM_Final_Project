import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import productService from "../../services/productService.js";
import categoryService from "../../services/categoryService.js";
import ProductsTable from "./ProductsTable.jsx";
import ProductFormDialog from "./ProductForm.jsx";
import ProductDetailDialog from "./ProductDetailDialog.jsx";
import { assets } from "@/assets/assets";
import { Link } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce"; 

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [openForm, setOpenForm] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [status, setStatus] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchName, setSearchName] = useState("");
  
  const debouncedSearchName = useDebounce(searchName, 500);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const loadCategories = async () => {
    try {
      const res = await categoryService.getAll();
      console.log("Categories response:", res);
      
      if (res.success) {
        // Check if data is array or nested object
        const categoriesData = Array.isArray(res.data) 
          ? res.data 
          : res.data?.categories || [];
        
        setCategories(categoriesData);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error("Lỗi tải category:", error);
      setCategories([]);
    }
  };

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      
      const params = {
        page,
        limit,
        status: status !== "all" ? status : undefined,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        search: debouncedSearchName.trim() !== "" ? debouncedSearchName : undefined,
      };

      Object.keys(params).forEach(key => {
        if (params[key] === undefined) delete params[key];
      });

      const res = await productService.getAll(params);
      
      if (res.success) {
        const { products: fetchedProducts, pagination } = res.data;
        
        const formatted = fetchedProducts.map((p) => ({
          ...p,
          primary_image: p.images?.find((img) => img.is_primary)?.image_url || p.images?.[0]?.image_url,
          categoryName: Array.isArray(categories) 
            ? categories.find((c) => c._id === p.category_id)?.name || "Chưa xác định"
            : "Chưa xác định",
        }));

        setProducts(formatted);
        setTotalPages(pagination?.total_pages || 1);
        setTotalProducts(pagination?.total_items || 0);
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

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      loadProducts();
    }
  }, [categories, page, status, categoryFilter, debouncedSearchName]); 

  useEffect(() => {
    setPage(1);
  }, [status, categoryFilter, debouncedSearchName]);

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
        res = await productService.update(selectedProduct._id, formData);
      } else {
        res = await productService.create(formData);
      }

      if (res.success) {
        toast.success(
          selectedProduct ? "Cập nhật sản phẩm thành công" : "Thêm sản phẩm thành công"
        );
        setOpenForm(false);
        loadProducts();
      } else {
        toast.error(res.message || "Có lỗi xảy ra");
      }
    } catch (err) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi lưu sản phẩm");
    }
  };

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* Header Banner */}
      <section
        className="bg-cover bg-center py-20 text-center text-white relative"
        style={{ backgroundImage: `url(${assets.page_banner})` }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10">
          <h1 className="text-5xl font-bold drop-shadow-lg">Quản lý sản phẩm</h1>
          <ul className="flex justify-center gap-2 mt-2 text-sm">
            <li>
              <Link to="/seller" className="hover:underline font-medium">
                Dashboard
              </Link>
            </li>
            <li className="font-medium">/ Quản lý sản phẩm</li>
          </ul>
          {!isLoading && totalProducts > 0 && (
            <p className="text-gray-200 text-sm mt-2">
              Hiển thị {((page - 1) * limit + 1)} - {Math.min(page * limit, totalProducts)} trong tổng số {totalProducts} sản phẩm
            </p>
          )}
        </div>
      </section>

      {/* Filters Section */}
      <section className="container mx-auto px-4 pt-8">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang bán</option>
            <option value="inactive">Ngừng bán</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            <option value="all">Tất cả danh mục</option>
            {Array.isArray(categories) && categories.length > 0 ? (
              categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))
            ) : (
              <option disabled>Đang tải...</option>
            )}
          </select>

          <div className="relative">
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
            {searchName && (
              <button
                onClick={() => setSearchName("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
            {searchName !== debouncedSearchName && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              </span>
            )}
          </div>

          <div className="flex-1"></div>

          <button
            onClick={() => {
              setStatus("all");
              setCategoryFilter("all");
              setSearchName("");
            }}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition font-medium flex items-center gap-2"
          >
            🔄 Xóa bộ lọc
          </button>

          <button
            onClick={handleAddProduct}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition font-medium flex items-center gap-2"
          >
            ➕ Thêm sản phẩm
          </button>
        </div>
      </section>

      {/* Products Table */}
      <section className="pb-16 container mx-auto px-4">
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="w-8 h-8 border-4 border-gray-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700">Đang tải sản phẩm...</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <ProductsTable
                products={products}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
                onView={handleViewProduct}
                isLoading={false}
              />

              {products.length === 0 && !isLoading && (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">📦</span>
                  </div>
                  <h3 className="text-xl font-medium text-gray-700 mb-2">
                    Không có sản phẩm nào
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {searchName || status !== "all" || categoryFilter !== "all"
                      ? "Không tìm thấy sản phẩm phù hợp với bộ lọc"
                      : "Chưa có sản phẩm nào. Hãy thêm sản phẩm đầu tiên!"}
                  </p>
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className={`px-3 py-1 rounded transition ${
                      page === 1
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-gray-800 text-white hover:bg-gray-900"
                    }`}
                  >
                    {"<"}
                  </button>

                  {[...Array(totalPages)].map((_, idx) => (
                    <button
                      key={idx + 1}
                      onClick={() => setPage(idx + 1)}
                      className={`px-3 py-1 rounded transition ${
                        page === idx + 1
                          ? "bg-gray-800 text-white"
                          : "bg-gray-200 hover:bg-gray-300"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}

                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className={`px-3 py-1 rounded transition ${
                      page === totalPages
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-gray-800 text-white hover:bg-gray-900"
                    }`}
                  >
                    {">"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

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