const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const db       = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function makeToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

router.post('/register', (req, res) => {
  const { email, username, password } = req.body;
  if (!email || !username || !password) return res.status(400).json({ error: 'Missing fields' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  if (!/^[a-zA-Z0-9_-]{2,20}$/.test(username)) return res.status(400).json({ error: 'Username must be 2-20 alphanumeric characters' });

  const emailLower = email.toLowerCase().trim();
  const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(emailLower, username);
  if (existing) return res.status(409).json({ error: 'Email or username already taken' });

  const password_hash = bcrypt.hashSync(password, 10);
  const id = randomUUID();
  db.prepare('INSERT INTO users (id, email, username, password_hash, created_at) VALUES (?, ?, ?, ?, ?)').run(id, emailLower, username, password_hash, Date.now());
  db.prepare('INSERT INTO user_streaks (user_id) VALUES (?)').run(id);
  db.prepare('INSERT INTO user_combos (user_id) VALUES (?)').run(id);

  const user = db.prepare('SELECT id, email, username, avatar, created_at FROM users WHERE id = ?').get(id);
  res.json({ token: makeToken(user), user });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const { password_hash, ...safe } = user;
  res.json({ token: makeToken(user), user: safe });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, email, username, avatar, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

router.patch('/me', requireAuth, (req, res) => {
  const { username, avatar } = req.body;
  if (username && !/^[a-zA-Z0-9_-]{2,20}$/.test(username)) {
    return res.status(400).json({ error: 'Invalid username' });
  }
  if (username) {
    const taken = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username, req.user.id);
    if (taken) return res.status(409).json({ error: 'Username taken' });
    db.prepare('UPDATE users SET username = ? WHERE id = ?').run(username, req.user.id);
  }
  if (avatar) {
    db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatar, req.user.id);
  }
  const user = db.prepare('SELECT id, email, username, avatar, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

module.exports = router;
