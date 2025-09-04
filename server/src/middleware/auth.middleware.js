import jwt from "jsonwebtoken";
import response from "../helpers/response.js";
import { config } from "../config/env.js";

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return response.sendError(res, "Unauthenticated", 401);
  }

  jwt.verify(token, config.accessTokenKey, (err, decodedUser) => {
    if (err) {
      return response.sendError(res, "BadRequest", 403);
    }

    // Giữ toàn bộ payload trong req.user
    req.user = decodedUser;

    next();
  });
};
