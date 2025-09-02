import app from "./app.js";
import { config } from "./config/env.js";
import connectDB from "./config/db.js";
const startServer = async () => {
  await connectDB();

  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
};

startServer();
