const crypto = require('crypto');

exports.generateApiKey = () => {
  return crypto.randomBytes(32).toString('hex');
};