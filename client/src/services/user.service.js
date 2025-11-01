import api from "./api.js";
import privateApi from "./privateApi.js";

class UserService {
  //  Storage management
  saveUserToStorage = (userData) => {
    try {
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      console.error("Error saving user to storage:", error);
    }
  };

  getUserFromStorage = () => {
    try {
      const userData = localStorage.getItem("user");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error getting user from storage:", error);
      return null;
    }
  };

  removeUserFromStorage = () => {
    try {
      localStorage.removeItem("user");
    } catch (error) {
      console.error("Error removing user from storage:", error);
    }
  };

  // Get current user from server
  getCurrentUser = async () => {
  try {
    const response = await api.get("/api/users/me");
    
    // Parse theo structure mới của BE
    if (response.data.success && response.data.data) {
      const userData = response.data.data; // 
      
      return {
        success: true,
        user: userData, //  Return user object
        message: response.data.message,
      };
    } else {
      throw new Error(response.data.message || "Không thể lấy thông tin user");
    }
  } catch (error) {
    console.error(" Get current user error:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Không thể lấy thông tin user",
      error: error.message,
    };
  }
};

  updateUserProfile = async (updateData) => {
    try {
      //  Basic validation
      if (!updateData || typeof updateData !== "object") {
        throw new Error("Dữ liệu không hợp lệ");
      }

      // ✅ Validate only key fields
      if (updateData.name && !updateData.name.trim()) {
        throw new Error("Tên không được để trống");
      }

      if (
        updateData.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updateData.email)
      ) {
        throw new Error("Email không hợp lệ");
      }

      if (
        updateData.phone &&
        !/^(0|\+84)[0-9]{8,10}$/.test(updateData.phone.trim())
      ) {
        throw new Error("Số điện thoại không hợp lệ");
      }

      // Clean data - Remove sensitive fields, keep everything else
      const { password, refresh_tokens, role, ...cleanData } = updateData;

      // Trim string fields
      if (cleanData.name) cleanData.name = cleanData.name.trim();
      if (cleanData.email)
        cleanData.email = cleanData.email.trim().toLowerCase();
      if (cleanData.username) cleanData.username = cleanData.username.trim();
      if (cleanData.phone) cleanData.phone = cleanData.phone.trim();

      // API call
      const response = await api.put("/api/users/profile/update", cleanData);

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || "Cập nhật thành công",
        };
      } else {
        throw new Error(response.data.message || "Cập nhật thất bại");
      }
    } catch (error) {
      console.error("Update profile error:", error);

      // Simple error handling
      const errorMessage =
        error.response?.data?.message || error.message || "Có lỗi khi cập nhật";
      throw new Error(errorMessage);
    }
  };

  // Get user display name
  getUserDisplayName = (user) => {
    return user?.name || user?.username || user?.email?.split("@")[0] || "User";
  };

  //  Check if user is active
  isActiveUser = (user) => {
    return user?.active === true;
  };

  //  Check if user is admin
  isAdmin = (user) => {
    return user?.role === "admin";
  };

  // Format address for display
  formatAddress = (address) => {
    if (!address) return "";

    if (address.full_address) return address.full_address;

    const parts = [
      address.street,
      address.ward,
      address.district,
      address.province,
    ].filter(Boolean);

    return parts.join(", ");
  };

  // Create address object from form data
  createAddressObject = (addressForm) => {
    if (!addressForm) return null;

    return {
      street: addressForm.street || "",
      ward: addressForm.ward || "",
      district: addressForm.district || "",
      province: addressForm.province || "", // Sử dụng province
      full_address: addressForm.full_address || "",
    };
  };

  toggleUserStatus = async (userId) => {
    try {
      if (!userId) throw new Error("userId is required");
      const response = await privateApi.put(
        `/api/users/admin/toggle-status/${userId}`
      );
      return {
        success: true,
        data: response.data,
        message:
          response.data?.message || "Thay đổi trạng thái người dùng thành công",
      };
    } catch (error) {
      console.error("toggleUserStatus error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Lỗi khi thay đổi trạng thái người dùng",
      };
    }
  };
  getUserList = async ({
    limit = 10,
    page = 1,
    search = "",
    role = "",
    active,
  } = {}) => {
    try {
      const params = { limit, page, search, role };
      if (active !== undefined) params.active = active;

      const response = await privateApi.get("/api/users/admin/list", {
        params,
      });
      const payload = response.data || {};

      const data = payload.data ?? payload;
      const users = data.users ?? payload.users ?? [];
      const pagination = data.pagination ?? payload.pagination ?? null;

      return {
        success: true,
        users,
        pagination,
        raw: payload,
      };
    } catch (error) {
      console.error("getUserList error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Lỗi khi lấy danh sách người dùng",
      };
    }
  };
}

export default new UserService();
