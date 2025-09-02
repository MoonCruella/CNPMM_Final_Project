import { assets } from "@/assets/assets";
import React from "react";
import { categories } from "@/assets/assets";
import { useAppContext } from "../context/AppContext.jsx";

const Categories = () => {
  const { navigate } = useAppContext();
  return (
    <section className="pt-20 ">
      <div className="container mx-auto px-4">
        {/* Title */}
        <div className="text-center mb-12">
          <span className="text-green-600 font-medium text-sm flex items-center justify-center gap-2">
            <i className="flaticon-leaves" />
            Danh mục phổ biến
          </span>
          <h2 className="text-4xl md:text-4xl font-bold mt-2">
            Đặc sản Phú Yên - Tươi ngon & Sạch
          </h2>
        </div>

        {/* Category List */}
        <div className="flex flex-wrap justify-center gap-6 mt-10">
          {categories.map((item, index) => (
            <div
              key={index}
              onClick={() => {
                navigate(`/products/${item.path.toLowerCase()}`);
                scrollTo(0, 0);
              }}
              className="w-36 rounded-2xl p-5 mx-5 mb-5 shadow-md flex flex-col justify-center items-center text-center transition-transform hover:scale-105"
              style={{ backgroundColor: item.bgColor }}
            >
              {/* Icon/Image */}
              <div
                className="w-16 h-16 flex items-center justify-center rounded-full mb-4"
                style={{ backgroundColor: item.bgMainColor }}
              >
                <img src={item.image} alt={item.text} className="w-8 h-8" />
              </div>

              {/* Content */}
              <div>
                <h5 className="font-semibold text-gray-800">{item.text}</h5>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
