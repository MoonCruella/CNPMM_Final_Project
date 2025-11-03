import React from "react";
import { assets } from "@/assets/assets";
import ProductDisplay from "./ProductDisplay";
import { useNavigate } from "react-router-dom";

const BestView = () => {
  const navigate = useNavigate();

  return (
    <div className="mt-30 h-fit  sm:px-6 lg:px-20   pt-10 ">
      <div className="container">
        <div className="text-center mb-12 ">
          <h2 className="text-4x md:text-4xl font-bold mt-2">
            Sản phẩm của chúng tôi
          </h2>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => navigate("/products")}
              className="inline-flex items-center px-4 py-2 font-medium bg-green-600 text-white rounded-2xl hover:bg-green-700 transition hover:scale-105 duration-300 cursor-pointer group"
            >
              Xem tất cả
            </button>
          </div>
        </div>
      </div>

      <ProductDisplay type="all" layout="grid" />
    </div>
  );
};

export default BestView;
