const express = require('express');
const { randomUUID } = require('crypto');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const {
  checkAfterChallengeWin,
  checkAfterFirstChallenge,
} = require('../achievements');

const router = express.Router();

function todayStr() { return new Date().toISOString().slice(0, 10); }

function getChallengeProgress(challengeId, metric, startDate, participants) {
  const start = new Date(startDate + 'T00:00:00').getTime();
  const userIds = participants.map(p => p.user_id);
  if (userIds.length === 0) return 0;

  const placeholders = userIds.map(() => '?').join(',');
  switch (metric) {
    case 'espresso_cups': {
      const r = db.prepare(
        `SELECT COUNT(*) as cnt FROM coffee_entries WHERE user_id IN (${placeholders}) AND coffee_id IN ('espresso','espresso_mac') AND logged_at >= ?`
      ).get(...userIds, start);
      return r.cnt;
    }
    case 'caffeine': {
      const r = db.prepare(
        `SELECT COALESCE(SUM(caffeine_mg),0) as total FROM coffee_entries WHERE user_id IN (${placeholders}) AND logged_at >= ?`
      ).get(...userIds, start);
      return r.total;
    }
    case 'unique_types': {
      const r = db.prepare(
        `SELECT COUNT(DISTINCT coffee_id) as cnt FROM coffee_entries WHERE user_id IN (${placeholders}) AND logged_at >= ?`
      ).get(...userIds, start);
      return r.cnt;
    }
    case 'total_cups': {
      const r = db.prepare(
        `SELECT COUNT(*) as cnt FROM coffee_entries WHERE user_id IN (${placeholders}) AND logged_at >= ?`
      ).get(...userIds, start);
      return r.cnt;
    }
    default:
      return 0;
  }
}

function getUserChallengeProgress(challengeId, metric, startDate, userId) {
  const start = new Date(startDate + 'T00:00:00').getTime();
  switch (metric) {
    case 'espresso_cups': {
      const r = db.prepare(
        "SELECT COUNT(*) as cnt FROM coffee_entries WHERE user_id = ? AND coffee_id IN ('espresso','espresso_mac') AND logged_at >= ?"
      ).get(userId, start);
      return r.cnt;
    }
    case 'caffeine': {
      const r = db.prepare(
        'SELECT COALESCE(SUM(caffeine_mg),0) as total FROM coffee_entries WHERE user_id = ? AND logged_at >= ?'
      ).get(userId, start);
      return r.total;
    }
    case 'unique_types': {
      const r = db.prepare(
        'SELECT COUNT(DISTINCT coffee_id) as cnt FROM coffee_entries WHERE user_id = ? AND logged_at >= ?'
      ).get(userId, start);
      return r.cnt;
    }
    case 'total_cups': {
      const r = db.prepare(
        'SELECT COUNT(*) as cnt FROM coffee_entries WHERE user_id = ? AND logged_at >= ?'
      ).get(userId, start);
      return r.cnt;
    }
    default:
      return 0;
  }
}

function seedCommunityChallenges() {
  const existing = db.prepare("SELECT COUNT(*) as cnt FROM challenges WHERE type = 'community'").get();
  if (existing.cnt > 0) return;

  const today = new Date();
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);
  const monthEnd = new Date(today);
  monthEnd.setDate(today.getDate() + 30);
  const todayStr2 = today.toISOString().slice(0, 10);

  const challenges = [
    { id: randomUUID(), name: 'Espresso Week', description: 'As a community, drink 500 espressos this week!', metric: 'espresso_cups', target: 500, end: weekEnd },
    { id: randomUUID(), name: 'Caffeine Collective', description: 'Reach 100,000mg of caffeine together this month!', metric: 'caffeine', target: 100000, end: monthEnd },
    { id: randomUUID(), name: 'Variety Show', description: 'Try all 13 coffee types as a community this week!', metric: 'unique_types', target: 13, end: weekEnd },
  ];

  const insert = db.prepare(
    'INSERT INTO challenges (id, type, creator_id, name, description, metric, target, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  for (const c of challenges) {
    insert.run(c.id, 'community', null, c.name, c.description, c.metric, c.target, todayStr2, c.end.toISOString().slice(0, 10), 'active');
  }
}

seedCommunityChallenges();

router.get('/', requireAuth, (req, res) => {
  const challenges = db.prepare(
    "SELECT * FROM challenges WHERE status = 'active' ORDER BY type, end_date"
  ).all();

  const result = challenges.map(c => {
    const participants = db.prepare(
      'SELECT cp.*, u.username FROM challenge_participants cp JOIN users u ON u.id = cp.user_id WHERE cp.challenge_id = ?'
    ).all(c.id);
    const communityProgress = getChallengeProgress(c.id, c.metric, c.start_date, participants);
    const myProgress = participants.some(p => p.user_id === req.user.id)
      ? getUserChallengeProgress(c.id, c.metric, c.start_date, req.user.id)
      : null;

    return {
      ...c,
      participants_count: participants.length,
      community_progress: communityProgress,
      my_progress: myProgress,
      joined: participants.some(p => p.user_id === req.user.id),
    };
  });

  res.json(result);
});

router.post('/', requireAuth, (req, res) => {
  const { name, description, metric, target, endDate } = req.body;
  if (!name || !metric || !target || !endDate) return res.status(400).json({ error: 'Missing fields' });

  const validMetrics = ['total_cups', 'caffeine', 'espresso_cups', 'unique_types'];
  if (!validMetrics.includes(metric)) return res.status(400).json({ error: 'Invalid metric' });

  const id = randomUUID();
  const today = todayStr();
  db.prepare(
    'INSERT INTO challenges (id, type, creator_id, name, description, metric, target, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, 'personal', req.user.id, name, description || '', metric, target, today, endDate, 'active');

  db.prepare(
    'INSERT INTO challenge_participants (id, challenge_id, user_id, joined_at) VALUES (?, ?, ?, ?)'
  ).run(randomUUID(), id, req.user.id, Date.now());

  const challenge = db.prepare('SELECT * FROM challenges WHERE id = ?').get(id);
  res.json(challenge);
});

router.post('/:id/join', requireAuth, (req, res) => {
  const challenge = db.prepare("SELECT * FROM challenges WHERE id = ? AND status = 'active'").get(req.params.id);
  if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

  const existing = db.prepare('SELECT id FROM challenge_participants WHERE challenge_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (existing) return res.status(409).json({ error: 'Already joined' });

  db.prepare(
    'INSERT INTO challenge_participants (id, challenge_id, user_id, joined_at) VALUES (?, ?, ?, ?)'
  ).run(randomUUID(), req.params.id, req.user.id, Date.now());

  const unlocked = checkAfterFirstChallenge(req.user.id);
  res.json({ ok: true, unlocked });
});

router.get('/:id', requireAuth, (req, res) => {
  const challenge = db.prepare('SELECT * FROM challenges WHERE id = ?').get(req.params.id);
  if (!challenge) return res.status(404).json({ error: 'Not found' });

  const participants = db.prepare(
    'SELECT cp.*, u.username FROM challenge_participants cp JOIN users u ON u.id = cp.user_id WHERE cp.challenge_id = ?'
  ).all(challenge.id);
  const communityProgress = getChallengeProgress(challenge.id, challenge.metric, challenge.start_date, participants);

  const now = new Date();
  const endDate = new Date(challenge.end_date + 'T23:59:59');

  if (challenge.type === 'community' && communityProgress >= challenge.target && challenge.status === 'active') {
    db.prepare("UPDATE challenges SET status = 'completed' WHERE id = ?").run(challenge.id);
    for (const p of participants) {
      db.prepare('UPDATE challenge_participants SET completed = 1 WHERE challenge_id = ? AND user_id = ?').run(challenge.id, p.user_id);
      checkAfterChallengeWin(p.user_id);
    }
  } else if (now > endDate && challenge.status === 'active') {
    db.prepare("UPDATE challenges SET status = 'completed' WHERE id = ?").run(challenge.id);
    if (challenge.type === 'personal') {
      const myProgress = getUserChallengeProgress(challenge.id, challenge.metric, challenge.start_date, req.user.id);
      if (myProgress >= challenge.target) {
        db.prepare('UPDATE challenge_participants SET completed = 1 WHERE challenge_id = ? AND user_id = ?').run(challenge.id, req.user.id);
        checkAfterChallengeWin(req.user.id);
      }
    }
  }

  res.json({
    ...challenge,
    participants_count: participants.length,
    participants: participants.map(p => ({
      username: p.username,
      progress: getUserChallengeProgress(challenge.id, challenge.metric, challenge.start_date, p.user_id),
    })),
    community_progress: communityProgress,
    my_progress: getUserChallengeProgress(challenge.id, challenge.metric, challenge.start_date, req.user.id),
    joined: participants.some(p => p.user_id === req.user.id),
  });
});

module.exports = router;
