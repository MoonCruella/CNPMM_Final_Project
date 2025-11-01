import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext.jsx";
import { categoriesColors } from "@/assets/assets.js";
import categoryService from "../../services/categoryService.js";
const Categories = () => {
  const { navigate } = useAppContext();
  const [categories, setCategories] = useState([]);

  // Gọi API khi component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryService.getAll();

        // chỉ lấy phần mảng
        setCategories(res.data || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

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
          {categories.map((item, index) => {
            const style = categoriesColors[index % categoriesColors.length];
            return (
              <div
                key={item._id}
                onClick={() => {
                  navigate("/products", { state: { categoryId: item._id } });
                  window.scrollTo(0, 0);
                }}
                className="w-36 h-40 p-5 rounded-2xl flex flex-col items-center justify-between transform transition duration-300 cursor-pointer hover:scale-105 hover:shadow-lg"
                style={{ backgroundColor: style.bgColor }}
              >
                {/* Khung ảnh tròn */}
                <div
                  className="w-16 h-16 flex items-center justify-center rounded-full"
                  style={{ backgroundColor: style.bgMainColor }}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-8 h-8 object-contain"
                  />
                </div>

                {/* Tên category */}
                <h3 className=" pb-1 font-semibold text-center">{item.name}</h3>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Categories;
