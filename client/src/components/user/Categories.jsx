import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext.jsx";
import { categoriesColors } from "@/assets/assets.js";
import categoryService from "../../services/categoryService.js";

const Categories = () => {
  const { navigate } = useAppContext();
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Gọi API khi component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const res = await categoryService.getAll();
        
        console.log("Categories response:", res);

        // Xử lý response structure
        if (res.success) {
          // Check if data is array or nested object
          const categoriesData = Array.isArray(res.data) 
            ? res.data 
            : res.data?.categories || [];
          
          // Chỉ lấy categories active
          const activeCategories = categoriesData.filter(cat => cat.is_active);
          
          setCategories(activeCategories);
        } else {
          setCategories([]);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <section className="pt-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-green-600 font-medium text-sm flex items-center justify-center gap-2">
              <i className="flaticon-leaves" />
              Danh mục phổ biến
            </span>
            <h2 className="text-4xl md:text-4xl font-bold mt-2">
              Đặc sản Phú Yên - Tươi ngon & Sạch
            </h2>
          </div>
          
          {/* Loading skeleton */}
          <div className="flex flex-wrap justify-center gap-6 mt-10">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="w-36 h-40 p-5 rounded-2xl bg-gray-100 animate-pulse"
              >
                <div className="w-16 h-16 mx-auto bg-gray-200 rounded-full mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mx-auto w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Empty state
  if (!isLoading && categories.length === 0) {
    return (
      <section className="pt-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-green-600 font-medium text-sm flex items-center justify-center gap-2">
              <i className="flaticon-leaves" />
              Danh mục phổ biến
            </span>
            <h2 className="text-4xl md:text-4xl font-bold mt-2">
              Đặc sản Phú Yên - Tươi ngon & Sạch
            </h2>
          </div>
          
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">📦</span>
            </div>
            <p className="text-gray-500">Chưa có danh mục nào</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-20">
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
          {Array.isArray(categories) && categories.length > 0 ? (
            categories.map((item, index) => {
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
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'block';
                        }}
                      />
                    ) : null}
                    <span 
                      className="text-2xl"
                      style={{ display: item.image ? 'none' : 'block' }}
                    >
                      📦
                    </span>
                  </div>

                  {/* Tên category */}
                  <h3 className="pb-1 font-semibold text-center text-sm">
                    {item.name}
                  </h3>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 w-full">
              <p className="text-gray-500">Không có danh mục nào</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Categories;