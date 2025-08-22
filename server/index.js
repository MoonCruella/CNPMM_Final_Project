import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import AuthRoute from "./routes/auth.route.js";
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

app.use("/api/auth", AuthRoute);
