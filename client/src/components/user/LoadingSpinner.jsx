import React from "react";

const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-700"></div>
      <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
    </div>
  );
};

export default LoadingSpinner;