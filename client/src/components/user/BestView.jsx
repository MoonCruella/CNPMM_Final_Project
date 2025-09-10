import React from "react";
import { assets } from "@/assets/assets";
import ProductDisplay from "./ProductDisplay";
const BestView = () => {
  return (
    <div className="mt-30 h-fit  sm:px-6 lg:px-20   pt-10 ">
      <div className="container">
        <div className="text-center mb-12 ">
          <span className="text-green-600 font-medium text-sm flex items-center justify-center gap-2">
            <i className="flaticon-leaves" />
            Sản phẩm nổi bật
          </span>
          <h2 className="text-4x md:text-4xl font-bold mt-2">
            Được xem nhiều nhất
          </h2>
        </div>
      </div>

      <ProductDisplay type="all" layout="grid" />
    </div>
  );
};

export default BestView;
