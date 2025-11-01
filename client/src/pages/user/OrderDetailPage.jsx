import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useUserContext } from "@/context/UserContext";
import { useCartContext } from "@/context/CartContext"; //    Add CartContext
import orderService from "@/services/order.service";
import CancelOrderModal from "../../components/user/modal/CancelOrderModal";

import { toast } from "sonner";

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useUserContext();
  const { fetchCart } = useCartContext();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReordering, setIsReordering] = useState(false); 
   const [showCancelModal, setShowCancelModal] = useState(false);
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  useEffect(() => {
    if (isAuthenticated && orderId) {
      loadOrderDetail();
    }
  }, [orderId, isAuthenticated]);

  const loadOrderDetail = async () => {
    try {
      setIsLoading(true);
      const response = await orderService.getOrderById(orderId);

      if (response.success) {
        const orderData = response.data.order || response.data;
        setOrder(orderData);
      } else {
        toast.error("Không tìm thấy đơn hàng");
        navigate("/user/purchase");
      }
    } catch (error) {
      console.error("Load order detail error:", error);
      toast.error("Có lỗi xảy ra khi tải đơn hàng");
      navigate("/user/purchase");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { label: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-800", icon: "⏰" },
      confirmed: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-800", icon: "✔️" },
      processing: { label: "Đang xử lý", color: "bg-purple-100 text-purple-800", icon: "🛒" },
      shipped: { label: "Đang giao", color: "bg-indigo-100 text-indigo-800", icon: "🚚" },
      delivered: { label: "Đã giao", color: "bg-green-100 text-green-800", icon: " ✅ " },
      cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800", icon: "❌" },
      cancel_request: { label: "Yêu cầu hủy", color: "bg-orange-100 text-orange-800", icon: "🔄" },
    };
    return statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800", icon: "📦" };
  };

  const getPrimaryImage = (item) => {
    const images = item.product_id?.images;
    if (!images || !Array.isArray(images)) return "/placeholder-product.jpg";
    const primaryImage = images.find((img) => img.is_primary);
    return primaryImage?.image_url || images[0]?.image_url || "/placeholder-product.jpg";
  };

  const handleCancelOrder = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này?")) {
      return;
    }

    try {
      const response = await orderService.cancelOrder(orderId);
      if (response.success) {
        toast.success("Hủy đơn hàng thành công");
        loadOrderDetail();
      } else {
        toast.error(response.message || "Không thể hủy đơn hàng");
      }
    } catch (error) {
      console.error("Cancel order error:", error);
      toast.error("Có lỗi xảy ra khi hủy đơn hàng");
    }
  };
  const handleOpenCancelModal = () => {
    setShowCancelModal(true);
  };

  const handleCloseCancelModal = () => {
    setShowCancelModal(false);
  };
  const handleSubmitCancelRequest = async (orderId, reason) => {
    try {
      setIsSubmittingCancel(true);
      const response = await orderService.cancelOrder(orderId, reason);
      
      if (response.success) {
        toast.success(response.message || "Đã gửi yêu cầu hủy đơn hàng");
        loadOrderDetail();
      } else {
        toast.error(response.message || "Không thể gửi yêu cầu hủy");
      }
    } catch (error) {
      console.error("Cancel request error:", error);
      toast.error("Có lỗi xảy ra");
      throw error;
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  //    IMPROVED handleReorder - Same as MyOrderPage
  const handleReorder = async () => {
    if (isReordering) return; // Prevent double click

    try {
      setIsReordering(true);

      const response = await orderService.reorder(orderId);

      if (response.success) {
        toast.success("Đã thêm sản phẩm vào giỏ hàng");

        //    Wait for cart to load completely
        try {
          const cartData = await fetchCart();

          //  Wait a bit more to ensure state propagates
          await new Promise(resolve => setTimeout(resolve, 300));

          navigate('/cart');
        } catch (fetchError) {
          console.error(" Cart fetch error:", fetchError);
          // Navigate anyway
          navigate('/cart');
        }
      } else {
        toast.error(response.message || "Không thể đặt lại đơn hàng");
      }
    } catch (error) {
      console.error("❌ Reorder error:", error);
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi đặt lại đơn hàng");
    } finally {
      setIsReordering(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Vui lòng đăng nhập</h2>
          <p className="text-gray-600 mb-6">Bạn cần đăng nhập để xem chi tiết đơn hàng</p>
          <Link
            to="/login"
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Đăng nhập
          </Link>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải chi tiết đơn hàng...</p>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Không tìm thấy đơn hàng</h2>
          <Link
            to="/user/purchase"
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Quay lại danh sách
          </Link>
        </div>
      </main>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const canCancel = ["pending", "confirmed"].includes(order.status);
  const canRequestCancel = order.status === "processing";
  const canReorder = ["delivered", "cancelled"].includes(order.status);

  return (
    <main className="space-y-6">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link to="/" className="hover:text-green-600">Trang chủ</Link>
          <span>/</span>
          <Link to="/user/orders" className="hover:text-green-600">Đơn hàng của tôi</Link>
          <span>/</span>
          <span className="font-medium text-gray-900">Chi tiết đơn hàng</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/user/orders")}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Chi tiết đơn hàng</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Mã đơn: <span className="font-semibold text-green-600">#{order.order_number || order._id?.slice(-8).toUpperCase()}</span>
                </p>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${statusInfo.color}`}>
              <span>{statusInfo.icon}</span>
              {statusInfo.label}
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>📅 Đặt ngày: {formatDate(order.created_at)}</span>
            {order.updated_at && order.updated_at !== order.created_at && (
              <>
                <span>•</span>
                <span>🔄 Cập nhật: {formatDate(order.updated_at)}</span>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Products List */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>📦</span>
                Danh sách sản phẩm ({order.items?.length || 0})
              </h2>
              <div className="space-y-4">
                {order.items?.map((item, index) => {
                  const imageUrl = getPrimaryImage(item);
                  return (
                    <div key={item._id || index} className="flex gap-4 pb-4 border-b last:border-b-0">
                      <div className="w-20 h-20 flex-shrink-0">
                        <img
                          src={imageUrl}
                          alt={item.product_id?.name}
                          className="w-full h-full object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            e.target.src = "/placeholder-product.jpg";
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/products/${item.product_id?._id}`}
                          className="font-medium text-gray-800 hover:text-green-600 line-clamp-2 block mb-1"
                        >
                          {item.product_id?.name || "Sản phẩm không tồn tại"}
                        </Link>
                        <div className="text-sm text-gray-600 mb-2">
                          {item.variant && (
                            <p>
                              {item.variant.size && `Size: ${item.variant.size}`}
                              {item.variant.color && ` • Màu: ${item.variant.color}`}
                            </p>
                          )}
                          <p>Số lượng: {item.quantity}</p>
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
                          <span className="text-sm text-gray-500">
                            × {item.quantity} = {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shipping Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>📍</span>
                Thông tin giao hàng
              </h2>
              <div className="space-y-3 text-gray-700">
                <div className="flex items-start gap-2">
                  <span className="font-semibold min-w-[120px]">Người nhận:</span>
                  <span>{order.shipping_info?.name || "N/A"}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold min-w-[120px]">Số điện thoại:</span>
                  <span>{order.shipping_info?.phone || "N/A"}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold min-w-[120px]">Địa chỉ:</span>
                  <span>{order.shipping_info?.address || "N/A"}</span>
                </div>
                {order.notes && (
                  <div className="flex items-start gap-2">
                    <span className="font-semibold min-w-[120px]">Ghi chú:</span>
                    <span className="text-gray-600">{order.notes}</span>
                  </div>
                )}
                {order.tracking_number && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="font-semibold">Mã vận đơn:</span>{" "}
                    <span className="text-blue-600 font-mono">{order.tracking_number}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Order History */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span>📝</span>
                Lịch sử đơn hàng
              </h2>
              <div className="space-y-4">
                {/* Đặt hàng - Always shown */}
                <div className="flex items-start gap-4">
                  <div className="w-4 h-4 rounded-full mt-1 bg-green-500 flex-shrink-0"></div>
                  <div className="flex-1 pb-4 border-b">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-800">Đặt hàng</h4>
                      <span className="text-sm text-gray-500">
                        - lúc {formatDate(order.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Đơn hàng đã được tạo thành công</p>
                  </div>
                </div>

                {/* Xác nhận & Chuẩn bị - Show if not cancelled */}
                {order.status !== 'cancelled' && order.status !== 'cancel_request' && (
                  <div className="flex items-start gap-4">
                    <div className={`w-4 h-4 rounded-full mt-1 flex-shrink-0 ${['confirmed', 'processing', 'shipped', 'delivered'].includes(order.status)
                        ? "bg-green-500"
                        : "bg-gray-300"
                      }`}></div>
                    <div className="flex-1 pb-4 border-b">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-medium ${['confirmed', 'processing', 'shipped', 'delivered'].includes(order.status)
                            ? "text-gray-800"
                            : "text-gray-500"
                          }`}>
                          Xác nhận & Chuẩn bị
                        </h4>
                        {order.confirmed_at && ['confirmed', 'processing', 'shipped', 'delivered'].includes(order.status) && (
                          <span className="text-sm text-gray-500">
                            - lúc {formatDate(order.confirmed_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Đơn hàng đã được xác nhận và đang chuẩn bị
                      </p>
                    </div>
                  </div>
                )}

                {/* Giao hàng - Show if not cancelled */}
                {order.status !== 'cancelled' && order.status !== 'cancel_request' && (
                  <div className="flex items-start gap-4">
                    <div className={`w-4 h-4 rounded-full mt-1 flex-shrink-0 ${['shipped', 'delivered'].includes(order.status)
                        ? "bg-green-500"
                        : "bg-gray-300"
                      }`}></div>
                    <div className="flex-1 pb-4 border-b">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-medium ${['shipped', 'delivered'].includes(order.status)
                            ? "text-gray-800"
                            : "text-gray-500"
                          }`}>
                          Giao hàng
                        </h4>
                        {order.shipped_at && ['shipped', 'delivered'].includes(order.status) && (
                          <span className="text-sm text-gray-500">
                            - lúc {formatDate(order.shipped_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Đơn hàng đang được vận chuyển
                      </p>
                    </div>
                  </div>
                )}

                {/* Hoàn thành - Show if delivered */}
                {order.status === 'delivered' && (
                  <div className="flex items-start gap-4">
                    <div className="w-4 h-4 rounded-full mt-1 bg-green-500 flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-800">Hoàn thành</h4>
                        {order.delivered_at && (
                          <span className="text-sm text-gray-500">
                            - lúc {formatDate(order.delivered_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Đơn hàng đã được giao thành công
                      </p>
                    </div>
                  </div>
                )}

                {/* Đã hủy - Show if cancelled */}
                {(order.status === 'cancelled' || order.status === 'cancel_request') && (
                  <div className="flex items-start gap-4">
                    <div className="w-4 h-4 rounded-full mt-1 bg-red-500 flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-800">
                          {order.status === 'cancel_request' ? 'Yêu cầu hủy' : 'Đã hủy'}
                        </h4>
                        {order.cancelled_at && (
                          <span className="text-sm text-gray-500">
                            - lúc {formatDate(order.cancelled_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {order.cancel_reason || "Đơn hàng đã bị hủy"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>💳</span>
                Thông tin thanh toán
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tổng tiền hàng:</span>
                  <span className="font-medium">{formatCurrency(order.subtotal || order.total_amount)}</span>
                </div>
                {order.shipping_fee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phí vận chuyển:</span>
                    <span className="font-medium">{formatCurrency(order.shipping_fee)}</span>
                  </div>
                )}
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá:</span>
                    <span className="font-medium">-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                {order.freeship_value > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>Miễn phí vận chuyển:</span>
                    <span className="font-medium">-{formatCurrency(order.freeship_value)}</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                  <span>Tổng cộng:</span>
                  <span className="text-green-600">{formatCurrency(order.total_amount)}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Phương thức thanh toán:</span>
                  <span className="font-medium capitalize">{order.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trạng thái thanh toán:</span>
                  <span className={`font-medium ${order.payment_status === "paid" ? "text-green-600" : "text-orange-600"
                    }`}>
                    {order.payment_status === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
                  </span>
                </div>
                {order.payment_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày thanh toán:</span>
                    <span className="font-medium">{formatDate(order.payment_date)}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-3">
                {canCancel && (
                  <button
                    onClick={handleCancelOrder}
                    className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium cursor-pointer"
                  >
                    ❌ Hủy đơn hàng
                  </button>
                )}
                {canRequestCancel && (
                  <button
                    onClick={handleOpenCancelModal}
                    className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium cursor-pointer"
                  >
                    🔄 Yêu cầu hủy đơn
                  </button>
                )}
                {canReorder && (
                  <button
                    onClick={handleReorder}
                    disabled={isReordering} 
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isReordering ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang xử lý...</span>
                      </>
                    ) : (
                      <>
                        <span>🔄</span>
                        <span>Đặt lại đơn hàng</span>
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={() => navigate("/user/orders")}
                  className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium cursor-pointer"
                >
                  📋 Quay lại danh sách
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <CancelOrderModal
        isOpen={showCancelModal}
        onClose={handleCloseCancelModal}
        onSubmit={handleSubmitCancelRequest}
        orderNumber={order?.order_number || order?._id?.slice(-8).toUpperCase()}
        orderId={orderId}
      />
    </main>
  );
};

export default OrderDetailPage;