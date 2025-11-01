import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { assets } from "@/assets/assets";
import { User, Mail, Phone, MapPin, Calendar, Shield, Eye, EyeOff } from "lucide-react";
import { setUser } from "@/redux/authSlice";
import userService from "@/services/user.service";
import { emitUserUpdated } from "@/utils/events";
import { useUserContext } from "@/context/UserContext"; // ✅ Import UserContext

const MyAccount = () => {
  const dispatch = useDispatch();
  const { user: reduxUser } = useSelector((state) => state.auth);

  // ✅ Use UserContext
  const {
    uploadAvatar,
    updateUserWithAvatar,
    isUploadingAvatar,
    getUserAvatarUrl,
  } = useUserContext();

  // States
  const [user, setUserState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Avatar states
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const avatarInputRef = useRef(null);

  // Profile form data
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    date_of_birth: "",
    gender: "",
  });

  // Password states
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loadingPassword, setLoadingPassword] = useState(false);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const response = await userService.getCurrentUser();
        
        if (response.success && response.user) {
          const userData = {
            _id: response.user.userId,
            email: response.user.email,
            name: response.user.name,
            role: response.user.role,
            coin: response.user.coin,
            active: response.user.active,
            phone: response.user.phone,
            gender: response.user.gender,
            date_of_birth: response.user.date_of_birth,
            avatar: response.user.avatar,
            avatar_public_id: response.user.avatar_public_id,
            created_at: response.user.created_at,
          };
          setUserState(userData);
        } else {
          toast.error("Không thể tải thông tin người dùng");
        }
      } catch (error) {
        console.error("Fetch user error:", error);
        toast.error("Lỗi tải thông tin người dùng");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Load user data into form
  useEffect(() => {
    if (user) {
      let formattedDate = "";
      if (user.date_of_birth) {
        try {
          const date = new Date(user.date_of_birth);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            formattedDate = `${year}-${month}-${day}`;
          }
        } catch (error) {
          console.error("Error parsing date:", error);
        }
      }

      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        date_of_birth: formattedDate,
        gender: user.gender || "",
      });
    }
  }, [user]);

  // Format date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "Chưa cập nhật";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Chưa cập nhật";
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Chưa cập nhật";
    }
  };

  // Get gender display
  const getGenderDisplay = (gender) => {
    const genderMap = {
      male: "Nam",
      female: "Nữ",
      other: "Khác",
    };
    return genderMap[gender] || "";
  };

  // ✅ Get avatar URL - Use UserContext method
  const getAvatarUrl = (size = 200) => {
    if (avatarPreview) {
      return avatarPreview;
    }

    if (user?.avatar) {
      return getUserAvatarUrl(size);
    }

    const name = user?.name || user?.email || "User";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff&size=${size}`;
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle password input change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // Handle avatar file selection
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
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

      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // ✅ Handle avatar upload only - Use UserContext uploadAvatar
  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      toast.error("Vui lòng chọn ảnh trước");
      return;
    }

    try {
      // ✅ Use uploadAvatar from UserContext
      await uploadAvatar(avatarFile);

      // ✅ Reload user data
      const userResponse = await userService.getCurrentUser();
      if (userResponse.success && userResponse.user) {
        const userData = {
          _id: userResponse.user.userId,
          email: userResponse.user.email,
          name: userResponse.user.name,
          role: userResponse.user.role,
          coin: userResponse.user.coin,
          active: userResponse.user.active,
          phone: userResponse.user.phone,
          gender: userResponse.user.gender,
          date_of_birth: userResponse.user.date_of_birth,
          avatar: userResponse.user.avatar,
          avatar_public_id: userResponse.user.avatar_public_id,
          created_at: userResponse.user.created_at,
        };
        setUserState(userData);
        dispatch(setUser(userData));
        emitUserUpdated();
      }

      setAvatarFile(null);
      setAvatarPreview(null);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload avatar error:", error);
      // Toast already shown by uploadAvatar
    }
  };

  // Cancel avatar selection
  const handleCancelAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  };

  // ✅ Update profile - Use UserContext updateUserWithAvatar
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
      setLoadingProfile(true);

      // Format date_of_birth
      let dateOfBirth = null;
      if (formData.date_of_birth) {
        const date = new Date(formData.date_of_birth);
        if (!isNaN(date.getTime())) {
          date.setUTCHours(0, 0, 0, 0);
          dateOfBirth = date.toISOString();
        }
      }

      const updateData = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        date_of_birth: dateOfBirth,
        gender: formData.gender || null,
      };

      // ✅ Use updateUserWithAvatar from UserContext
      await updateUserWithAvatar(updateData, avatarFile);

      // ✅ Reload user data
      const userResponse = await userService.getCurrentUser();
      if (userResponse.success && userResponse.user) {
        const userData = {
          _id: userResponse.user.userId,
          email: userResponse.user.email,
          name: userResponse.user.name,
          role: userResponse.user.role,
          coin: userResponse.user.coin,
          active: userResponse.user.active,
          phone: userResponse.user.phone,
          gender: userResponse.user.gender,
          date_of_birth: userResponse.user.date_of_birth,
          avatar: userResponse.user.avatar,
          avatar_public_id: userResponse.user.avatar_public_id,
          created_at: userResponse.user.created_at,
        };
        setUserState(userData);
        dispatch(setUser(userData));
        emitUserUpdated();
      }

      setAvatarFile(null);
      setAvatarPreview(null);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }

      setIsEditing(false);
    } catch (error) {
      console.error("Update profile error:", error);
      // Toast already shown by updateUserWithAvatar
    } finally {
      setLoadingProfile(false);
    }
  };

  // Change password (giữ nguyên - không dùng UserContext)
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!passwordData.currentPassword) {
      toast.error("Vui lòng nhập mật khẩu hiện tại");
      return;
    }

    if (!passwordData.newPassword) {
      toast.error("Vui lòng nhập mật khẩu mới");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error("Mật khẩu mới phải khác mật khẩu hiện tại");
      return;
    }

    try {
      setLoadingPassword(true);

      // Use direct API call for password change
      const response = await userService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.success) {
        toast.success("Đổi mật khẩu thành công");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setIsChangingPassword(false);
      } else {
        toast.error(response.message || "Đổi mật khẩu thất bại");
      }
    } catch (error) {
      console.error("Change password error:", error);
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi đổi mật khẩu");
    } finally {
      setLoadingPassword(false);
    }
  };

  // Toggle edit mode
  const toggleEdit = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      if (user) {
        let formattedDate = "";
        if (user.date_of_birth) {
          const date = new Date(user.date_of_birth);
          if (!isNaN(date.getTime())) {
            formattedDate = date.toISOString().split("T")[0];
          }
        }
        setFormData({
          name: user.name || "",
          phone: user.phone || "",
          date_of_birth: formattedDate,
          gender: user.gender || "",
        });
      }
      handleCancelAvatar();
    }
  };

  // Cancel change password
  const handleCancelPassword = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setIsChangingPassword(false);
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
    <main className="bg-gray-50 min-h-screen">
      {/* Header Banner */}
      <section
        className="bg-cover bg-center py-20 text-center text-white relative"
        style={{ backgroundImage: `url(${assets.page_banner})` }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10">
          <h1 className="text-5xl font-bold drop-shadow-lg">Tài khoản của tôi</h1>
          <ul className="flex justify-center gap-2 mt-2 text-sm">
            <li>
              <Link to="/seller" className="hover:underline font-medium">
                Dashboard
              </Link>
            </li>
            <li className="font-medium">/ Tài khoản</li>
          </ul>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header with Avatar */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Avatar Section */}
              <div className="relative group">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-green-500 relative">
                  <img
                    src={getAvatarUrl(200)}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error("Avatar load error");
                      e.target.src = getAvatarUrl(200);
                    }}
                  />

                  {/* Upload Overlay */}
                  <div
                    className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <span className="text-white text-sm font-medium">📷 Đổi ảnh</span>
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
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{user.name}</h1>
                <p className="text-gray-600 text-sm sm:text-base">{user.email}</p>
                <div className="flex items-center space-x-2 my-3 justify-center sm:justify-start">
                  <img src={assets.coin_icon} className="h-6 w-6" alt="Coin" />
                  <p className="text-sm sm:text-base text-black">Xu tích lũy: {user.coin}</p>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {user.role === "seller" ? "Seller" : "User"}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {user.active ? "Hoạt động" : "Bị khóa"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {/* Avatar Action Buttons */}
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
                      disabled={loadingProfile}
                      className="px-4 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition disabled:opacity-50"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={loadingProfile || isUploadingAvatar}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {(loadingProfile || isUploadingAvatar) && (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      )}
                      {loadingProfile || isUploadingAvatar ? "Đang lưu..." : "Lưu"}
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

            {/* Avatar Preview Message */}
            {avatarPreview && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-700 text-sm">
                  📷 Ảnh đại diện mới đã được chọn. Nhấn "Lưu ảnh" để cập nhật riêng hoặc "Lưu" để cập nhật cùng
                  thông tin khác.
                </p>
              </div>
            )}
          </div>

          {/* Profile Information Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Thông tin cá nhân</h2>

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
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    isEditing ? "bg-white" : "bg-gray-50 cursor-not-allowed text-gray-500"
                  }`}
                  placeholder="Nhập tên của bạn"
                />
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50 cursor-not-allowed text-gray-500"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    isEditing ? "bg-white" : "bg-gray-50 cursor-not-allowed text-gray-500"
                  }`}
                  placeholder="Nhập số điện thoại (10-11 số)"
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                {isEditing ? (
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                ) : (
                  <input
                    type="text"
                    value={formatDateForDisplay(user.date_of_birth)}
                    disabled
                    className="w-full px-3 py-2 border rounded-lg bg-gray-50 cursor-not-allowed text-gray-500"
                  />
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                {isEditing ? (
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={getGenderDisplay(formData.gender) || "Chưa cập nhật"}
                    disabled
                    className="w-full px-3 py-2 border rounded-lg bg-gray-50 cursor-not-allowed text-gray-500"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Shield className="text-gray-700" size={24} />
                <h2 className="text-2xl font-bold text-gray-800">Đổi mật khẩu</h2>
              </div>
              {!isChangingPassword && (
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition font-medium"
                >
                  Đổi mật khẩu
                </button>
              )}
            </div>

            {!isChangingPassword ? (
              <div className="text-center py-8">
                <Shield className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-gray-600">Nhấn "Đổi mật khẩu" để thay đổi mật khẩu của bạn</p>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mật khẩu hiện tại <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-2 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                      placeholder="Nhập mật khẩu hiện tại"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("current")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mật khẩu mới <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-2 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                      placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("new")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-2 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
                      placeholder="Nhập lại mật khẩu mới"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("confirm")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700 font-medium mb-2">Yêu cầu mật khẩu:</p>
                  <ul className="text-sm text-blue-600 space-y-1 list-disc list-inside">
                    <li>Ít nhất 6 ký tự</li>
                    <li>Khác với mật khẩu hiện tại</li>
                    <li>Nên kết hợp chữ, số và ký tự đặc biệt</li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loadingPassword}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingPassword ? "Đang xử lý..." : "Đổi mật khẩu"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelPassword}
                    disabled={loadingPassword}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium disabled:opacity-50"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default MyAccount;