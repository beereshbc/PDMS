import multer from "multer";
import path from "path";
import os from "os";

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, os.tmpdir()); // Required for Vercel
  },
  filename: function (req, file, callback) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    callback(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // Set to 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["application/pdf"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF documents are allowed!"), false);
    }
  },
});

export default upload;
