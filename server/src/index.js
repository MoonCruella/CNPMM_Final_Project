import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import AuthRoute from "./routes/auth.route.js";
import otpRoutes from "./routes/otp.js";
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

const port = process.env.PORT;
app.listen(port, () => {
  console.log("Our server is running on port:", port);
});

// database connection

mongoose
  .connect(process.env.MONGODB_CONN)
  .then(() => {
    console.log("Database connected");
  })
  .catch((err) => console.log("connection failed", err));

// router
//Auth
app.use("/api/auth", AuthRoute);
//OTP
app.use("/api/otp", otpRoutes);
console.log("=== Environment Variables Debug ===");
console.log("EMAIL_USER:", process.env.EMAIL_USER ? "SET" : "NOT SET");
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "SET" : "NOT SET");
console.log("PORT:", process.env.PORT);
console.log("MONGODB_CONN:", process.env.MONGODB_CONN ? "SET" : "NOT SET");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "SET" : "NOT SET");