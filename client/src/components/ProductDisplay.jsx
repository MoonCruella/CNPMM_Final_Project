import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import ProductCard from "./ProductCard";
import { assets } from "@/assets/assets";
import productService from "../services/productService.js";

const ProductDisplay = ({ layout = "grid" }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        const data = await productService.getBestSeller(); // <-- await
        if (data.success) {
          setProducts(
            data.data.map((p) => ({
              ...p,
              primary_image: p.images.find((img) => img.is_primary)?.image_url,
            }))
          );
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBestSellers();
  }, []);
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 4, // hiển thị 4 sản phẩm cùng lúc
    slidesToScroll: 4, // mỗi lần cuộn qua 4 sản phẩm
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 3, slidesToScroll: 3 } },
      { breakpoint: 768, settings: { slidesToShow: 2, slidesToScroll: 2 } },
      { breakpoint: 640, settings: { slidesToShow: 1, slidesToScroll: 1 } },
    ],
  };

  return (
    <div className="mx-4">
      {layout === "slider" ? (
        <Slider {...sliderSettings}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </Slider>
      ) : (
        <div className="grid grid-cols-4 ">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductDisplay;
