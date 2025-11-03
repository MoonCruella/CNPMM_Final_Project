import BestDiscount from "@/components/user/BestDiscount";
import BestSeller from "@/components/user/BestSeller";
import BestView from "@/components/user/BestView";
import Categories from "@/components/user/Categories";
import MainBanner from "@/components/user/MainBanner";
import NewAddedProduct from "@/components/user/NewAddedProduct";
import React, { useEffect } from "react";
import ScrollToTopButton from "@/components/user/ScrollToTopButton";

const HomePage = () => {
  // khi vào trang Home, cuộn lên đầu trang 1 lần
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // scroll-to-top handled by ScrollToTopButton component
  return (
    <div className="bg-[#fbfbf7] ">
      <MainBanner />
      <Categories />
      <BestSeller />
      <BestDiscount />
      <NewAddedProduct />
      <BestView />

      <ScrollToTopButton />
    </div>
  );
};

export default HomePage;
