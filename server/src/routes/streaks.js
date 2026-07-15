const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/streaks — current user's streak + combo data
router.get('/', requireAuth, (req, res) => {
  const streak = db.prepare('SELECT * FROM user_streaks WHERE user_id = ?').get(req.user.id) || {
    current_streak: 0, longest_streak: 0, last_goal_date: null, goals_completed: 0,
  };
  const combo = db.prepare('SELECT * FROM user_combos WHERE user_id = ?').get(req.user.id) || {
    current_combo: 0, highest_combo: 0, last_coffee_at: null,
  };

  // A combo resets if more than 2 hours have passed since the last coffee
  const COMBO_WINDOW = 2 * 60 * 60 * 1000;
  const activeCombo = combo.last_coffee_at && Date.now() - combo.last_coffee_at < COMBO_WINDOW
    ? combo.current_combo
    : 0;

  res.json({ streak, combo: { ...combo, active: activeCombo } });
});

module.exports = router;
