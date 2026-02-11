import jwt from "jsonwebtoken";

const authCreater = async (req, res, next) => {
  try {
    // Express lowercases all headers, so we check for 'creatertoken'
    const { creatertoken } = req.headers;

    if (!creatertoken) {
      return res.json({
        success: false,
        message: "Not Authorized. Login Again",
      });
    }

    // Verify the token
    const token_decode = jwt.verify(creatertoken, process.env.JWT_SECRET);

    // FIX: Assign the decoded ID to the request object
    // This allows controllers to access the user ID via req.id
    req.id = token_decode.id;

    next();
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

export default authCreater;
