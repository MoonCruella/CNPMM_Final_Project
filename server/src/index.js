import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import AuthRoute from "./routes/auth.route.js";
import otpRoutes from "./routes/otp.route.js";
import connectDB from "./config/db.js";
import { config } from "./config/env.js";

import cors from "cors";
dotenv.config();
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

const port = config.port;
app.listen(port, () => {
  console.log("Our server is running on port:", port);
});

// database connection
connectDB();
// router
//Auth
app.use("/api/auth", AuthRoute);
//OTP
app.use("/api/otp", otpRoutes);

console.log("=== Environment Variables Debug ===");
console.log("EMAIL_USER:", config.email ? "SET" : "NOT SET");
console.log("EMAIL_PASS:", config.passEmail ? "SET" : "NOT SET");
console.log("PORT:", config.port);
console.log("MONGODB_CONN:", config.mongodbUri ? "SET" : "NOT SET");
console.log("JWT_SECRET:", config.accessTokenKey ? "SET" : "NOT SET");