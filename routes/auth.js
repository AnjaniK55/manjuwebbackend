import express from 'express';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { getUserByUsername } from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'manju-agency-secret-key-2026';

// Admin login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const user = await getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid Username or Password' });
    }

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid Username or Password' });
    }

    // Sign session token
    const token = jwt.sign(
      { id: user._id || user.id, username: user.username, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '8h' }
    );

    return res.json({ 
      success: true, 
      token, 
      user: { username: user.username, role: user.role } 
    });
  } catch (err) {
    console.error('>>> [AUTH ERROR] Login handler error:', err.message);
    return res.status(500).json({ success: false, message: 'Internal Server Authentication Error' });
  }
});

// Middleware to verify JWT tokens
export function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).json({ message: 'Token required.' });
  
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(403).json({ message: 'Authorization header malformed.' });
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Failed to verify session token.' });
    req.user = decoded;
    next();
  });
}

export default router;
