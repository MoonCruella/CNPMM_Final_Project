import express from "express";
import cookieParser from "cookie-parser";
import AuthRoute from "./routes/auth.route.js";
import cors from "cors";
import { User, Category, Product, Order, Cart, HomeTownPost } from './models/index.js';
const app = express();


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
console.log('Models loaded:', {
  User: User.modelName,
  Category: Category.modelName,
  Product: Product.modelName,
  Order: Order.modelName,
  Cart: Cart.modelName,
  HomeTownPost: HomeTownPost.modelName
});
app.use(express.json());
app.use(cookieParser());

//Auth
app.use("/api/auth", AuthRoute);

export default app;