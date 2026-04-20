// controllers/user.controller.js

const User = require('../models/User');
const {generateApiKey} = require('../utils/generateApiKey');

exports.createApiKey = async (req, res) => {
  try {
    const apiKey = generateApiKey();
    console.log("Génération de la clé API pour l'utilisateur:", req.user);
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { apiKey },
      { returnDocument: 'after' }
    ); 
   // console.log("API Key générée pour l'utilisateur:", user.email);
    res.json({ apiKey });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};