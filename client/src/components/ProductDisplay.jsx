import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import ProductCard from "./ProductCard";
import { assets } from "@/assets/assets";

const ProductDisplay = ({ layout = "grid" }) => {
  //const [products, setProducts] = useState([]);

  //   useEffect(() => {
  //     // Giả lập API call
  //     fetch("https://api.example.com/products")
  //       .then((res) => res.json())
  //       .then((data) => setProducts(data))
  //       .catch((err) => console.log(err));
  //   }, []);

  const products = [
    {
      id: 1,
      name: "Fresh Strawberry",
      image: assets.banner_main,
      price: 10.99,
      prevPrice: 20.0,
      isNew: true,
    },
    {
      id: 2,
      name: "Green Broccoli",
      image: assets.banner_main,
      price: 17.99,
      prevPrice: 28.0,
      isNew: true,
    },
    {
      id: 3,
      name: "Sou Red Cherry",
      image: assets.banner_main,
      price: 12.0,
      prevPrice: 30.0,
    },
    {
      id: 4,
      name: "Fresh Orange",
      image: assets.banner_main,
      price: 20.99,
      prevPrice: 35.0,
      isNew: true,
    },
    {
      id: 5,
      name: "Fresh Strawberry",
      image: assets.banner_main,
      price: 10.99,
      prevPrice: 20.0,
      isNew: true,
    },
    {
      id: 6,
      name: "Green Broccoli",
      image: assets.banner_main,
      price: 17.99,
      prevPrice: 28.0,
      isNew: true,
    },
    {
      id: 7,
      name: "Sou Red Cherry",
      image: assets.banner_main,
      price: 12.0,
      prevPrice: 30.0,
    },
    {
      id: 8,
      name: "Fresh Orange",
      image: assets.banner_main,
      price: 20.99,
      prevPrice: 35.0,
      isNew: true,
    },
  ];

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
