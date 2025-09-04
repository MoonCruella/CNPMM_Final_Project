import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import ProductCard from "./ProductCard";
import productService from "../services/productService.js";

const ProductDisplay = ({ layout = "grid", type = "all" }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let data;
        if (type === "seller") {
          data = await productService.getBestSeller();
        } else if (type === "discount") {
          data = await productService.getBestDiscount();
        } else if (type === "newest") {
          data = await productService.getNewest();
        } else {
          data = await productService.getAll();
        }

        if (data.success) {
          setProducts(
            data.data.map((p) => ({
              ...p,
              primary_image: p.images.find((img) => img.is_primary)?.image_url,
            }))
          );
        }
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [type]);

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 4,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 3, slidesToScroll: 3 } },
      { breakpoint: 768, settings: { slidesToShow: 2, slidesToScroll: 2 } },
      { breakpoint: 640, settings: { slidesToShow: 1, slidesToScroll: 1 } },
    ],
  };

  if (loading) return <p className="text-center">Đang tải sản phẩm...</p>;

  return (
    <div className="mx-4">
      {layout === "slider" ? (
        <Slider {...sliderSettings}>
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </Slider>
      ) : (
        <div className="grid grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductDisplay;
