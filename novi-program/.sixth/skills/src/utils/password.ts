import crypto from 'crypto';

export const hashPassword = (password: string): string => {
  return crypto
    .pbkdf2Sync(password, 'salt', 1000, 64, 'sha512')
    .toString('hex');
};

export const verifyPassword = (password: string, hash: string): boolean => {
  const newHash = crypto
    .pbkdf2Sync(password, 'salt', 1000, 64, 'sha512')
    .toString('hex');
  return newHash === hash;
};
