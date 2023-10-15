import { createCipheriv, createHash, randomBytes } from 'crypto';

const alg = 'aes-256-ctr';
let key = process.env.ENCRYPTION_KEY || 'default';
key = createHash('sha256')
  .update(String(key))
  .digest('base64')
  .substring(0, 32);

export const encryptData = (data) => {
  const iv = randomBytes(16);
  const cipher = createCipheriv(alg, key, iv);
  const result = Buffer.concat([iv, cipher.update(data), cipher.final()]);
  return result;
};
