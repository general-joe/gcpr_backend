import bcrypt from 'bcryptjs';
import WRITE from './logger.js';

export const hash = async (password) => {
  const saltRounds = process.env.BCRYPT_SALT_ROUNDS ? parseInt(process.env.BCRYPT_SALT_ROUNDS) : 10;
  try {
    const salt = await bcrypt.genSalt(saltRounds);
    const hashpass = await bcrypt.hash(password, salt);
    return hashpass;
  } catch (error) {
    WRITE.error('Error hashing password', { error: error.message });
    throw new Error('Password hashing failed');
  }
};

export const compare = async (password, sysPassword) => {
  try {
    const matchPassword = await bcrypt.compare(password, sysPassword);
    return matchPassword;
  } catch (error) {
    WRITE.error('Error comparing password', { error: error.message });
    throw new Error('Password comparison failed');
  }
};
