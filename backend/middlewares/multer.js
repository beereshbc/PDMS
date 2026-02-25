import multer from "multer";

// 1. Switch to Memory Storage (No local files created)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    // 50MB limit for the buffer
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    // Only allow PDFs
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF documents are allowed!"), false);
    }
  },
});

export default upload;
