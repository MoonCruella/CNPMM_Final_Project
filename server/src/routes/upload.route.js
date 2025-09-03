import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";

const router = express.Router();
const upload = multer({ dest: "uploads/" }); // lưu tạm

// POST /api/upload
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "products", // folder trong Cloudinary
    });

    // Xóa file tạm sau khi upload xong
    fs.unlinkSync(req.file.path);

    res.json({ url: result.secure_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
