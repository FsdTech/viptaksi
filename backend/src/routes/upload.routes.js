const { Router } = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { authenticate } = require("../middlewares/authenticate");
const { authorize } = require("../middlewares/authorize");
const { authorizePanel } = require("../middlewares/authorizePanel");
const { requireSuperAdmin } = require("../middlewares/requireSuperAdmin");
const { AppError } = require("../utils/AppError");

const router = Router();

const receiptsDir = path.resolve(process.cwd(), "uploads", "receipts");
fs.mkdirSync(receiptsDir, { recursive: true });
const driverDocsDir = path.resolve(process.cwd(), "uploads", "driver-documents");
fs.mkdirSync(driverDocsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, receiptsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = [".jpg", ".jpeg", ".png", ".pdf", ".webp"].includes(ext) ? ext : ".bin";
    cb(null, `receipt_${req.user.id}_${Date.now()}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (!allowed.includes(file.mimetype)) {
      return cb(new AppError(400, "Only jpg, png, webp or pdf receipts are allowed"));
    }
    cb(null, true);
  },
});

router.post(
  "/receipt",
  authenticate,
  authorize("driver"),
  upload.single("receipt"),
  (req, res, next) => {
    if (!req.file) {
      return next(new AppError(400, "Receipt file is required"));
    }
    const url = `${req.protocol}://${req.get("host")}/uploads/receipts/${req.file.filename}`;
    res.status(201).json({
      file: {
        filename: req.file.filename,
        size: req.file.size,
        mimeType: req.file.mimetype,
        url,
      },
    });
  }
);

const driverDocStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, driverDocsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = [".jpg", ".jpeg", ".png", ".pdf", ".webp"].includes(ext) ? ext : ".bin";
    cb(null, `driver_doc_${req.user.id}_${Date.now()}${safeExt}`);
  },
});

const uploadDriverDoc = multer({
  storage: driverDocStorage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (!allowed.includes(file.mimetype)) {
      return cb(new AppError(400, "Only jpg, png, webp or pdf files are allowed"));
    }
    cb(null, true);
  },
});

router.post(
  "/driver-document",
  authenticate,
  authorizePanel,
  requireSuperAdmin,
  uploadDriverDoc.single("document"),
  (req, res, next) => {
    if (!req.file) {
      return next(new AppError(400, "Document file is required"));
    }
    const url = `${req.protocol}://${req.get("host")}/uploads/driver-documents/${req.file.filename}`;
    res.status(201).json({
      file: {
        filename: req.file.filename,
        size: req.file.size,
        mimeType: req.file.mimetype,
        url,
      },
    });
  }
);

module.exports = router;
