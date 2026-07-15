const express = require('express');
const { randomUUID } = require('crypto');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { COFFEES } = require('../data/coffees');
const { checkAfterCoffeeLog } = require('../achievements');

const router = express.Router();

function dateStr(ts) { return new Date(ts).toISOString().slice(0, 10); }

router.get('/', (req, res) => {
  res.json(COFFEES);
});

router.get('/entries', requireAuth, (req, res) => {
  const { date, days } = req.query;
  let rows;
  if (date) {
    const start = new Date(date + 'T00:00:00').getTime();
    const end   = new Date(date + 'T23:59:59.999').getTime();
    rows = db.prepare(
      'SELECT * FROM coffee_entries WHERE user_id = ? AND logged_at BETWEEN ? AND ? ORDER BY logged_at DESC'
    ).all(req.user.id, start, end);
  } else if (days) {
    const cutoff = Date.now() - parseInt(days) * 86400000;
    rows = db.prepare(
      'SELECT * FROM coffee_entries WHERE user_id = ? AND logged_at >= ? ORDER BY logged_at DESC'
    ).all(req.user.id, cutoff);
  } else {
    rows = db.prepare(
      'SELECT * FROM coffee_entries WHERE user_id = ? ORDER BY logged_at DESC'
    ).all(req.user.id);
  }
  res.json(rows);
});

router.post('/entries', requireAuth, (req, res) => {
  const { coffeeId, timestamp } = req.body;
  const coffee = COFFEES.find(c => c.id === coffeeId);
  if (!coffee) return res.status(400).json({ error: 'Unknown coffee type' });

  const id = randomUUID();
  const logged_at = timestamp || Date.now();
  db.prepare(
    'INSERT INTO coffee_entries (id, user_id, coffee_id, caffeine_mg, logged_at) VALUES (?, ?, ?, ?, ?)'
  ).run(id, req.user.id, coffeeId, coffee.caffeine, logged_at);

  const unlocked = checkAfterCoffeeLog(req.user.id);

  const entry = { id, user_id: req.user.id, coffee_id: coffeeId, caffeine_mg: coffee.caffeine, logged_at };
  res.json({ entry, unlocked });
});

router.patch('/entries/:id', requireAuth, (req, res) => {
  const { timestamp } = req.body;
  if (!timestamp || typeof timestamp !== 'number') return res.status(400).json({ error: 'timestamp required' });
  const entry = db.prepare('SELECT * FROM coffee_entries WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!entry) return res.status(404).json({ error: 'Entry not found' });
  db.prepare('UPDATE coffee_entries SET logged_at = ? WHERE id = ?').run(timestamp, req.params.id);
  const updated = db.prepare('SELECT * FROM coffee_entries WHERE id = ?').get(req.params.id);
  res.json(updated);
});

router.delete('/entries/:id', requireAuth, (req, res) => {
  const entry = db.prepare('SELECT * FROM coffee_entries WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!entry) return res.status(404).json({ error: 'Entry not found' });
  db.prepare('DELETE FROM coffee_entries WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.get('/stats', requireAuth, (req, res) => {
  const allEntries = db.prepare(
    'SELECT coffee_id, caffeine_mg, logged_at FROM coffee_entries WHERE user_id = ? ORDER BY logged_at'
  ).all(req.user.id);

  const today = new Date().toISOString().slice(0, 10);
  const todayEntries = allEntries.filter(e => dateStr(e.logged_at) === today);

  const byType = {};
  for (const e of allEntries) byType[e.coffee_id] = (byType[e.coffee_id] || 0) + 1;

  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i)); return d.toISOString().slice(0, 10);
  });

  const byDay = {};
  for (const e of allEntries) {
    const d = dateStr(e.logged_at);
    if (!byDay[d]) byDay[d] = { cups: 0, caffeine: 0 };
    byDay[d].cups++;
    byDay[d].caffeine += e.caffeine_mg;
  }

  const sevenDayTotal = allEntries.filter(e => Date.now() - e.logged_at <= 7 * 86400000).length;

  res.json({
    total_cups: allEntries.length,
    today_cups: todayEntries.length,
    today_caffeine: todayEntries.reduce((s, e) => s + e.caffeine_mg, 0),
    total_caffeine: allEntries.reduce((s, e) => s + e.caffeine_mg, 0),
    seven_day_avg: +(sevenDayTotal / 7).toFixed(1),
    by_type: byType,
    last14: last14.map(d => ({ date: d, cups: byDay[d]?.cups || 0, caffeine: byDay[d]?.caffeine || 0 })),
  });
});

module.exports = router;
