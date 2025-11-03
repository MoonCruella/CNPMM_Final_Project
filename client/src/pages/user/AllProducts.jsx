import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { assets } from "@/assets/assets";
import productService from "../../services/productService.js";
import categoryService from "../../services/categoryService.js";
import ProductCard from "../../components/user/item/ProductCard.jsx";
import { useDebounce } from "../../hooks/useDebounce.jsx";
import ScrollToTopButton from "@/components/user/ScrollToTopButton.jsx";

const AllProducts = () => {
  const [products, setProducts] = useState([]);
  const [displayProducts, setDisplayProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState("default");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const productsPerPage = 9;

  const location = useLocation();
  const categoryIdFromState = location.state?.categoryId || null;

  const debouncedSearch = useDebounce(searchInput, 500);

  useEffect(() => {
    if (categoryIdFromState) {
      setActiveCategory(categoryIdFromState);
    }
  }, [categoryIdFromState]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoryRes = await categoryService.getAll();
        console.log("Categories response:", categoryRes);

        if (categoryRes.success) {
          // Check if data is array or nested object
          const categoriesData = Array.isArray(categoryRes.data)
            ? categoryRes.data
            : categoryRes.data?.categories || [];

          setCategories(categoriesData);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

  // Fetch products từ Backend với search, filter, sort
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        const params = {
          page: currentPage,
          limit: productsPerPage,
          status: "active",
        };

        if (activeCategory) {
          params.category = activeCategory;
        }

        if (debouncedSearch.trim() !== "") {
          params.search = debouncedSearch.trim();
        }

        if (sortOption === "lowToHigh") {
          params.sort = "price_asc";
        } else if (sortOption === "highToLow") {
          params.sort = "price_desc";
        }

        console.log("🔍 Fetching products with params:", params);

        const response = await productService.getAll(params);

        if (response.success) {
          const productList = response.data?.products || [];

          const formatted = productList.map((p) => ({
            ...p,
            primary_image:
              p.images?.find((img) => img.is_primary)?.image_url ||
              p.images?.[0]?.image_url,
          }));

          setProducts(formatted);
          setDisplayProducts(formatted);

          const pagination = response.data?.pagination || {};
          setTotalPages(pagination.total_pages || 1);
          setTotalProducts(pagination.total_items || 0);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [activeCategory, debouncedSearch, sortOption, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, debouncedSearch, sortOption]);

  const showingFrom =
    totalProducts > 0 ? (currentPage - 1) * productsPerPage + 1 : 0;
  const showingTo = Math.min(currentPage * productsPerPage, totalProducts);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  useEffect(() => {
    window.scrollTo({ top: 500, behavior: "smooth" });
  }, [currentPage]);

  if (loading && currentPage === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-auto mb-10">
      {/* Banner */}
      <div className="relative w-full h-[400px]">
        <img
          src={assets.banner_main_1}
          alt="banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center">
          <h1 className="text-5xl font-bold mb-4">Tất cả sản phẩm</h1>
          <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-6 py-2 rounded-full">
            <a href="/" className="hover:underline">
              Trang chủ
            </a>
            <span>|</span>
            <span>Tất cả sản phẩm</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-screen bg-white p-24">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-84 flex flex-col gap-6">
            {/* Search Box */}
            <div className="bg-yellow-50 p-4 rounded-xl">
              <div className="flex items-center border rounded-lg px-2 py-1 bg-white">
                <input
                  type="text"
                  placeholder="Keywords"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full bg-transparent focus:outline-none px-2"
                />
                {searchInput && (
                  <button
                    onClick={() => setSearchInput("")}
                    className="bg-yellow-400 p-2 rounded-lg cursor-pointer hover:bg-yellow-500 transition"
                  >
                    ❌
                  </button>
                )}
              </div>
              {searchInput !== debouncedSearch && (
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                  <span className="inline-block w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span>
                  Đang tìm kiếm...
                </p>
              )}
            </div>

            {/* Categories */}
            <div className="bg-yellow-50 p-4 rounded-xl">
              <h2 className="font-semibold mb-3">Các danh mục</h2>
              <ul className="space-y-2">
                <li
                  onClick={() => setActiveCategory(null)}
                  className={`flex justify-between items-center py-2 border-b cursor-pointer hover:text-green-600 transition ${
                    activeCategory === null ? "text-green-600 font-bold" : ""
                  }`}
                >
                  Tất cả loại sản phẩm <span>↻</span>
                </li>

                {/* Check if categories is array before mapping */}
                {Array.isArray(categories) && categories.length > 0 ? (
                  categories.map((cat) => (
                    <li
                      key={cat._id}
                      onClick={() => setActiveCategory(cat._id)}
                      className={`flex justify-between items-center py-2 border-b cursor-pointer hover:text-green-600 transition ${
                        activeCategory === cat._id
                          ? "text-green-600 font-bold"
                          : ""
                      }`}
                    >
                      {cat.name} <span>→</span>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500 text-sm py-2">
                    Đang tải danh mục...
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Product Section */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-4">
              <span className="bg-green-700 text-white px-4 py-2 rounded-lg ml-5">
                Hiển thị {showingFrom}-{showingTo} of {totalProducts} kết quả
              </span>
              <select
                className="border rounded-lg px-3 py-2 mr-5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="default">Mặc định</option>
                <option value="lowToHigh">Giá từ thấp lên cao</option>
                <option value="highToLow">Giá từ cao xuống thấp</option>
              </select>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : displayProducts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                </div>
                <p className="text-gray-600">No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {displayProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center mt-6 space-x-2">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => paginate(i + 1)}
                    className={`px-4 py-2 rounded-lg transition ${
                      currentPage === i + 1
                        ? "bg-green-700 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <ScrollToTopButton />
    </div>
  );
};

export default AllProducts;
