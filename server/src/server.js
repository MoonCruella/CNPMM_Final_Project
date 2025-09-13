import app from "./app.js";
import { config } from "./config/env.js";
import connectDB from "./config/db.js";
import { autoConfirmOrders } from "./controllers/order.controller.js";

const startServer = async () => {
  await connectDB();
  const RUN_INTERVAL_MS = 60 * 1000; 
  autoConfirmOrders();

  const autoConfirmInterval = setInterval(autoConfirmOrders, RUN_INTERVAL_MS);
  process.on("SIGINT", () => {
    clearInterval(autoConfirmInterval);
    process.exit(0);
  });
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
};

startServer();
