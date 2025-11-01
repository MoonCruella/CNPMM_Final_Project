import dotenv from "dotenv";
dotenv.config();

export const config = {
  mongodbUri: process.env.MONGODB_CONN,
  port: process.env.PORT,
  accessTokenKey: process.env.ACCESS_TOKEN_KEY,
  accessTokenLife: process.env.ACCESS_TOKEN_LIFE,
  refreshTokenKey: process.env.REFRESH_TOKEN_KEY,
  refreshTokenLife: process.env.REFRESH_TOKEN_LIFE,
  email: process.env.EMAIL_USER,
  passEmail: process.env.EMAIL_PASS,

  client_id: process.env.GOOGLE_CLIENT_ID,
  client_secret_id: process.env.GOOGLE_CLIENT_SECRET,
  client_url: process.env.CLIENT_URL,
  // thêm Cloudinary
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  },
  
  clarifai: {
    pat: process.env.CLARIFAI_PAT,
    user_id: 'google',
    app_id: 'generative',
    model_id: 'gemini-pro'
  }
};
