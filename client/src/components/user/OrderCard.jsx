import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import OrderDetailModal from "./modal/OrderDetailModal";
import { useNavigate } from "react-router-dom";
const OrderCard = ({
  orderId,
  order,
  onCancelOrder,
  onReorder,
  onUpdateShippingStatus,
  user,
  autoOpen = false,
  onModalClose
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState(order.status);
  const [showDetails, setShowDetails] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {

    if (autoOpen) {
      const timer = setTimeout(() => {
        setIsModalOpen(true);
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [autoOpen, order._id]); // 


  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  }, []);

  const getPrimaryImage = useCallback((item) => {
    const images = item.product_id?.images;
    if (!images || !Array.isArray(images)) return "/placeholder-product.jpg";
    const primaryImage = images.find((img) => img.is_primary);
    return primaryImage?.image_url || images[0]?.image_url || "/placeholder-product.jpg";
  }, []);

  const handleOpenModal = useCallback(() => {

    navigate(`/user/orders/${order._id}`);
  }, [order._id, navigate]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    if (onModalClose) {
      onModalClose();
    }
  }, [onModalClose]);

  const handleCancelOrder = useCallback(() => {
    if (onCancelOrder) {
      onCancelOrder(order._id);
    }
  }, [order._id, onCancelOrder]);

  const handleReorder = useCallback(() => {
    if (onReorder) {
      onReorder(order._id);
    }
  }, [order._id, onReorder]);

  // Validate props
  if (!orderId || !order._id) {
    console.error('❌ OrderCard: Missing required props', { orderId, order });
    return null;
  }

  return (
    <>
      <div
        id={`order-${orderId}`}
        className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 ${autoOpen ? 'ring-4 ring-blue-500 ring-offset-2' : 'hover:shadow-md'
          }`}
      >
        {/* Card Header */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 px-6 py-4 border-b border-green-200">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-gray-600 font-medium">Mã đơn:</span>
                  <span className="font-bold text-green-700">
                    #{order.order_number || order._id?.slice(-8)}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  📅 {formatDate(order.created_at)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products List */}
        <div className="p-6">
          <div className="space-y-4">
            {order.items?.map((item, index) => {
              const imageUrl = getPrimaryImage(item);
              return (
                <div
                  key={item._id || `${order._id}-item-${index}`}
                  className="flex gap-4 pb-4 border-b last:border-b-0 last:pb-0"
                >
                  <div className="w-20 h-20 flex-shrink-0">
                    <img
                      src={imageUrl}
                      alt={item.product_id?.name}
                      className="w-full h-full object-cover rounded-lg border border-gray-200"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = "/placeholder-product.jpg";
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-800 mb-1 line-clamp-2">
                      {item.product_id?.name || "Sản phẩm không tồn tại"}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <span>Số lượng: {item.quantity}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-green-600">
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="text-sm text-gray-600">
                <div>
                  <span className="font-medium">Thành tiền:</span>{" "}
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleOpenModal}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition cursor-pointer"
                >
                  👁️ Xem chi tiết
                </button>

                {user?.role === "user" && ["pending", "confirmed"].includes(order.status) && (
                  <button
                    onClick={handleCancelOrder}
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition cursor-pointer"
                  >
                    ❌ Hủy đơn
                  </button>
                )}

                {user?.role === "user" && ["delivered", "cancelled"].includes(order.status) && (
                  <button
                    onClick={handleReorder}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition cursor-pointer"
                  >
                    🔄 Mua lại
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  );
};
export default OrderCard;