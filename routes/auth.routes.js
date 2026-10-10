const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const HttpError = require('../utils/httpError');

const router = express.Router();

// POST /api/auth/login  { role: 'admin'|'user', username, password }
router.post('/login', async (req, res) => {
  const { role, username, password } = req.body;
  if (!role || !username || !password) throw new HttpError(400, 'role, username and password are required');

  if (role === 'admin') {
    if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
      throw new HttpError(401, 'Invalid admin credentials');
    }
    const token = jwt.sign({ role: 'admin', username }, process.env.JWT_SECRET, { expiresIn: '12h' });
    return res.json({ token, role: 'admin', name: 'Administrator' });
  }

  if (role === 'user') {
    const user = User.findByUsername(username);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new HttpError(401, 'Invalid username or password');
    }
    const token = jwt.sign({ role: 'user', userId: user.id }, process.env.JWT_SECRET, { expiresIn: '12h' });
    return res.json({ token, role: 'user', name: user.name, userId: user.id });
  }

  throw new HttpError(400, 'role must be "admin" or "user"');
});

// POST /api/auth/register  { name, email, phoneNumber, country, username, password }
// Public self-signup. Produces exactly the same kind of account the admin
// creates (same fields, $0 balance, empty wallet, plain "user" role).
router.post('/register', async (req, res) => {
  const { name, email, phoneNumber, country, username, password } = req.body;
  if (!name || !email || !phoneNumber || !country || !username || !password) {
    throw new HttpError(400, 'Name, email, phone number, country, username and password are all required');
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, 'Invalid email address');
  if (String(password).length < 6) throw new HttpError(400, 'Password must be at least 6 characters');
  if (!/^[a-zA-Z0-9_.]{3,20}$/.test(username)) {
    throw new HttpError(400, 'Username must be 3-20 characters (letters, numbers, underscore or dot only)');
  }
  if (User.findByUsername(username)) throw new HttpError(409, 'That username is already taken');

  const user = User.create({
    name: name.trim(), email: email.trim(), phoneNumber: phoneNumber.trim(), country,
    username, passwordHash: await bcrypt.hash(password, 10), usdBalance: 0
  });
  const token = jwt.sign({ role: 'user', userId: user.id }, process.env.JWT_SECRET, { expiresIn: '12h' });
  res.status(201).json({ token, role: 'user', name: user.name, userId: user.id });
});

module.exports = router;
