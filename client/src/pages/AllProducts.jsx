import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { assets } from "@/assets/assets";
import productService from "../services/productService.js";
import categoryService from "../services/categoryService.js";
import ProductCard from "../components/ProductCard.jsx";

const AllProducts = () => {
  const [products, setProducts] = useState([]);
  const [displayProducts, setDisplayProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState("default");

  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 9;

  const location = useLocation();
  const categoryIdFromState = location.state?.categoryId || null;

  useEffect(() => {
    if (categoryIdFromState) {
      setActiveCategory(categoryIdFromState);
    }
  }, [categoryIdFromState]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const productRes = await productService.getAll();
        if (productRes.success) {
          const formatted = productRes.data.map((p) => ({
            ...p,
            primary_image: p.images.find((img) => img.is_primary)?.image_url,
          }));
          setProducts(formatted);
          setDisplayProducts(formatted);
        }

        const categoryRes = await categoryService.getAll();
        if (categoryRes.success) {
          setCategories(categoryRes.data);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter logic (category + search)
  useEffect(() => {
    let filtered = [...products];

    if (activeCategory) {
      filtered = filtered.filter((p) => p.category_id === activeCategory);
    }

    if (searchInput.trim() !== "") {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchInput.toLowerCase())
      );
    }

    if (sortOption === "lowToHigh") {
      filtered.sort(
        (a, b) => (a.sale_price || a.price) - (b.sale_price || b.price)
      );
    } else if (sortOption === "highToLow") {
      filtered.sort(
        (a, b) => (b.sale_price || b.price) - (a.sale_price || a.price)
      );
    }

    setDisplayProducts(filtered);
    setCurrentPage(1);
  }, [products, activeCategory, searchInput, sortOption]);

  // Pagination
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = displayProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const showingFrom = indexOfFirstProduct + 1;
  const showingTo = Math.min(indexOfLastProduct, displayProducts.length);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  useEffect(() => {
    window.scrollTo({ top: 500, behavior: "smooth" });
  }, [currentPage, displayProducts, activeCategory]);

  if (loading) return <p className="text-center">Đang tải sản phẩm...</p>;

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
              Home
            </a>
            <span>|</span>
            <span>All Products</span>
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
              <div className="flex items-center border rounded-lg px-2 py-1">
                <input
                  type="text"
                  placeholder="Keywords"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full bg-transparent focus:outline-none px-2"
                />
                <button
                  onClick={() => setSearchInput("")}
                  className="bg-yellow-400 p-2 rounded-lg cursor-pointer"
                >
                  ❌
                </button>
              </div>
            </div>


            {/* Categories */}
            <div className="bg-yellow-50 p-4 rounded-xl">
              <h2 className="font-semibold mb-3">All Category</h2>
              <ul className="space-y-2">
                {/* Nút All Products */}
                <li
                  onClick={() => setActiveCategory(null)}
                  className={`flex justify-between items-center py-2 border-b cursor-pointer hover:text-green-600 ${
                    activeCategory === null ? "text-green-600 font-bold" : ""
                  }`}
                >
                  All Products <span>↻</span>
                </li>

                {/* Danh sách categories */}
                {categories.map((cat) => (
                  <li
                    key={cat._id}
                    onClick={() => setActiveCategory(cat._id)}
                    className={`flex justify-between items-center py-2 border-b cursor-pointer hover:text-green-600 ${
                      activeCategory === cat._id
                        ? "text-green-600 font-bold"
                        : ""
                    }`}
                  >
                    {cat.name} <span>→</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Product Section */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-4">
              <span className="bg-green-700 text-white px-4 py-2 rounded-lg ml-5">
                Showing {showingFrom}-{showingTo} of {displayProducts.length}{" "}
                Results
              </span>
              <select
                className="border rounded-lg px-3 py-2 mr-5 cursor-pointer"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="default">Default Sorting</option>
                <option value="lowToHigh">Price: Low to High</option>
                <option value="highToLow">Price: High to Low</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-1">
              {currentProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-6 space-x-2">
              {Array.from(
                { length: Math.ceil(displayProducts.length / productsPerPage) },
                (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => paginate(i + 1)}
                    className={`px-4 py-2 rounded-lg ${
                      currentPage === i + 1
                        ? "bg-green-700 text-white "
                        : "bg-gray-200 text-gray-700 cursor-pointer"
                    }`}
                  >
                    {i + 1}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllProducts;
