import http from 'http';
import app from "./app.js";
import { config } from "./config/env.js";
import connectDB from "./config/db.js";
import { initSocket } from './config/socket.js';
import { autoConfirmOrders } from "./controllers/order.controller.js";

const startServer = async () => {
  try {
    await connectDB();
    
    // Tạo HTTP server từ Express app
    const server = http.createServer(app);
    
    // Khởi tạo Socket.IO
    const io = initSocket(server);
    
    // Thiết lập interval cho việc tự động xác nhận đơn hàng
    const RUN_INTERVAL_MS = 60 * 1000; 
    autoConfirmOrders();

    const autoConfirmInterval = setInterval(autoConfirmOrders, RUN_INTERVAL_MS);
    
    // Xử lý khi server dừng
    process.on("SIGINT", () => {
      clearInterval(autoConfirmInterval);
      process.exit(0);
    });
    
    // Lắng nghe trên server HTTP thay vì trực tiếp app
    server.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
      console.log(`Socket.IO initialized`);
    });
    
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();