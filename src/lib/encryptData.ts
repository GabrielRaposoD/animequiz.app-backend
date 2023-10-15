import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';

import { promisify } from 'util';

const secret = process.env.ENCRYPTION_KEY || 'default';

export const encryptData = async (data) => {
  const iv = randomBytes(16);
  const key = (await promisify(scrypt)(secret, 'salt', 32)) as Buffer;
  const cipher = createCipheriv('aes-256-ctr', key, iv);

  const result = Buffer.concat([iv, cipher.update(data), cipher.final()]);

  return result;
};
