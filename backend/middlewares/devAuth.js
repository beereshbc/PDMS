// middleware/authDev.js
import jwt from "jsonwebtoken";

const authDev = async (req, res, next) => {
  try {
    const { devtoken } = req.headers;
    if (!devtoken) {
      return res.json({
        success: false,
        message: "Not Authorized. Login Again.",
      });
    }
    const token_decode = jwt.verify(devtoken, process.env.JWT_SECRET);

    if (token_decode.role !== "developer") {
      return res.json({
        success: false,
        message: "Access Denied: Not a Developer session",
      });
    }

    req.dev = token_decode;
    next();
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export default authDev;
