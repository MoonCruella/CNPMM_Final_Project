import React, { useState, useEffect, useRef } from "react";
import { useUserContext } from "../../context/UserContext.jsx";
import { toast } from "sonner";
import { useAddressContext } from "@/context/AddressContext";
import AddressModal from "@/components/user/modal/AddressModal.jsx";
import AddressItem from "@/components/user/item/AddressItem.jsx";
import { assets } from "@/assets/assets";
const ProfilePage = () => {
  const {
    user,
    isLoading,
    isUpdating,
    isUploadingAvatar,
    updateUserProfile,
    uploadAvatar,
    updateUserWithAvatar,
    getUserDisplayName,
    getUserAvatarUrl,
    isActiveUser,
    isAdmin,
    formatAddress,
    createAddressObject,
  } = useUserContext();
  const {
    addresses,
    loadAddresses,
    addAddress,
    updateAddress,
    removeAddress,
    selectedAddress,
    setSelectedAddress,
    paymentMethod,
    setPaymentMethod,
  } = useAddressContext();

  const [showModal, setShowModal] = useState(false);
  const [editAddress, setEditAddress] = useState(null);

  const [isEditing, setIsEditing] = useState(false);

  // ✅ Avatar upload states
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const avatarInputRef = useRef(null);

  // ✅ Form data state
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    address: {
      street: "",
      ward: "",
      district: "",
      province: "", // ✅ Sử dụng province
      full_address: "",
    },
  });

  // load danh sách địa chỉ khi mở trang
  useEffect(() => {
    loadAddresses();
  }, []);

  // Lưu địa chỉ (thêm hoặc sửa)
  const handleSaveAddress = async (data) => {
    if (editAddress) {
      await updateAddress(editAddress._id, data);
    } else {
      await addAddress(data);
    }
    setShowModal(false);
    setEditAddress(null);
  };

  // Load user data into form
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        username: user.username || "",
        phone: user.phone || "",
        date_of_birth: user.date_of_birth
          ? user.date_of_birth.split("T")[0]
          : "",
        gender: user.gender || "",
        address: {
          street: user.address?.street || "",
          ward: user.address?.ward || "",
          district: user.address?.district || "",
          province: user.address?.province || "", // ✅ province
          full_address: user.address?.full_address || "",
        },
      });
    }
  }, [user]);

  // ✅ Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // ✅ Handle avatar file selection
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      // Validate file
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)");
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("Kích thước file quá lớn. Tối đa 5MB");
        return;
      }

      setAvatarFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // ✅ Handle avatar upload only
  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      toast.error("Vui lòng chọn ảnh trước");
      return;
    }

    try {
      await uploadAvatar(avatarFile);

      // Reset avatar states
      setAvatarFile(null);
      setAvatarPreview(null);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
    } catch (error) {
      // Error handled in context
    }
  };

  // ✅ Cancel avatar selection
  const handleCancelAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  };

  // ✅ Handle save profile
  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Tên không được để trống");
      return;
    }

    if (formData.phone && !/^\d{10,11}$/.test(formData.phone)) {
      toast.error("Số điện thoại không hợp lệ");
      return;
    }

    try {
      const updateData = {
        name: formData.name.trim(),
        username: formData.username.trim() || null,
        phone: formData.phone.trim() || null,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        address: createAddressObject(formData.address),
      };

      if (avatarFile) {
        // Update profile with avatar
        await updateUserWithAvatar(updateData, avatarFile);

        // Reset avatar states
        setAvatarFile(null);
        setAvatarPreview(null);
        if (avatarInputRef.current) {
          avatarInputRef.current.value = "";
        }
      } else {
        // Update profile only
        await updateUserProfile(updateData);
      }

      setIsEditing(false);
    } catch (error) {
      // Error handled in context
    }
  };

  // ✅ Toggle edit mode
  const toggleEdit = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      // Reset form when canceling
      setFormData({
        name: user.name || "",
        username: user.username || "",
        phone: user.phone || "",
        date_of_birth: user.date_of_birth
          ? user.date_of_birth.split("T")[0]
          : "",
        gender: user.gender || "",
        address: {
          street: user.address?.street || "",
          ward: user.address?.ward || "",
          district: user.address?.district || "",
          province: user.address?.province || "",
          full_address: user.address?.full_address || "",
        },
      });
      handleCancelAvatar();
    }
  };

  // ✅ Get current avatar URL
  const getAvatarUrl = () => {
    if (avatarPreview) return avatarPreview;
    return getUserAvatarUrl(200);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Không tìm thấy thông tin người dùng</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with Avatar */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* ✅ Avatar Section */}
            <div className="relative group">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-green-500 relative">
                <img
                  src={getAvatarUrl()}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = getUserAvatarUrl(200);
                  }}
                />

                {/* Upload Overlay */}
                <div
                  className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <span className="text-white text-sm font-medium">
                    📷 Đổi ảnh
                  </span>
                </div>
              </div>

              {/* Upload Progress */}
              {isUploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 rounded-full">
                  <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              {/* Hidden File Input */}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={isUploadingAvatar}
              />
            </div>

            {/* User Info */}
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                {getUserDisplayName()}
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">{user.email}</p>
              <div className="flex items-center space-x-2 my-3">
                <img src={assets.coin_icon} className="h-6 w-6" />
                <p className=" text-sm sm:text-base text-black">
                  Xu tích lũy: {user.coin}
                </p>
              </div>

              {/* Address Display */}
              {/* {formatAddress() && (
                <p className="text-gray-500 text-sm mt-1">
                  📍 {formatAddress()}
                </p>
              )} */}

              {/* Badges */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isAdmin()
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {user.role === "admin" ? "Admin" : "User"}
                </span>

                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isActiveUser()
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {isActiveUser() ? "Hoạt động" : "Bị khóa"}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {/* ✅ Avatar Action Buttons */}
              {avatarFile && (
                <div className="flex gap-2 mr-2">
                  <button
                    onClick={handleCancelAvatar}
                    disabled={isUploadingAvatar}
                    className="px-3 py-1 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleAvatarUpload}
                    disabled={isUploadingAvatar}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-1"
                  >
                    {isUploadingAvatar && (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {isUploadingAvatar ? "Đang tải..." : "Lưu ảnh"}
                  </button>
                </div>
              )}

              {/* Main Action Buttons */}
              {isEditing ? (
                <>
                  <button
                    onClick={toggleEdit}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {isUpdating && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {isUpdating ? "Đang lưu..." : "Lưu"}
                  </button>
                </>
              ) : (
                <button
                  onClick={toggleEdit}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
                >
                  Chỉnh sửa
                </button>
              )}
            </div>
          </div>

          {/* ✅ Avatar Preview Message */}
          {avatarPreview && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700 text-sm">
                📷 Ảnh đại diện mới đã được chọn. Nhấn "Lưu ảnh" để cập nhật
                riêng hoặc "Lưu" để cập nhật cùng thông tin khác.
              </p>
            </div>
          )}
        </div>

        {/* ✅ Profile Form */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Thông tin cá nhân
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Nhập tên của bạn"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên đăng nhập
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Nhập tên đăng nhập"
              />
            </div>

            {/* Email (readonly) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Nhập số điện thoại (10-11 số)"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngày sinh
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Giới tính
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="">Chọn giới tính</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6 mt-5">
          {/* Shipping Address */}
          <h4 className="text-lg font-semibold mb-4">Địa chỉ nhận hàng</h4>
          <div className="space-y-3">
            {addresses.length === 0 && (
              <p className="text-gray-500">
                Chưa có địa chỉ nào, vui lòng thêm mới.
              </p>
            )}

            {addresses.map((addr) => (
              <AddressItem
                key={addr._id}
                address={addr}
                showRadio={false}
                isDefault={addr.is_default}
                selected={selectedAddress?._id === addr._id} // thêm ? để tránh lỗi null
                onSelect={() => setSelectedAddress(addr)} // set toàn bộ object
                onEdit={(a) => {
                  setEditAddress(a);
                  setShowModal(true);
                }}
                onDelete={removeAddress}
              />
            ))}

            {/* Nút mở modal thêm địa chỉ */}
            <button
              type="button"
              onClick={() => {
                setEditAddress(null);
                setShowModal(true);
              }}
              className="px-4 py-2 mt-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              + Thêm địa chỉ mới
            </button>
          </div>

          {/* Modal Form */}
          {showModal && (
            <AddressModal
              isOpen={showModal}
              onClose={() => {
                setShowModal(false);
                setEditAddress(null);
              }}
              onSubmit={handleSaveAddress}
              addressToEdit={editAddress}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
