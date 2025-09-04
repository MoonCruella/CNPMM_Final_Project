import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    
    // Bổ sung thêm các trường mới
    username: {
      type: String,
      unique: true,
      sparse: true // Cho phép null nhưng unique khi có giá trị
    },
    phone: {
      type: String,
      maxlength: 15
    },
    address: {
      street: String,
      ward: String,      // Phường/xã
      district: String,  // Quận/huyện
      province: String,  // Tỉnh/thành phố
      full_address: String // Địa chỉ đầy đủ
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    avatar: {
      type: String,
      default: null
    },
    date_of_birth: {
      type: Date
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    active: {
      type: Boolean,
      default: false, 
    },
    last_login: {
      type: Date
    },
    refresh_tokens: [{
      token: String,
      created_at: {
        type: Date,
        default: Date.now
      },
      expires_at: Date,
      device_info: String
    }]
  },
  {
    timestamps: true,
  }
);

// Index cho tìm kiếm và performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1, active: 1 });

// Virtual để lấy full name
userSchema.virtual('display_name').get(function() {
  return this.name;
});

// Method kiểm tra có phải admin không
userSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

// Method kiểm tra tài khoản đã active chưa
userSchema.methods.isActive = function() {
  return this.active === true;
};

// Method cập nhật last login
userSchema.methods.updateLastLogin = function() {
  this.last_login = new Date();
  return this.save();
};
userSchema.methods.addRefreshToken = function(refreshToken, deviceInfo = '') {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 ngày
  
  this.refresh_tokens.push({
    token: refreshToken,
    expires_at: expiresAt,
    device_info: deviceInfo
  });
  
  // Giới hạn số lượng refresh token (tối đa 5 thiết bị)
  if (this.refresh_tokens.length > 5) {
    this.refresh_tokens = this.refresh_tokens.slice(-5);
  }
  
  return this.save();
};

// Method để xóa refresh token
userSchema.methods.removeRefreshToken = function(refreshToken) {
  this.refresh_tokens = this.refresh_tokens.filter(
    item => item.token !== refreshToken
  );
  return this.save();
};

// Method để xóa tất cả refresh token (logout all devices)
userSchema.methods.removeAllRefreshTokens = function() {
  this.refresh_tokens = [];
  return this.save();
};
const User = mongoose.model("User", userSchema);
export default User;