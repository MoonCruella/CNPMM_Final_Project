import mongoose from "mongoose";
import {config} from "./env.js"
const connectDB = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log("Database connected");
  } catch (err) {
    console.log("Database connection failed:", err);
    process.exit(1);
  }
};

export default connectDB;