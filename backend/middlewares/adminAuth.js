import jwt from "jsonwebtoken";

//Admin authentication middleware

const authAdmin = async (req, res, next) => {
  try {
    const { adminToken } = req.headers;
    if (!adminToken) {
      return res.json({
        success: false,
        message: "Not Authorized. Login Again ",
      });
    }
    const token_decode = jwt.verify(adminToken, process.env.JWT_SECRET);

    token_decode._id = req.id;

    next();
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

export default authAdmin;
