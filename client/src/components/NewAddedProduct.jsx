import React from "react";
import ProductDisplay from "./ProductDisplay";

const NewAddedProduct = () => {
  return (
    <div className="mt-30  sm:px-6 lg:px-20 ">
      <div className="container">
        <h2 className=" ml-10 text-2xl md:text-3xl font-bold text-primary">
          Sản phẩm mới
        </h2>
      </div>
      <ProductDisplay type="newest" layout="slider" />
    </div>
  );
};

export default NewAddedProduct;
