import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import ProductCard from "./item/ProductCard";
import productService from "../../services/productService.js";

const ProductDisplay = ({ layout = "grid", type = "all" }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        let response;
        if (type === "seller") {
          response = await productService.getBestSeller();
        } else if (type === "discount") {
          response = await productService.getBestDiscount();
        } else if (type === "newest") {
          response = await productService.getNewest();
        } else {
          response = await productService.getAll();
        }


        if (response.success) {
          // Handle different response structures
          let productList = [];
          
          if (type === "all") {
            // getAllProducts returns: { data: { products: [...], pagination: {...} } }
            productList = response.data?.products || [];
          } else {
            // Other endpoints return: { data: [...] }
            productList = response.data || [];
          }

          // Map products with primary image
          const mappedProducts = productList.map((p) => ({
            ...p,
            primary_image: p.images?.find((img) => img.is_primary)?.image_url || p.images?.[0]?.image_url,
          }));

          setProducts(mappedProducts);
        } else {
          setError(response.message || "Không thể tải sản phẩm");
        }
      } catch (err) {
        console.error("❌ Error fetching products:", err);
        setError(err.message || "Đã xảy ra lỗi khi tải sản phẩm");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [type]);

  const sliderSettings = {
    dots: true,
    infinite: products.length > 4,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 4,
    responsive: [
      { 
        breakpoint: 1024, 
        settings: { 
          slidesToShow: 3, 
          slidesToScroll: 3,
          infinite: products.length > 3
        } 
      },
      { 
        breakpoint: 768, 
        settings: { 
          slidesToShow: 2, 
          slidesToScroll: 2,
          infinite: products.length > 2
        } 
      },
      { 
        breakpoint: 640, 
        settings: { 
          slidesToShow: 1, 
          slidesToScroll: 1,
          infinite: products.length > 1
        } 
      },
    ],
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (products.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-gray-600">Không có sản phẩm nào</p>
        </div>
      </div>
    );
  }

  // Render products
  return (
    <div className="mx-4">
      {layout === "slider" ? (
        <Slider {...sliderSettings}>
          {products.map((product) => (
            <div key={product._id} className="px-2">
              <ProductCard product={product} />
            </div>
          ))}
        </Slider>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductDisplay;