import React from "react";

const ProductDetailDialog = ({ open, onClose, product }) => {
  const districtMap = {
    phu_yen_city: "TP Tuy Hòa",
    dong_hoa: "TX Đông Hòa",
    tuy_an: "Huyện Tuy An",
    son_hoa: "Huyện Sơn Hòa",
    song_hinh: "Huyện Sông Hinh",
    tay_hoa: "Huyện Tây Hòa",
    phu_hoa: "Huyện Phú Hòa",
    dong_xuan: "Huyện Đồng Xuân",
    song_cau: "TX Sông Cầu",
  };

  const terrainMap = {
    bien: "Biển",
    nui: "Núi",
    dong_bang: "Đồng bằng",
    ven_bien: "Ven biển",
  };

  if (!open || !product) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-5xl p-8 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            🛍️ Chi tiết sản phẩm
          </h2>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg"
          >
            Đóng
          </button>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Cột trái: thông tin sản phẩm */}
          <div className="space-y-3 text-gray-700">
            <p>
              <strong>Tên:</strong> {product.name}
            </p>

            {product.short_description && (
              <p>
                <strong>Mô tả ngắn:</strong> {product.short_description}
              </p>
            )}
            {product.description && (
              <p>
                <strong>Mô tả chi tiết:</strong> {product.description}
              </p>
            )}

            <p>
              <strong>Giá:</strong> {product.price} VNĐ
            </p>
            {product.sale_price !== undefined && (
              <p>
                <strong>Giá khuyến mãi:</strong>{" "}
                {product.sale_price === 0
                  ? "0 VNĐ"
                  : `${product.sale_price} VNĐ`}
              </p>
            )}

            <p>
              <strong>Số lượng tồn:</strong> {product.stock_quantity}
            </p>
            <p>
              <strong>Đã bán:</strong> {product.sold_quantity}
            </p>
            <p>
              <strong>Trạng thái:</strong> {product.status}
            </p>
            <p>
              <strong>Nổi bật:</strong> {product.featured ? "Có" : "Không"}
            </p>

            {product.category_id && (
              <p>
                <strong>Danh mục:</strong> {product.categoryName}
              </p>
            )}

            {product.hometown_origin && (
              <p className="mt-2">
                <strong>Xuất xứ:</strong>{" "}
                {districtMap[product.hometown_origin.district] || "Không rõ"} -{" "}
                {terrainMap[product.hometown_origin.terrain] || "Không rõ"}
              </p>
            )}

            <p>
              <strong>Lượt xem:</strong> {product.views?.length || 0}
            </p>
            <p>
              <strong>Lượt yêu thích:</strong> {product.favorite_count || 0}
            </p>
            <p>
              <strong>Số người mua:</strong> {product.buyer_count || 0}
            </p>
          </div>

          {/* Cột phải: hình ảnh */}
          {product.images?.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 text-gray-800">Hình ảnh</h3>
              <div className="grid grid-cols-2 gap-3">
                {product.images.map((img, i) => (
                  <img
                    key={i}
                    src={img.image_url}
                    alt={`product-${i}`}
                    className={`w-full h-40 object-cover rounded-lg border ${
                      img.is_primary ? "ring-2 ring-green-500" : ""
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailDialog;
