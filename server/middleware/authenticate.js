import jwt from "jsonwebtoken";
export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.access_token;
    if (!token) {
      return res.status(403).json({ status: false, message: "Unauthorized" });
    }
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (error) {
    res.status(404).json({ status: true, message: "Unauthorized" });
  }
};
