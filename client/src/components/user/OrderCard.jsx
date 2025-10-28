import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import OrderDetailModal from "./modal/OrderDetailModal";

const statusOptions = [
  { value: "pending", label: "Chờ xác nhận" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "processing", label: "Đang xử lý" },
  { value: "shipped", label: "Đang giao hàng" },
  { value: "delivered", label: "Đã giao thành công" },
  { value: "cancelled", label: "Đã hủy" },
  { value: "cancel_request", label: "Yêu cầu hủy" },
];

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
  //   : Đổi showModal -> isModalOpen
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState(order.status);
  const [showDetails, setShowDetails] = useState(false);

  //   : Thêm useEffect để auto open modal
  useEffect(() => {
    if (autoOpen) {
      console.log('🔓 Auto opening modal for order:', order._id);
      setIsModalOpen(true);
    }
  }, [autoOpen, order._id]);

  // Format functions
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

  const getStatusBadge = useCallback((status) => {
    const statusMap = {
      pending: { label: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-700", icon: "⏰" },
      confirmed: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-700", icon: "✔️" },
      processing: { label: "Đang xử lý", color: "bg-purple-100 text-purple-700", icon: "🛒" },
      shipped: { label: "Đang giao", color: "bg-indigo-100 text-indigo-700", icon: "🚚" },
      delivered: { label: "Đã giao", color: "bg-green-100 text-green-700", icon: "✅" },
      cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-700", icon: "❌" },
      cancel_request: { label: "Yêu cầu hủy", color: "bg-orange-100 text-orange-700", icon: "🔄" },
    };

    const statusInfo = statusMap[status] || {
      label: status,
      color: "bg-gray-100 text-gray-700",
      icon: "📦",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color} flex items-center gap-1 w-fit`}
      >
        <span>{statusInfo.icon}</span>
        {statusInfo.label}
      </span>
    );
  }, []);

  const getPrimaryImage = useCallback((item) => {
    const images = item.product_id?.images;
    if (!images || !Array.isArray(images)) return "/placeholder-product.jpg";

    const primaryImage = images.find((img) => img.is_primary);
    return primaryImage?.image_url || images[0]?.image_url || "/placeholder-product.jpg";
  }, []);

  // Check capabilities
  const canCancel = useMemo(() => {
    return ["pending", "confirmed"].includes(order.status);
  }, [order.status]);

  const canReorder = useMemo(() => {
    return ["delivered", "cancelled"].includes(order.status);
  }, [order.status]);

  // Handlers
  const handleUpdateStatus = useCallback(() => {
    if (newStatus !== order.status) {
      onUpdateShippingStatus(order._id, newStatus);
    }
  }, [newStatus, order.status, order._id, onUpdateShippingStatus]);

  //   : Đổi handleShowModal -> handleOpenModal
  const handleOpenModal = useCallback(() => {
    console.log('👁️ Opening modal for order:', order._id);
    setIsModalOpen(true);
  }, [order._id]);

  const handleCloseModal = useCallback(() => {
    console.log('❌ Closing modal for order:', order._id);
    setIsModalOpen(false);
    if (onModalClose) {
      onModalClose();
    }
  }, [order._id, onModalClose]);

  const handleCancelOrder = useCallback(() => {
    onCancelOrder(order._id);
  }, [order._id, onCancelOrder]);

  const handleReorder = useCallback(() => {
    onReorder(order._id);
  }, [order._id, onReorder]);

  const toggleDetails = useCallback(() => {
    setShowDetails((prev) => !prev);
  }, []);

  return (
    <>
      {/*   : Sử dụng template literal cho id */}
      <div id={`order-${orderId}`} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition">
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
                <div className="text-xs text-gray-500">📅 {formatDate(order.created_at)}</div>
              </div>
            </div>
            {getStatusBadge(order.status)}
          </div>
        </div>

        {/* Products List */}
        <div className="p-6">
          <div className="space-y-4">
            {order.items?.map((item, index) => {
              const imageUrl = getPrimaryImage(item);

              return (
                <div key={index} className="flex gap-4 pb-4 border-b last:border-b-0 last:pb-0">
                  {/* Product Image */}
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

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-800 mb-1 line-clamp-2">
                      {item.product_id?.name || "Sản phẩm không tồn tại"}
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <span>Số lượng: {item.quantity}</span>
                      {item.variant && (
                        <>
                          <span>•</span>
                          <span className="text-gray-500">
                            {item.variant.size && `Size: ${item.variant.size}`}
                            {item.variant.color && ` • Màu: ${item.variant.color}`}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {item.original_price && item.original_price > item.price && (
                        <span className="text-sm text-gray-400 line-through">
                          {formatCurrency(item.original_price)}
                        </span>
                      )}
                      <span className="font-semibold text-green-600">
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between flex-wrap gap-4">
              {/* Total Amount */}
              <div className="text-sm text-gray-600">
                <div className="mb-1">
                  <span className="font-medium">Tổng số lượng:</span>{" "}
                  <span className="text-gray-800">
                    {order.items?.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm
                  </span>
                </div>
                <div>
                  <span className="font-medium">Thành tiền:</span>{" "}
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(order.total_amount || order.final_total)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {/*   : Đổi handleShowModal -> handleOpenModal */}
                <button
                  onClick={handleOpenModal}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition"
                >
                  👁️ Xem chi tiết
                </button>

                {user?.role === "user" && canCancel && (
                  <button
                    onClick={handleCancelOrder}
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
                  >
                    ❌ Hủy đơn
                  </button>
                )}

                {user?.role === "user" && canReorder && (
                  <button
                    onClick={handleReorder}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                  >
                    🔄 Mua lại
                  </button>
                )}
              </div>
            </div>

            {/* Seller Status Update */}
            {user?.role === "seller" && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">
                    Cập nhật trạng thái:
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleUpdateStatus}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={newStatus === order.status}
                  >
                    Cập nhật
                  </button>
                </div>
              </div>
            )}

            {/* Toggle Details Button */}
            <button
              onClick={toggleDetails}
              className="mt-4 text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
            >
              {showDetails ? "▼" : "▶"} {showDetails ? "Ẩn" : "Xem"} thông tin chi tiết
            </button>
          </div>
        </div>

        {/* Expandable Details */}
        {showDetails && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {/* Shipping Address */}
              <div>
                <h4 className="font-medium text-gray-800 mb-2">📍 Địa chỉ giao hàng</h4>
                <div className="text-gray-600 space-y-1">
                  <p>{order.shipping_info?.name}</p>
                  <p>{order.shipping_info?.phone}</p>
                  <p>{order.shipping_info?.address}</p>
                </div>
              </div>

              {/* Payment Info */}
              <div>
                <h4 className="font-medium text-gray-800 mb-2">💳 Thanh toán</h4>
                <div className="text-gray-600 space-y-1">
                  <p>Phương thức: {order.payment_method}</p>
                  <p>Trạng thái: {order.payment_status || "pending"}</p>
                  {order.payment_date && <p>Ngày TT: {formatDate(order.payment_date)}</p>}
                </div>
              </div>

              {/* Order Timeline */}
              <div>
                <h4 className="font-medium text-gray-800 mb-2">📋 Lịch sử</h4>
                <div className="text-gray-600 space-y-1">
                  <p>Tạo: {formatDate(order.created_at)}</p>
                  {order.confirmed_at && <p>Xác nhận: {formatDate(order.confirmed_at)}</p>}
                  {order.shipped_at && <p>Giao hàng: {formatDate(order.shipped_at)}</p>}
                  {order.delivered_at && <p>Hoàn thành: {formatDate(order.delivered_at)}</p>}
                </div>
              </div>
            </div>

            {order.notes && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Ghi chú:</strong> {order.notes}
                </p>
              </div>
            )}

            {order.tracking_number && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Mã vận đơn:</strong> {order.tracking_number}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {/*: Đổi showModal -> isModalOpen */}
      <OrderDetailModal
        order={order}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onCancelOrder={onCancelOrder}
        onReorder={onReorder}
      />
    </>
  );
};

//   : Sửa areEqual comparison
const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.orderId === nextProps.orderId && //  Compare orderId
    prevProps.order._id === nextProps.order._id &&
    prevProps.order.status === nextProps.order.status &&
    prevProps.autoOpen === nextProps.autoOpen &&
    prevProps.onCancelOrder === nextProps.onCancelOrder &&
    prevProps.onReorder === nextProps.onReorder &&
    prevProps.onUpdateShippingStatus === nextProps.onUpdateShippingStatus
  );
};

export default React.memo(OrderCard, areEqual);