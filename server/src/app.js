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

app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https: *; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "connect-src 'self' http://localhost:5173 ws://localhost:5173; " +
    "font-src 'self' data: https:; " +
    "frame-src https://sandbox.vnpayment.vn; " +
    "script-src 'self' https://sandbox.vnpayment.vn 'unsafe-inline' 'unsafe-eval';"
  );
  next();
});

app.use(
  cors({
    origin: [
      "http://localhost:5173", // Frontend Vite
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
    optionsSuccessStatus: 200,
  })
);
console.log("Models loaded:", {
  User: User.modelName,
  Category: Category.modelName,
  Product: Product.modelName,
  Order: Order.modelName,
  Cart: Cart.modelName,
  HomeTownPost: HomeTownPost.modelName,
});
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

export default app;
