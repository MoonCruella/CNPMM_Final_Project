import dotenv from "dotenv";
dotenv.config();

export const config = {
  mongodbUri: process.env.MONGODB_CONN,
  port: process.env.PORT,
  accessTokenKey: process.env.ACCESS_TOKEN_KEY,
  accessTokenLife: process.env.ACCESS_TOKEN_LIFE,
  email: process.env.EMAIL_USER,
  passEmail: process.env.EMAIL_PASS,

  // thêm Cloudinary
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  },
};
