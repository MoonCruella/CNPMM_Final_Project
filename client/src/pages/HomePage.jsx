import BestDiscount from "@/components/BestDiscount";
import BestSeller from "@/components/BestSeller";
import BestView from "@/components/BestView";
import Categories from "@/components/Categories";
import MainBanner from "@/components/MainBanner";
import NewAddedProduct from "@/components/NewAddedProduct";
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
