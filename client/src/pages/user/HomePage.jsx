import BestDiscount from "@/components/user/BestDiscount";
import BestSeller from "@/components/user/BestSeller";
import BestView from "@/components/user/BestView";
import Categories from "@/components/user/Categories";
import MainBanner from "@/components/user/MainBanner";
import NewAddedProduct from "@/components/user/NewAddedProduct";
import React from "react";

const HomePage = () => {
  return (
    <div className="bg-[#fbfbf7] ">
      <MainBanner />
      <Categories />
      <BestSeller />
      <BestDiscount />
      <NewAddedProduct />
      <BestView />
    </div>
  );
};

export default HomePage;
