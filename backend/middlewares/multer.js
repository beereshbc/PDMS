import multer from "multer";
import path from "path";
import fs from "fs";

// 1. Ensure the upload directory exists
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 2. Configure Disk Storage
const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    // Save files to the 'uploads' folder
    callback(null, uploadDir);
  },
  filename: function (req, file, callback) {
    // 3. Generate a unique filename (timestamp + random number + extension)
    // This prevents conflicts if multiple users upload files with the same name
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    callback(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const upload = multer({ storage });

export default upload;
