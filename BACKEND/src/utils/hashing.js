const { createHmac } = require('crypto');
const { hash, compare } = require('bcryptjs');


exports.doHashValidation = (password, hashedPassword) => {
  return compare(password, hashedPassword);
};

exports.doHash = (value, saltValue) => {
	const result = hash(value, saltValue);
	return result;
};
