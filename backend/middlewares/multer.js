import multer from "multer";
import path from "path";
import os from "os"; // Import OS module

// 1. Use the system's temporary directory (Allowed in Vercel)
const uploadDir = os.tmpdir();

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    // Save files to the temporary directory
    callback(null, uploadDir);
  },
  filename: function (req, file, callback) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    callback(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const upload = multer({ storage });

export default upload;
