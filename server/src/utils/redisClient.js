import { createClient } from "redis";

const redisClient = createClient();

redisClient.on("error", (err) => console.error("Redis error:", err));

// Sử dụng IIFE để connect
(async () => {
  try {
    await redisClient.connect();
    console.log("Redis connected successfully");
  } catch (error) {
    console.error("Redis connection error:", error);
  }
})();

export default redisClient;