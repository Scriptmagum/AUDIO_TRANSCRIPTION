const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.identifier = async (req, res, next) => {
  try {
    // =========================
    // 1. AUTH VIA x-api-key
    // =========================
    const apiKey = req.headers["x-api-key"];

    if (apiKey) {
      const user = await User.findOne({ apiKey });

      if (user) {
        req.user = {
          userId: user._id,
          email: user.email,
          apiKey: user.apiKey,
          authType: "apiKey"
        };

        return next();
      }
    }

    // =========================
    // 2. AUTH VIA JWT COOKIE
    // =========================
    const token = req.cookies["Authorization"];

    if (!token) {
      return res.status(401).json({
        message: "Not authenticated"
      });
    }

    const userToken = token.split(" ")[1];

    const decoded = jwt.verify(
      userToken,
      process.env.JWT_SECRET
    );

    req.user = {
      ...decoded,
      authType: "jwt"
    };

    return next();

  } catch (err) {
    return res.status(401).json({
      message: "Invalid token"
    });
  }
};