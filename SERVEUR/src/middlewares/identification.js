// middlewares/auth.middleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.identifier = async (req, res, next) => {
  try {

    // =====================
    // 1. API KEY
    // =====================

    const tokenapi = req.headers['authorization']
    //console.log("API Key reçue:", tokenapi);

    if (tokenapi) {
      // split "Bearer <token>" et prendre la partie token
      const apiKey = tokenapi.split(' ')[1];
  const user = await User.findOne({ apiKey });

  if (!user) {
    return res.status(403).json({ message: 'Invalid API Key' });
  }

  req.user = {
    userId: user._id,
    email: user.email
  };
console.log("Utilisateur identifié via API Key:", req.user);
  return next();
}

    // =====================
    // 2. JWT (cookie)
    // =====================
    const token = req.cookies['Authorization'];
    //console.log("JWT reçu dans les cookies:", token);
    if (!token) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const userToken = token.split(' ')[1];
    const decoded = jwt.verify(userToken, process.env.JWT_SECRET);

    req.user = decoded;

    next();

  } catch (err) {
    return res.status(403).json({ message: 'Not authorized 55' });
  }
};