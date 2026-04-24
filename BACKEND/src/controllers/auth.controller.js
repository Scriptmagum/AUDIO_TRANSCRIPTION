const { doHashValidation, doHash } = require('../utils/hashing');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { generateApiKey } = require('../utils/generateApiKey');

exports.signup = async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists!' });
    }
    
    const hashedPassword = await doHash(password, 12);
    const newUser = new User({
      email,
      password: hashedPassword,
    });
    const result = await newUser.save();

    const token = jwt.sign(
      {
        userId: result._id,
        email: result.email,
      },
      process.env.JWT_SECRET
    );

    return res
      .cookie('Authorization', 'Bearer ' + token, {
        expires: new Date(Date.now() + 8 * 3600000),
        httpOnly: process.env.NODE_ENV === 'production',
        secure: process.env.NODE_ENV === 'production',
      })
      .json({
        success: true,
        message: 'Your account has been created successfully'
      });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.signin = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const existingUser = await User.findOne({ email }).select('+password');

    if (!existingUser) {
      return res.status(401).json({ message: 'Invalid credentials!' });
    }
    
    const result = await doHashValidation(password, existingUser.password);

    if (!result) {
      return res.status(401).json({ message: 'Invalid credentials!' });
    }

    let apiKey = existingUser.apiKey;
    
    if (!apiKey) {
      apiKey = generateApiKey();
      existingUser.apiKey = apiKey;
      await existingUser.save();
    }

    const token = jwt.sign(
      {
        userId: existingUser._id,
        email: existingUser.email,
        apiKey: apiKey
      },
      process.env.JWT_SECRET,
    );

    return res
      .cookie('Authorization', 'Bearer ' + token, {
        expires: new Date(Date.now() + 8 * 3600000),
        httpOnly: process.env.NODE_ENV === 'production',
        secure: process.env.NODE_ENV === 'production',
      })
      .json({ success: true, message: 'You are logged in!' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.signout = (req, res) => {
  return res
    .clearCookie('Authorization')
    .status(200)
    .json({ success: true, message: 'Successfully logged out!' });
};