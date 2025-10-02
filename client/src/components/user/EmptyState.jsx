import React from "react";

const EmptyState = ({ 
  title = "Không có dữ liệu", 
  description = "Không tìm thấy dữ liệu phù hợp.", 
  buttonText, 
  buttonAction 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-gray-400 mb-4">
        <svg
          className="w-16 h-16 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          ></path>
        </svg>
      </div>
      <h3 className="text-xl font-medium text-gray-700">{title}</h3>
      <p className="text-gray-500 mt-2 max-w-md">{description}</p>
      {buttonText && buttonAction && (
        <button
          onClick={buttonAction}
          className="mt-6 px-6 py-2.5 bg-green-700 text-white font-medium rounded-lg hover:bg-green-800 transition"
        >
          {buttonText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;