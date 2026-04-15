const mongoose = require('mongoose');

// creer le shema
/*
User defini par:
email: String
password: String

*/

const userSchema = new mongoose.Schema(
{
email: {
    type: String,
    required: [true, 'Email is required!'],
		trim: true,
		unique: [true, 'Email must be unique!'],
		minLength: [5, 'The minimum length should be 5 characters'],
		lowercase: true
},

password: {
  type: String,
	required: [true, 'Password is required'],
	trim: true,
	minLength: [8, 'The minimum length should be 8 characters'],
	select: false,
},
 apiKey: {
    type: String,
    unique: true,
    sparse: true
  }

},
{
timestamps: true
}
);

// exporter le model
module.exports = mongoose.model('User',userSchema);
