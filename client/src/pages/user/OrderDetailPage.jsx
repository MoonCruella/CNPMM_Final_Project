import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useUserContext } from "@/context/UserContext";
import { useCartContext } from "@/context/CartContext";
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

  //  Tính thời gian đã trôi qua
  const timeElapsed = useMemo(() => {
    if (!order?.created_at) return 0;
    return Date.now() - new Date(order.created_at).getTime();
  }, [order?.created_at]);

  const thirtyMinutes = 30 * 60 * 1000;

  //  Check xem có thể hủy trực tiếp không
  const canDirectCancel = useMemo(() => {
    if (!order) return false;
    return ["pending", "confirmed"].includes(order.status) && timeElapsed <= thirtyMinutes;
  }, [order, timeElapsed, thirtyMinutes]);

  //  Check xem có thể gửi yêu cầu hủy không
  const canRequestCancel = useMemo(() => {
    if (!order) return false;
    return (
      (["pending", "confirmed"].includes(order.status) && timeElapsed > thirtyMinutes) ||
      order.status === "processing"
    );
  }, [order, timeElapsed, thirtyMinutes]);

  //  Check xem có thể đặt lại không
  const canReorder = useMemo(() => {
    if (!order) return false;
    return ["delivered", "cancelled"].includes(order.status);
  }, [order]);

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
        navigate("/user/orders");
      }
    } catch (error) {
      console.error("Load order detail error:", error);
      toast.error("Có lỗi xảy ra khi tải đơn hàng");
      navigate("/user/orders");
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
      delivered: { label: "Đã giao", color: "bg-green-100 text-green-800", icon: "✅" },
      cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800", icon: "❌" },
      cancel_request: { label: "Yêu cầu hủy", color: "bg-orange-100 text-orange-800", icon: "🔄" },
    };
    return statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800", icon: "📦" };
  };

  //  Get product image from hardcoded data
  const getProductImage = (item) => {
    return item.product_image || "/placeholder-product.jpg";
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
        setShowCancelModal(false);
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

  const handleReorder = async () => {
    if (isReordering) return;

    try {
      setIsReordering(true);

      const response = await orderService.reorder(orderId);

      if (response.success) {
        toast.success("Đã thêm sản phẩm vào giỏ hàng");

        try {
          await fetchCart();
          await new Promise((resolve) => setTimeout(resolve, 300));
          navigate("/cart");
        } catch (fetchError) {
          console.error("Cart fetch error:", fetchError);
          navigate("/cart");
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
            to="/user/orders"
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Quay lại danh sách
          </Link>
        </div>
      </main>
    );
  }

  const statusInfo = getStatusInfo(order.status);

  return (
    <main className="space-y-6">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link to="/" className="hover:text-green-600">
            Trang chủ
          </Link>
          <span>/</span>
          <Link to="/user/orders" className="hover:text-green-600">
            Đơn hàng của tôi
          </Link>
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
                  Mã đơn:{" "}
                  <span className="font-semibold text-green-600">
                    #{order.order_number || order._id?.slice(-8).toUpperCase()}
                  </span>
                </p>
              </div>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${statusInfo.color}`}
            >
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
                  const imageUrl = getProductImage(item);
                  const productName = item.product_name || "Sản phẩm";
                  const isDeleted = item.product_deleted || !item.product_exists;
                  
                  return (
                    <div key={item._id || index} className="flex gap-4 pb-4 border-b last:border-b-0">
                      <div className="w-20 h-20 flex-shrink-0">
                        <img
                          src={imageUrl}
                          alt={productName}
                          className="w-full h-full object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            e.target.src = "/placeholder-product.jpg";
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          {/*  Luôn hiển thị như link bình thường, không phân biệt deleted */}
                          {isDeleted ? (
                            <span className="font-medium text-gray-800 line-clamp-2">
                              {productName}
                            </span>
                          ) : (
                            <Link
                              to={`/products/${item.product_id}`}
                              className="font-medium text-gray-800 hover:text-green-600 line-clamp-2 block"
                            >
                              {productName}
                            </Link>
                          )}
                        </div>
                        {item.category_name && (
                          <div className="text-xs text-gray-500 mb-1">
                            📁 {item.category_name}
                          </div>
                        )}
                        {item.product_description && (
                          <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                            {item.product_description}
                          </p>
                        )}
                        <div className="text-sm text-gray-600 mb-2">
                          <p>Số lượng: {item.quantity} {item.unit || ""}</p>
                          {item.sku && <p className="text-xs">SKU: {item.sku}</p>}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          {item.was_on_sale && item.original_price > item.price && (
                            <span className="text-sm text-gray-400 line-through">
                              {formatCurrency(item.original_price)}
                            </span>
                          )}
                          <span className="font-semibold text-green-600">
                            {formatCurrency(item.price)}
                          </span>
                          {item.discount_percent > 0 && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">
                              -{item.discount_percent}%
                            </span>
                          )}
                          <span className="text-sm text-gray-500">
                            = {formatCurrency(item.total)}
                          </span>
                          {item.was_featured && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">
                              ⭐ Nổi bật
                            </span>
                          )}
                        </div>
                        {item.hometown_origin?.province && (
                          <div className="mt-1 text-xs text-blue-600">
                            📍 Xuất xứ: {item.hometown_origin.province}
                            {item.hometown_origin.district && `, ${item.hometown_origin.district}`}
                          </div>
                        )}
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

            {/* Order Timeline */}
            {order.timeline && order.timeline.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span>📝</span>
                  Lịch sử đơn hàng
                </h2>
                <div className="space-y-4">
                  {order.timeline.map((step, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div
                        className={`w-4 h-4 rounded-full mt-1 flex-shrink-0 ${
                          step.completed ? "bg-green-500" : "bg-gray-300"
                        }`}
                      ></div>
                      <div className={`flex-1 ${index < order.timeline.length - 1 ? "pb-4 border-b" : ""}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <h4
                            className={`font-medium ${
                              step.completed ? "text-gray-800" : "text-gray-500"
                            }`}
                          >
                            {step.label}
                          </h4>
                          {step.date && (
                            <span className="text-sm text-gray-500">- lúc {formatDate(step.date)}</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                  <span className="font-medium">{formatCurrency(order.subtotal)}</span>
                </div>
                {order.shipping_fee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phí vận chuyển:</span>
                    <span className="font-medium">{formatCurrency(order.shipping_fee)}</span>
                  </div>
                )}
                {order.freeship_value > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>Miễn phí vận chuyển:</span>
                    <span className="font-medium">-{formatCurrency(order.freeship_value)}</span>
                  </div>
                )}
                {order.discount_value > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá:</span>
                    <span className="font-medium">-{formatCurrency(order.discount_value)}</span>
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
                  <span
                    className={`font-medium ${
                      order.payment_status === "paid" ? "text-green-600" : "text-orange-600"
                    }`}
                  >
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
                {/*  Hiển thị nút hủy trực tiếp nếu trong vòng 30 phút */}
                {canDirectCancel && (
                  <button
                    onClick={handleCancelOrder}
                    className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium cursor-pointer"
                  >
                    ❌ Hủy đơn hàng
                  </button>
                )}

                {/*  Hiển thị nút gửi yêu cầu hủy nếu đã quá 30 phút hoặc đang processing */}
                {canRequestCancel && (
                  <button
                    onClick={handleOpenCancelModal}
                    className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium cursor-pointer"
                  >
                    🔄 Gửi yêu cầu hủy đơn
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