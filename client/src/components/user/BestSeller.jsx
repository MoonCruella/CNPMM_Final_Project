import React from "react";
import ProductDisplay from "./ProductDisplay";
import { Link } from "react-router-dom";

const BestSeller = () => {
  return (
    <div className="mt-12 sm:px-6 lg:px-20">
      <div className="flex justify-between mx-10 items-center mb-4">
        <h2 className="text-2xl md:text-3xl font-bold text-primary">
          Bán chạy nhất
        </h2>
        <Link to="/products" className="text-green-600 underline">
          Xem tất cả
        </Link>
      </div>
      <ProductDisplay type="seller" layout="slider" />
    </div>
  );
};

export default BestSeller;
