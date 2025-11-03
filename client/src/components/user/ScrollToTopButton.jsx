import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
const ScrollToTopButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.pageYOffset > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className="fixed bottom-40 right-6 z-50 w-14 h-14 rounded-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center shadow-lg transition-transform transform hover:-translate-y-1 cursor-pointer"
    >
      <img src={assets.up} alt="Scroll to top" className="w-4 h-4" />
    </button>
  );
};

export default ScrollToTopButton;
