import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";

import { assets } from "@/assets/assets";
import { Link } from "react-router-dom";

const MainBanner = () => {
  const banners = [
    assets.banner_main,
    assets.banner_main_1,
    assets.banner_main_2,
    assets.banner_main_3,
  ];

  return (
    <div className="relative">
      <Swiper
        modules={[Autoplay, EffectFade]}
        effect="fade"
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        loop={true}
        className="w-full h-screen"
      >
        {banners.map((banner, index) => (
          <SwiperSlide key={index}>
            <div className="relative w-full h-screen">
              {/* Ảnh */}
              <img
                src={banner}
                alt={`banner-${index}`}
                className="w-full h-screen object-cover"
              />

              {/* Lớp overlay */}
              <div className="absolute inset-0 bg-black/60"></div>

              {/* Nội dung trên ảnh */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight max-w-3xl">
                  Khám phá hương vị độc đáo của đặc sản Phú Yên
                </h1>

                <div className="flex flex-col md:flex-row gap-4 mt-8">
                  <Link
                    to={"/products"}
                    className=" flex items-center justify-center gap-2 px-8 py-3 btn-primary transition rounded text-white font-medium min-w-[200px]"
                  >
                    Mua ngay
                  </Link>
                  <Link
                    to={"/introduce"}
                    className="flex items-center justify-center gap-2 px-8 py-3 btn-secondary transition rounded text-black font-medium shadow min-w-[200px]"
                  >
                    Xem thêm
                  </Link>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default MainBanner;
