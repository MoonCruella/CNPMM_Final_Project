import React, { useState, useEffect} from "react";
import { assets } from "@/assets/assets";
import productService from "../services/productService.js";
import categoryService from "../services/categoryService.js";
import ProductCard from "../components/ProductCard.jsx";

const AllProducts = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(9);
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const showingFrom = indexOfFirstProduct + 1;
  const showingTo = Math.min(indexOfLastProduct, filteredProducts.length);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  useEffect(() => {
    const fetchProductsAndCategories = async () => {
      try {
        const productRes = await productService.getAll();
        if (productRes.success) {
          const formatted = productRes.data.map((p) => ({
            ...p,
            primary_image: p.images.find((img) => img.is_primary)?.image_url,
          }));
          setProducts(formatted);
          setFilteredProducts(formatted);
        }

        const categoryRes = await categoryService.getAll();
        console.log("API categories:", categoryRes);
        setCategories(categoryRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductsAndCategories();
  }, []);

  // Lọc sản phẩm theo searchQuery
  useEffect(() => {
    if (searchQuery && Object.keys(searchQuery).length > 0) {
      const filtered = products.filter((prod) =>
        Object.entries(searchQuery).every(([key, value]) =>
          prod[key]
            ?.toString()
            .toLowerCase()
            .includes(value.toString().toLowerCase())
        )
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [products, searchQuery]);

  useEffect(() => {
    window.scrollTo({ top: 500, behavior: "smooth" });
  }, [currentPage]);

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
          <h1 className="text-5xl font-bold mb-4">All Products</h1>
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
          {/* Sidebar */}
          <div className="w-84 flex flex-col gap-6">
            {/* Search Box */}
            <div className="bg-yellow-50 p-4 rounded-xl">
              <div className="flex items-center border rounded-lg px-2 py-1">
                <input
                  type="text"
                  placeholder="Keywords"
                  onChange={(e) => setSearchQuery({ name: e.target.value })}
                  className="w-full bg-transparent focus:outline-none px-2"
                />
                <button className="bg-yellow-400 p-2 rounded-lg">🔍</button>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-yellow-50 p-4 rounded-xl">
              <h2 className="font-semibold mb-3">All Category</h2>
              <ul className="space-y-2">
                {categories.map((cat) => (
                  <li
                    key={cat._id}
                    className="flex justify-between items-center py-2 border-b cursor-pointer hover:text-green-600"
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
                Showing {showingFrom}-{showingTo} of {filteredProducts.length}{" "}
                Results
              </span>
              <select className="border rounded-lg px-3 py-2 mr-5">
                <option>Default Sorting</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-1">
              {currentProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
            <div className="flex justify-center mt-6 space-x-2">
              {Array.from(
                {
                  length: Math.ceil(filteredProducts.length / productsPerPage),
                },
                (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => paginate(i + 1)}
                    className={`px-4 py-2 rounded-lg ${
                      currentPage === i + 1
                        ? "bg-green-700 text-white"
                        : "bg-gray-200 text-gray-700"
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
