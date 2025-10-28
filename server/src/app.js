import express from "express";
import cookieParser from "cookie-parser";
import AuthRoute from "./routes/auth.route.js";
import uploadRoute from "./routes/upload.route.js";
import categoryRoutes from "./routes/category.route.js";
import productRoutes from "./routes/product.route.js";
import orderRoutes from "./routes/order.route.js";
import cartRoutes from "./routes/cart.route.js";
import addressRoutes from "./routes/address.route.js";
import userRoutes from "./routes/user.route.js";
import vnpayRoutes from "./routes/vnpay.route.js";
import zalopayRoutes from "./routes/zalopay.route.js";
import voucherRoutes from "./routes/voucher.route.js";
import ratingRoutes from "./routes/rating.route.js";
import notificationRoutes from "./routes/notification.route.js";
import chatbotRoutes from "./routes/chatbot.route.js";
import supportChatRoutes from "./routes/supportChat.route.js";
import hometownPostRoutes from "./routes/hometownPost.routes.js";
import revenueRoutes from "./routes/revenue.route.js";

import cors from "cors";
import {
  User,
  Category,
  Product,
  Order,
  Cart,
  HomeTownPost,
} from "./models/index.js";
const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173", // Frontend Vite
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
    optionsSuccessStatus: 200,
  })
);

app.use(express.json());
app.use(cookieParser());

//Auth
app.use("/api/auth", AuthRoute);
//User
app.use("/api/users", userRoutes);

//Upload Anh len Cloudinary
app.use("/api/upload", uploadRoute);

//Category
app.use("/api/categories", categoryRoutes);

//Products
app.use("/api/products", productRoutes);

//Cart
app.use("/api/cart", cartRoutes);

//Add order routes
app.use("/api/orders", orderRoutes);

//Addresses
app.use("/api/addresses", addressRoutes);

// VNPay
app.use("/api/vnpay", vnpayRoutes);

// ZaloPay
app.use("/api/zalopay", zalopayRoutes);

// Voucher
app.use("/api/vouchers", voucherRoutes);

// Rating
app.use("/api/ratings", ratingRoutes);

// Revenue
app.use("/api/revenue", revenueRoutes);

app.use("/api/notifications", notificationRoutes);
// Thêm vào phần routes
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/support", supportChatRoutes);
app.use("/api/hometown-posts", hometownPostRoutes);
export default app;
