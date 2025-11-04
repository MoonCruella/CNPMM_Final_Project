import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import orderService from "@/services/order.service";

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadOrderDetail = useCallback(async () => {
    if (!orderId) return;
    
    try {
      setIsLoading(true);
      const response = await orderService.getOrderById(orderId);
      if (response.success) {
        setOrder(response.data.order);
      } else {
        toast.error("Không thể tải thông tin đơn hàng");
        navigate(-1);
      }
    } catch (error) {
      console.error("Load order error:", error);
      toast.error("Có lỗi xảy ra khi tải đơn hàng");
      navigate(-1);
    } finally {
      setIsLoading(false);
    }
  }, [orderId, navigate]);

  useEffect(() => {
    loadOrderDetail();
  }, [loadOrderDetail]);

  const handleUpdateStatus = async (newStatus) => {
    if (!window.confirm(`Bạn có chắc muốn cập nhật trạng thái đơn hàng thành "${getStatusBadge(newStatus).props.children}"?`)) {
      return;
    }

    try {
      setIsUpdating(true);
      const response = await orderService.updateShippingStatus(orderId, newStatus);
      if (response.success) {
        toast.success("Cập nhật trạng thái thành công!");
        await loadOrderDetail();
      } else {
        toast.error(response.message || "Cập nhật thất bại!");
      }
    } catch (error) {
      console.error("Update status error:", error);
      toast.error("Có lỗi xảy ra khi cập nhật trạng thái!");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-700" },
      confirmed: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-700" },
      processing: { label: "Đang xử lý", color: "bg-purple-100 text-purple-700" },
      shipped: { label: "Đang giao", color: "bg-indigo-100 text-indigo-700" },
      delivered: { label: "Đã giao", color: "bg-green-100 text-green-700" },
      cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-700" },
      cancel_request: { label: "Yêu cầu hủy", color: "bg-orange-100 text-orange-700" },
    };
    const config = statusConfig[status] || { label: status, color: "bg-gray-100 text-gray-700" };
    return (
      <span className={`px-4 py-2 rounded-full text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  //  Get product image from hardcoded data
  const getProductImage = (item) => {
    return item.product_image || "/placeholder-product.jpg";
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      pending: "confirmed",
      confirmed: "processing",
      processing: "shipped",
      shipped: "delivered",
      cancel_request: "cancelled",
    };
    return statusFlow[currentStatus];
  };

  const getNextStatusLabel = (currentStatus) => {
    const labels = {
      pending: "Xác nhận đơn",
      confirmed: "Bắt đầu xử lý",
      processing: "Giao hàng",
      shipped: "Hoàn thành",
      cancel_request: "Hủy đơn",
    };
    return labels[currentStatus];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Không tìm thấy đơn hàng</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 cursor-pointer"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-gray-50 min-h-screen">
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Header */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    #{order.order_number}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Đặt lúc: {formatDate(order.created_at)}
                  </p>
                </div>
                {getStatusBadge(order.status)}
              </div>

              {/* Cancel Reason Alert */}
              {(order.status === "cancel_request" || order.status === "cancelled") && order.cancel_reason && (
                <div className="mb-4 p-4 bg-orange-50 border-l-4 border-orange-500 rounded">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-orange-800 mb-1">
                        {order.status === "cancel_request" ? "Lý do yêu cầu hủy đơn:" : "Lý do hủy đơn:"}
                      </h4>
                      <p className="text-sm text-orange-700">
                        {order.cancel_reason}
                      </p>
                      {order.cancel_requested_at && (
                        <p className="text-xs text-orange-600 mt-1">
                          Yêu cầu lúc: {formatDate(order.cancel_requested_at)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Status Update Buttons */}
              {user?.role === "seller" && !["delivered", "cancelled"].includes(order.status) && (
                <div className="flex items-center gap-2">
                  {getNextStatus(order.status) && (
                    <button
                      onClick={() => handleUpdateStatus(getNextStatus(order.status))}
                      disabled={isUpdating}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition text-sm whitespace-nowrap cursor-pointer"
                    >
                      {isUpdating ? "⏳ Đang cập nhật..." : `✓ ${getNextStatusLabel(order.status)}`}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-bold mb-4">Sản phẩm ({order.items?.length || 0})</h3>
              <div className="space-y-4">
                {order.items?.map((item, index) => {
                  const imageUrl = getProductImage(item);
                  const productName = item.product_name || "Sản phẩm";
                  const isDeleted = item.product_deleted || !item.product_exists;
                  
                  return (
                    <div key={item._id || index} className="flex gap-4 p-4 border rounded-lg hover:bg-gray-50 transition">
                      {/*  Loại bỏ overlay "Đã xóa" */}
                      <div className="w-20 h-20 flex-shrink-0">
                        <img
                          src={imageUrl}
                          alt={productName}
                          className="w-full h-full object-cover rounded border border-gray-200"
                          onError={(e) => {
                            e.target.src = "/placeholder-product.jpg";
                          }}
                        />
                      </div>
                      
                      <div className="flex-1">
                        {/*  Hiển thị tên sản phẩm bình thường */}
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-medium text-gray-800">
                            {productName}
                          </h4>
                        </div>
                        
                        {item.category_name && (
                          <p className="text-xs text-gray-500 mb-1">
                            📁 {item.category_name}
                          </p>
                        )}
                        
                        {item.sku && (
                          <p className="text-xs text-gray-400 mb-1">
                            SKU: {item.sku}
                          </p>
                        )}
                        
                        <p className="text-sm text-gray-500 mb-2">
                          Số lượng: {item.quantity} {item.unit || ""}
                        </p>
                        
                        <div className="flex items-center gap-3 flex-wrap">
                          {item.was_on_sale && item.original_price > item.price && (
                            <span className="text-sm text-gray-400 line-through">
                              {formatCurrency(item.original_price)}
                            </span>
                          )}
                          <span className="text-sm text-gray-600">
                            Đơn giá: {formatCurrency(item.price)}
                          </span>
                          {item.discount_percent > 0 && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">
                              -{item.discount_percent}%
                            </span>
                          )}
                        </div>
                        
                        {item.was_featured && (
                          <div className="mt-2">
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">
                              ⭐ Nổi bật
                            </span>
                          </div>
                        )}
                        
                        {item.hometown_origin?.province && (
                          <div className="mt-1 text-xs text-blue-600">
                            📍 Xuất xứ: {item.hometown_origin.province}
                            {item.hometown_origin.district && `, ${item.hometown_origin.district}`}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {formatCurrency(item.total)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shipping Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>📍</span>
                Thông tin giao hàng
              </h3>
              <div className="space-y-2">
                <p className="text-gray-700">
                  <span className="font-medium">Người nhận:</span>{" "}
                  {order.shipping_info?.name || "N/A"}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Email:</span>{" "}
                  {order.user_id?.email || "N/A"}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Số điện thoại:</span>{" "}
                  {order.shipping_info?.phone || "N/A"}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Địa chỉ:</span>{" "}
                  {order.shipping_info?.address || "N/A"}
                </p>
                {order.notes && (
                  <p className="text-gray-700">
                    <span className="font-medium">Ghi chú:</span> {order.notes}
                  </p>
                )}
                {order.tracking_number && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm">
                      <span className="font-medium">Mã vận đơn:</span>{" "}
                      <span className="text-blue-600 font-mono">{order.tracking_number}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Timeline */}
            {order.timeline && order.timeline.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span>📝</span>
                  Lịch sử đơn hàng
                </h3>
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
                            <span className="text-sm text-gray-500">
                              - lúc {formatDate(step.date)}
                            </span>
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

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>💳</span>
                Tổng quan đơn hàng
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-700">
                  <span>Tổng tiền hàng:</span>
                  <span className="font-medium">{formatCurrency(order.subtotal)}</span>
                </div>
                
                {order.shipping_fee > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Phí vận chuyển:</span>
                    <span className="font-medium">{formatCurrency(order.shipping_fee)}</span>
                  </div>
                )}
                
                {order.freeship_value > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>Miễn phí ship:</span>
                    <span className="font-medium">-{formatCurrency(order.freeship_value)}</span>
                  </div>
                )}
                
                {order.discount_value > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá:</span>
                    <span className="font-medium">-{formatCurrency(order.discount_value)}</span>
                  </div>
                )}
                
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Tổng cộng:</span>
                    <span className="text-green-600">
                      {formatCurrency(order.total_amount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Phương thức thanh toán:</span>
                  <span className="font-medium capitalize">
                    {order.payment_method === "cod" && "COD"}
                    {order.payment_method === "bank_transfer" && "Chuyển khoản"}
                    {order.payment_method === "vnpay" && "VNPay"}
                    {order.payment_method === "momo" && "MoMo"}
                    {order.payment_method === "zalopay" && "ZaloPay"}
                  </span>
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

              <button
                onClick={() => navigate("/seller/orders")}
                className="w-full mt-6 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition cursor-pointer font-medium"
              >
                📋 Quay lại danh sách
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default OrderDetail;