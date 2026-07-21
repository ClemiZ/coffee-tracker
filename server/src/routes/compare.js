const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { checkAfterCompare } = require('../achievements');
const { COFFEES } = require('../data/coffees');
const { dateStr } = require('./_helpers');

const router = express.Router();

function buildUserStats(userId) {
  const allEntries = db.prepare(
    'SELECT coffee_id, caffeine_mg, logged_at FROM coffee_entries WHERE user_id = ? ORDER BY logged_at'
  ).all(userId);

  const today = new Date().toISOString().slice(0, 10);
  const todayEntries = allEntries.filter(e => dateStr(e.logged_at) === today);
  const sevenDayTotal = allEntries.filter(e => Date.now() - e.logged_at <= 7 * 86400000).length;

  const byType = {};
  for (const e of allEntries) byType[e.coffee_id] = (byType[e.coffee_id] || 0) + 1;
  const favouriteId = Object.entries(byType).sort(([,a],[,b]) => b - a)[0]?.[0];
  const favourite = COFFEES.find(c => c.id === favouriteId) || null;

  const streak = db.prepare('SELECT * FROM user_streaks WHERE user_id = ?').get(userId);
  const achievements = db.prepare('SELECT COUNT(*) as cnt FROM user_achievements WHERE user_id = ?').get(userId);
  const badges = db.prepare('SELECT COUNT(*) as cnt FROM user_badges WHERE user_id = ?').get(userId);

  return {
    total_cups: allEntries.length,
    total_caffeine: allEntries.reduce((s, e) => s + e.caffeine_mg, 0),
    today_cups: todayEntries.length,
    today_caffeine: todayEntries.reduce((s, e) => s + e.caffeine_mg, 0),
    seven_day_avg: +(sevenDayTotal / 7).toFixed(1),
    favourite_coffee: favourite,
    unique_types: Object.keys(byType).length,
    current_streak: streak?.current_streak || 0,
    longest_streak: streak?.longest_streak || 0,
    achievements_count: achievements.cnt,
    badges_count: badges.cnt,
  };
}

router.get('/:username', requireAuth, (req, res) => {
  const target = db.prepare(
    'SELECT id, username, avatar, created_at FROM users WHERE username = ?'
  ).get(req.params.username);

  if (!target) return res.status(404).json({ error: 'User not found' });
  if (target.id === req.user.id) return res.status(400).json({ error: 'Cannot compare with yourself' });

  const myStats = buildUserStats(req.user.id);
  const theirStats = buildUserStats(target.id);
  const unlocked = checkAfterCompare(req.user.id, target.id);
  const me = db.prepare('SELECT id, username, avatar FROM users WHERE id = ?').get(req.user.id);

  res.json({ me: { ...me, stats: myStats }, them: { ...target, stats: theirStats }, unlocked });
});

module.exports = router;
