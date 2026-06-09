import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Category from '../models/Category.js';

const SALT_ROUNDS = 12;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

function issueToken(res, userId, email) {
  const token = jwt.sign({ userId, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, COOKIE_OPTIONS);
}

export async function register(req, res) {
  const { name, email, password } = req.body ?? {};

  if (!name || !email || !password) {
    return res.status(422).json({ error: 'Name, email, and password are required', code: 422 });
  }
  if (typeof email !== 'string' || !email.includes('@')) {
    return res.status(422).json({ error: 'Invalid email address', code: 422 });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(422).json({ error: 'Password must be at least 8 characters', code: 422 });
  }

  if (await User.findByEmail(email)) {
    return res.status(422).json({ error: 'An account with this email already exists', code: 422 });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const userId = await User.create(email, passwordHash, name.trim());
  await Category.seedDefaults(userId);

  issueToken(res, userId, email);
  res.status(201).json({ user: { id: userId, name: name.trim(), email } });
}

export async function login(req, res) {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(422).json({ error: 'Email and password are required', code: 422 });
  }

  const user = await User.findByEmail(email);
  if (!user) {
    // Avoid timing attacks: still hash even when user not found
    await bcrypt.hash('dummy', SALT_ROUNDS);
    return res.status(401).json({ error: 'Invalid email or password', code: 401 });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password', code: 401 });
  }

  issueToken(res, user.id, user.email);
  res.json({ user: { id: user.id, name: user.name, email: user.email } });
}

export function logout(_req, res) {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
}

export async function getMe(req, res) {
  const user = await User.findById(req.user.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found', code: 404 });
  }
  res.json({ user });
}

export async function updateName(req, res) {
  const { userId } = req.user;
  const { name } = req.body ?? {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(422).json({ error: 'Name is required', code: 422 });
  }

  await User.updateName(userId, name.trim());
  const user = await User.findById(userId);
  res.json({ user });
}

export async function changePassword(req, res) {
  const { userId } = req.user;
  const { currentPassword, newPassword } = req.body ?? {};

  if (!currentPassword || !newPassword) {
    return res.status(422).json({ error: 'currentPassword and newPassword are required', code: 422 });
  }
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(422).json({ error: 'New password must be at least 8 characters', code: 422 });
  }

  const freshUser = await User.findByEmail(req.user.email);
  if (!freshUser) return res.status(404).json({ error: 'User not found', code: 404 });

  const valid = await bcrypt.compare(currentPassword, freshUser.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Current password is incorrect', code: 401 });
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await User.updatePassword(userId, passwordHash);
  res.clearCookie('token');
  res.json({ message: 'Password changed. Please log in again.' });
}

export async function deleteAccount(req, res) {
  const { userId } = req.user;
  const { confirmation } = req.body ?? {};

  if (confirmation !== 'DELETE') {
    return res.status(422).json({ error: 'Type DELETE to confirm account deletion', code: 422 });
  }

  await User.delete(userId);
  res.clearCookie('token');
  res.json({ message: 'Account deleted' });
}
