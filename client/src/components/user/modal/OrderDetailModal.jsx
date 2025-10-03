import React, { useMemo, useCallback } from "react";
import {
  X,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  CreditCard,
  FileText,
} from "lucide-react";

const OrderDetailModal = ({
  order,
  isOpen,
  onClose,
  onCancelOrder,
  onReorder,
}) => {
  // ✅ Memoize computed values
  const computedValues = useMemo(() => {
    if (!order) return {};

    console.log("Order in OrderDetailModal:", order);
    const formatDate = (dateString) => {
      if (!dateString) return null;
      return new Date(dateString).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const formatCurrency = (amount) => {
      return Number(amount).toLocaleString("vi-VN") + "₫";
    };

    const getStatusInfo = (status) => {
      const statusMap = {
        pending: {
          label: "Chờ xác nhận",
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: Clock,
          description: "Đơn hàng đang chờ được xác nhận",
        },
        processing: {
          label: "Đang xử lý",
          color: "bg-blue-100 text-blue-800 border-blue-200",
          icon: Package,
          description: "Đơn hàng đang được chuẩn bị",
        },
        shipped: {
          label: "Đang giao hàng",
          color: "bg-purple-100 text-purple-800 border-purple-200",
          icon: Truck,
          description: "Đơn hàng đang trên đường giao đến bạn",
        },
        delivered: {
          label: "Đã giao thành công",
          color: "bg-green-100 text-green-800 border-green-200",
          icon: CheckCircle,
          description: "Đơn hàng đã được giao thành công",
        },
        cancelled: {
          label: "Đã hủy",
          color: "bg-red-100 text-red-800 border-red-200",
          icon: XCircle,
          description: "Đơn hàng đã bị hủy",
        },
      };
      return statusMap[status] || statusMap.pending;
    };

    const getTimeline = () => {
      const timeline = [
        {
          status: "pending",
          label: "Đặt hàng",
          date: order.created_at,
          completed: true,
          description: "Đơn hàng đã được tạo thành công",
        },
      ];

      if (order.status !== "cancelled") {
        timeline.push(
          {
            status: "processing",
            label: "Xác nhận & Chuẩn bị",
            date: order.confirmed_at,
            completed: ["processing", "shipped", "delivered"].includes(
              order.status
            ),
            description: "Đơn hàng đã được xác nhận và đang chuẩn bị",
          },
          {
            status: "shipped",
            label: "Giao hàng",
            date: order.shipped_at,
            completed: ["shipped", "delivered"].includes(order.status),
            description: "Đơn hàng đang được vận chuyển",
          },
          {
            status: "delivered",
            label: "Hoàn thành",
            date: order.delivered_at,
            completed: order.status === "delivered",
            description: "Đơn hàng đã được giao thành công",
          }
        );
      } else {
        timeline.push({
          status: "cancelled",
          label: "Đã hủy",
          date: order.cancelled_at,
          completed: true,
          description: order.cancel_reason || "Đơn hàng đã bị hủy",
        });
      }

      return timeline;
    };

    const getPrimaryImage = (item) => {
      const images = item.product_id?.images;
      if (!images || !Array.isArray(images)) return "/placeholder-product.jpg";

      const primaryImage = images.find((img) => img.is_primary);
      return (
        primaryImage?.image_url ||
        images[0]?.image_url ||
        "/placeholder-product.jpg"
      );
    };

    const canCancel = ["pending", "processing"].includes(order.status);
    const canReorder = ["delivered", "cancelled"].includes(order.status);

    return {
      formatDate,
      formatCurrency,
      getStatusInfo,
      getTimeline,
      getPrimaryImage,
      canCancel,
      canReorder,
    };
  }, [order]);

  const {
    formatDate,
    formatCurrency,
    getStatusInfo,
    getTimeline,
    getPrimaryImage,
    canCancel,
    canReorder,
  } = computedValues;

  // ✅ Memoize handlers
  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const handleCancelOrder = useCallback(() => {
    onCancelOrder(order._id);
  }, [order?._id, onCancelOrder]);

  const handleReorder = useCallback(() => {
    onReorder(order._id);
  }, [order?._id, onReorder]);

  if (!isOpen || !order) return null;

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;
  const timeline = getTimeline();

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Chi tiết đơn hàng</h2>
              <p className="text-green-100">
                #{order.order_number || order._id?.slice(-8)}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Status & Timeline */}
          <div className="mb-8">
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${statusInfo.color} mb-4`}
            >
              <StatusIcon className="w-4 h-4" />
              <span className="font-medium">{statusInfo.label}</span>
            </div>
            <p className="text-gray-600 mb-6">{statusInfo.description}</p>

            {/* Timeline */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Lịch sử đơn hàng
              </h3>
              <div className="space-y-3">
                {timeline.map((step, index) => (
                  <div key={step.status} className="flex items-start gap-4">
                    <div
                      className={`w-4 h-4 rounded-full mt-1 ${
                        step.completed ? "bg-green-500" : "bg-gray-300"
                      }`}
                    ></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4
                          className={`font-medium ${
                            step.completed ? "text-gray-800" : "text-gray-500"
                          }`}
                        >
                          {step.label}
                        </h4>
                        {step.date && (
                          <span className="text-sm text-gray-500">
                            - {formatDate(step.date)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Shipping Info */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4" />
                Thông tin giao hàng
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Người nhận:</span>
                  <p className="font-medium">{order.shipping_info?.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Số điện thoại:</span>
                  <p className="font-medium">{order.shipping_info?.phone}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Địa chỉ:</span>
                  <p className="font-medium">{order.shipping_info?.address}</p>
                </div>
                {order.tracking_number && (
                  <div>
                    <span className="text-sm text-gray-500">Mã vận đơn:</span>
                    <p className="font-medium text-blue-600">
                      {order.tracking_number}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                <CreditCard className="w-4 h-4" />
                Thông tin thanh toán
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Phương thức:</span>
                  <p className="font-medium">{order.payment_method}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Trạng thái:</span>
                  <p className="font-medium">
                    {order.payment_status || "Chờ thanh toán"}
                  </p>
                </div>
                {order.payment_date && (
                  <div>
                    <span className="text-sm text-gray-500">
                      Ngày thanh toán:
                    </span>
                    <p className="font-medium">
                      {formatDate(order.payment_date)}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-500">Ngày đặt:</span>
                  <p className="font-medium">{formatDate(order.created_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
              <Package className="w-4 h-4" />
              Sản phẩm đã đặt ({order.items?.length || 0})
            </h3>
            <div className="space-y-4">
              {order.items?.map((item, index) => (
                <div
                  key={item._id || index}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl"
                >
                  <img
                    src={getPrimaryImage(item)}
                    alt={item.product_id?.name}
                    className="w-16 h-16 object-cover rounded-lg"
                    onError={(e) => {
                      e.target.src = "/placeholder-product.jpg";
                    }}
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">
                      {item.product_id?.name}
                    </h4>
                    <div className="mt-1 text-sm text-gray-600">
                      <p>Số lượng: {item.quantity}</p>
                      <p className="text-sm text-gray-500">
                        Đơn giá:{" "}
                        {item.sale_price ? (
                          <>
                            <span className="line-through text-gray-400">
                              {formatCurrency(item.price)}
                            </span>{" "}
                            <span className="text-green-700">
                              {formatCurrency(item.sale_price)}
                            </span>
                          </>
                        ) : (
                          <span className="text-green-700">
                            {formatCurrency(item.price)}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">
                      {formatCurrency(item.total)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-4">
              Tóm tắt đơn hàng
            </h3>
            <div className="space-y-2 ">
              <div className="flex justify-between">
                <span>Tổng tiền hàng</span>
                <span>
                  {" "}
                  {formatCurrency(
                    order.items?.reduce(
                      (acc, item) =>
                        acc +
                        (item.sale_price ? item.sale_price : item.price) *
                          item.quantity,
                      0
                    )
                  )}
                </span>
              </div>

              {/* show actual shipping fee after freeship */}
              <div className="flex justify-between">
                <span>Phí vận chuyển</span>
                <span>{formatCurrency(order.shipping_fee || 0)}</span>
              </div>

              {/* show freeship discount only when applicable */}
              {order.freeship_value > 0 && (
                <div className="flex justify-between">
                  <span>Giảm giá phí vận chuyển</span>
                  <span className="text-green-600">
                    -{formatCurrency(order.freeship_value || 0)}
                  </span>
                </div>
              )}

              {order.discount_value > 0 && (
                <div className="flex justify-between">
                  <span>Voucher giảm giá</span>
                  <span className="text-orange-600">
                    -{formatCurrency(order.discount_value || 0)}
                  </span>
                </div>
              )}
              <hr className="my-2" />
              <div className="flex justify-between text-lg font-semibold">
                <span>Tổng thanh toán</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4" />
                Ghi chú
              </h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-yellow-800">{order.notes}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 justify-end">
            {canCancel && (
              <button
                onClick={handleCancelOrder}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Hủy đơn hàng
              </button>
            )}

            {canReorder && (
              <button
                onClick={handleReorder}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              >
                <Package className="w-4 h-4" />
                Đặt lại
              </button>
            )}

            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(OrderDetailModal);
