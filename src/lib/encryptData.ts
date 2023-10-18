const secret = process.env.ENCRYPTION_KEY || 'default';

const CryptoES = require('fix-esm').require('crypto-es');

export const encryptData = async (data) => {
  return CryptoES.default.AES.encrypt(data, secret);
};
