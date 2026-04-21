
const {doHashValidation, doHash} = require('../utils/hashing');
const User = require('../models/User');
const jwt = require('jsonwebtoken');


exports.signup = async (req, res) => {
	const { email, password } = req.body;

	try {
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.json({ message: 'Invalid credentials!' });
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

		res
			.cookie('Authorization', 'Bearer ' + token, {
				expires: new Date(Date.now() + 8 * 3600000), // cookie will be removed after 8 hours
				httpOnly: process.env.NODE_ENV === 'production',
				secure: process.env.NODE_ENV === 'production',
			})

			.json({
				success: true,
				message: 'Your account has been created successfully'
			});
	} catch (err) {
		res.status(500).json({ error: 'Internal server error' });
	}
};



exports.signin = async (req, res) => {
	const { email, password } = req.body;
	try {
		const existingUser = await User.findOne({ email }).select('+password');

		if (!existingUser) {
			return res.json({ message: 'Invalid credentials!' });
		}
		const result = await doHashValidation(password, existingUser.password);

		if (!result) {
			return res.json({ message: 'Invalid credentials!' });
		}
		const token = jwt.sign(
			{
				userId: existingUser._id,
				email: existingUser.email,
			},
			process.env.JWT_SECRET,
		);

		res
			.cookie('Authorization', 'Bearer ' + token, {
				expires: new Date(Date.now() + 8 * 3600000), // cookie will be removed after 8 hours
				httpOnly: process.env.NODE_ENV === 'production',
				secure: process.env.NODE_ENV === 'production',
			})
			.json({ success: true, message: 'You are logged in!' });
	} catch (err) {
		res.status(500).json({ error: 'Internal server error' });
	}
};

exports.signout = (req, res) => {
	res
		.clearCookie('Authorization')
		.status(200)
		.json({ success: true, message: 'Successfully logged out!' });
};