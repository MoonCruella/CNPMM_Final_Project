import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import path from "path";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/";
    // Ensure upload directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Max 5 files
  } 
}); 
const cleanupTempFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error cleaning up temp file:', error);
  }
};
const getUploadConfig = (uploadType, userId = null) => {
  switch (uploadType) {
    case 'avatar':
      return {
        folder: 'user-avatars',
        public_id: userId ? `user-${userId}` : undefined,
        transformation: [
          { width: 300, height: 300, crop: 'fill', quality: 'auto', format: 'auto' },
          { radius: 'max' }, // Optional: make it circular
        ],
        overwrite: true, // Replace existing avatar
      };
    
    case 'product':
      return {
        folder: 'products',
        transformation: [
          { width: 800, height: 600, crop: 'limit', quality: 'auto', format: 'auto' }
        ],
      };
    
    case 'banner':
      return {
        folder: 'banners',
        transformation: [
          { width: 1200, height: 400, crop: 'fill', quality: 'auto', format: 'auto' }
        ],
      };
    
    default:
      return {
        folder: 'general',
        transformation: [
          { quality: 'auto', format: 'auto' }
        ],
      };
  }
};

// POST /api/upload
router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "No file uploaded" 
      });
    }

    const uploadType = req.body.type || 'general'; // Default to general
    const config = getUploadConfig(uploadType);

    const result = await cloudinary.uploader.upload(req.file.path, config);

    // Clean up temp file
    cleanupTempFile(req.file.path);

    res.json({ 
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      }
    });
  } catch (err) {
    // Clean up temp file on error
    if (req.file) {
      cleanupTempFile(req.file.path);
    }
    
    console.error('Upload error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || "Upload failed" 
    });
  }
});
router.post("/avatar", authenticateToken, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "No avatar file uploaded" 
      });
    }

    const userId = req.user._id || req.user.userId || req.user.id;
    if (!userId) {
      cleanupTempFile(req.file.path);
      return res.status(400).json({ 
        success: false, 
        message: "User ID not found" 
      });
    }

    const config = getUploadConfig('avatar', userId);
    const result = await cloudinary.uploader.upload(req.file.path, config);

    // Clean up temp file
    cleanupTempFile(req.file.path);

    res.json({ 
      success: true,
      message: "Avatar uploaded successfully",
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      }
    });
  } catch (err) {
    // Clean up temp file on error
    if (req.file) {
      cleanupTempFile(req.file.path);
    }
    
    console.error('Avatar upload error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || "Avatar upload failed" 
    });
  }
});
router.post("/multiple", upload.array("images", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "No files uploaded" 
      });
    }

    const uploadType = req.body.type || 'general';
    const config = getUploadConfig(uploadType);
    
    const uploadPromises = req.files.map(async (file) => {
      try {
        const result = await cloudinary.uploader.upload(file.path, config);
        cleanupTempFile(file.path);
        
        return {
          success: true,
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
          originalName: file.originalname
        };
      } catch (error) {
        cleanupTempFile(file.path);
        return {
          success: false,
          error: error.message,
          originalName: file.originalname
        };
      }
    });

    const results = await Promise.all(uploadPromises);
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    res.json({ 
      success: true,
      message: `${successful.length} files uploaded successfully, ${failed.length} failed`,
      data: {
        successful,
        failed,
        totalUploaded: successful.length,
        totalFailed: failed.length
      }
    });
  } catch (err) {
    // Clean up all temp files on error
    if (req.files) {
      req.files.forEach(file => cleanupTempFile(file.path));
    }
    
    console.error('Multiple upload error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || "Multiple upload failed" 
    });
  }
});

// ✅ DELETE /api/upload - Delete image from Cloudinary
router.delete("/", authenticateToken, async (req, res) => {
  try {
    const { publicId } = req.body;
    
    if (!publicId) {
      return res.status(400).json({ 
        success: false, 
        message: "Public ID is required" 
      });
    }

    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      res.json({ 
        success: true,
        message: "Image deleted successfully" 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: "Failed to delete image" 
      });
    }
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || "Delete failed" 
    });
  }
});

// ✅ GET /api/upload/optimize - Get optimized URL
router.get("/optimize", (req, res) => {
  try {
    const { publicId, width, height, crop, quality, format } = req.query;
    
    if (!publicId) {
      return res.status(400).json({ 
        success: false, 
        message: "Public ID is required" 
      });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    let transformations = [];
    
    if (width && height) {
      transformations.push(`c_${crop || 'fill'},w_${width},h_${height}`);
    }
    if (quality) {
      transformations.push(`q_${quality}`);
    }
    if (format) {
      transformations.push(`f_${format}`);
    }
    
    const transformationString = transformations.length > 0 ? `/${transformations.join(',')}` : '';
    const optimizedUrl = `https://res.cloudinary.com/${cloudName}/image/upload${transformationString}/${publicId}`;
    
    res.json({ 
      success: true,
      data: {
        url: optimizedUrl,
        publicId,
        transformations: transformationString
      }
    });
  } catch (err) {
    console.error('Optimize error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || "Optimization failed" 
    });
  }
});
router.use((error, req, res, next) => {
  // Clean up temp files if any
  if (req.file) {
    cleanupTempFile(req.file.path);
  }
  if (req.files) {
    req.files.forEach(file => cleanupTempFile(file.path));
  }

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 5 files allowed.'
      });
    }
  }

  res.status(400).json({
    success: false,
    message: error.message || 'Upload error'
  });
});

export default router;
