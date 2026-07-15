const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { checkBadgeForRanking } = require('../achievements');

const router = express.Router();

// GET /api/rankings?period=daily|weekly|alltime
router.get('/', requireAuth, (req, res) => {
  const { period = 'alltime' } = req.query;

  let cutoff = 0;
  if (period === 'daily')  cutoff = Date.now() - 86400000;
  if (period === 'weekly') cutoff = Date.now() - 7 * 86400000;

  const rows = db.prepare(`
    SELECT u.id, u.username, u.avatar,
           COUNT(ce.id) AS cups,
           COALESCE(SUM(ce.caffeine_mg), 0) AS total_caffeine
    FROM users u
    LEFT JOIN coffee_entries ce ON ce.user_id = u.id AND ce.logged_at >= ?
    GROUP BY u.id
    ORDER BY total_caffeine DESC
    LIMIT 50
  `).all(cutoff);

  const ranked = rows.map((r, i) => ({ ...r, rank: i + 1 }));

  // Check rank_1 badge for the all-time leader
  if (period === 'alltime' && ranked.length > 0) {
    checkBadgeForRanking(ranked[0].id);
  }

  const myRank = ranked.find(r => r.id === req.user.id);
  res.json({ rankings: ranked, my_rank: myRank || null });
});

module.exports = router;
