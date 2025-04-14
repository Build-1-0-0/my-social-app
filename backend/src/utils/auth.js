import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export async function verifyToken(token, secret) {
  try {
    const decoded = jwt.verify(token, secret);
    return decoded.userId;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
      }
