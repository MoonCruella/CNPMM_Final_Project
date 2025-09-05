import React, { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import OrderDetailModal from "./modal/OrderDetailModal";
const OrderItemRow = ({ order, onCancelOrder, onReorder }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showModal, setShowModal] = useState(false); 
   

  // ✅ Memoize computed values
  const computedValues = useMemo(() => {
    // Helper functions
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const formatCurrency = (amount) => {
      return Number(amount).toLocaleString('vi-VN') + '₫';
    };

    const getStatusColor = (status) => {
      const colors = {
        pending: 'bg-yellow-100 text-yellow-800',
        processing: 'bg-blue-100 text-blue-800',
        shipped: 'bg-purple-100 text-purple-800',
        delivered: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800'
      };
      return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusText = (status) => {
      const texts = {
        pending: 'Chờ xác nhận',
        processing: 'Đang xử lý',
        shipped: 'Đang giao',
        delivered: 'Đã giao',
        cancelled: 'Đã hủy'
      };
      return texts[status] || status;
    };

    // Check capabilities
    const canCancel = ['pending', 'processing'].includes(order.status);
    const canReorder = ['delivered', 'cancelled'].includes(order.status);

    return {
      formatDate,
      formatCurrency,
      getStatusColor,
      getStatusText,
      canCancel,
      canReorder
    };
  }, [order.status]);

  const { formatDate, formatCurrency, getStatusColor, getStatusText, canCancel, canReorder } = computedValues;

  // ✅ Memoize image getter function
  const getPrimaryImage = useCallback((item) => {
    const images = item.product_id?.images;
    if (!images || !Array.isArray(images)) return '/placeholder-product.jpg';
    
    const primaryImage = images.find(img => img.is_primary);
    return primaryImage?.image_url || images[0]?.image_url || '/placeholder-product.jpg';
  }, []);

  // ✅ Memoize handlers
  const handleToggleDetails = useCallback(() => {
    setShowDetails(prev => !prev);
  }, []);

  const handleCancelOrder = useCallback(() => {
    onCancelOrder(order._id);
  }, [order._id, onCancelOrder]);

  const handleReorder = useCallback(() => {
    onReorder(order._id);
  }, [order._id, onReorder]);

  const handleShowModal = useCallback(() => {
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
  }, []);

  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
        {/* Order Info */}
        <td className="py-4 px-4">
          <div>
            <p className="font-medium text-gray-800">#{order.order_number || order._id?.slice(-8)}</p>
            <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
            <button
              onClick={handleToggleDetails}
              className="text-xs text-green-600 hover:text-green-700 mt-1 flex items-center gap-1"
            >
              {showDetails ? '▼' : '▶'} Chi tiết
            </button>
          </div>
        </td>

        {/* Products */}
        <td className="py-4 px-4">
          <div className="space-y-1">
            {order.items?.slice(0, 2).map((item, index) => {
              const imageUrl = getPrimaryImage(item);
              
              return (
                <div key={`${item._id || index}-${item.product_id?._id}`} className="flex items-center gap-2">
                  <img
                    src={imageUrl}
                    alt={item.product_id?.name || 'Product'}
                    className="w-8 h-8 rounded object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = '/placeholder-product.jpg';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {item.product_id?.name || 'Sản phẩm'}
                    </p>
                    <p className="text-xs text-gray-500">
                      SL: {item.quantity} × {formatCurrency(item.price)}
                    </p>
                  </div>
                </div>
              );
            })}
            {order.items?.length > 2 && (
              <p className="text-xs text-gray-500 mt-1">
                +{order.items.length - 2} sản phẩm khác
              </p>
            )}
          </div>
        </td>

        {/* Status */}
        <td className="py-4 px-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
            {getStatusText(order.status)}
          </span>
          {order.tracking_number && (
            <p className="text-xs text-gray-500 mt-1">
              Mã vận đơn: {order.tracking_number}
            </p>
          )}
        </td>

        {/* Total */}
        <td className="py-4 px-4 text-right">
          <p className="font-semibold text-lg text-gray-800">
            {formatCurrency(order.total_amount)}
          </p>
          {order.discount_amount > 0 && (
            <p className="text-xs text-gray-500">
              Giảm: -{formatCurrency(order.discount_amount)}
            </p>
          )}
        </td>

        {/* Actions */}
        <td className="py-4 px-4 text-center">
          <div className="flex flex-col gap-1">
            <Link
              onClick={handleShowModal}
              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition"
            >
              👁️ Xem
            </Link>
            
            {canCancel && (
              <button
                onClick={handleCancelOrder}
                className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 transition"
              >
                ❌ Hủy
              </button>
            )}
            
            {canReorder && (
              <button
                onClick={handleReorder}
                className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition"
              >
                🔄 Đặt lại
              </button>
            )}
          </div>
        </td>
      </tr>
      <OrderDetailModal
        order={order}
        isOpen={showModal}
        onClose={handleCloseModal}
        onCancelOrder={onCancelOrder}
        onReorder={onReorder}
      />

      {/* Expandable Details Row */}
      {showDetails && (
        <tr className="bg-gray-50">
          <td colSpan="5" className="py-4 px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {/* Shipping Address */}
              <div>
                <h4 className="font-medium text-gray-800 mb-2">📍 Địa chỉ giao hàng</h4>
                <div className="text-gray-600">
                  <p>{order.shipping_info?.name}</p>
                  <p>{order.shipping_info?.phone}</p>
                  <p>{order.shipping_info?.address}</p>
                </div>
              </div>

              {/* Payment Info */}
              <div>
                <h4 className="font-medium text-gray-800 mb-2">💳 Thanh toán</h4>
                <div className="text-gray-600">
                  <p>Phương thức: {order.payment_method}</p>
                  <p>Trạng thái: {order.payment_status || 'pending'}</p>
                  {order.payment_date && (
                    <p>Ngày TT: {formatDate(order.payment_date)}</p>
                  )}
                </div>
              </div>

              {/* Order Timeline */}
              <div>
                <h4 className="font-medium text-gray-800 mb-2">📋 Lịch sử</h4>
                <div className="text-gray-600 space-y-1">
                  <p>Tạo: {formatDate(order.created_at)}</p>
                  {order.confirmed_at && (
                    <p>Xác nhận: {formatDate(order.confirmed_at)}</p>
                  )}
                  {order.shipped_at && (
                    <p>Giao hàng: {formatDate(order.shipped_at)}</p>
                  )}
                  {order.delivered_at && (
                    <p>Hoàn thành: {formatDate(order.delivered_at)}</p>
                  )}
                </div>
              </div>
            </div>

            {order.notes && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Ghi chú:</strong> {order.notes}
                </p>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
};

// ✅ Custom comparison function
const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.order._id === nextProps.order._id &&
    prevProps.order.status === nextProps.order.status &&
    prevProps.onCancelOrder === nextProps.onCancelOrder &&
    prevProps.onReorder === nextProps.onReorder
  );
};

export default React.memo(OrderItemRow, areEqual);