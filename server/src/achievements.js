const { randomUUID } = require('crypto');
const db = require('./db');
const { ACHIEVEMENTS } = require('./data/achievements');
const { BADGES } = require('./data/badges');
const { COFFEES } = require('./data/coffees');

function dateStr(ts) { return new Date(ts).toISOString().slice(0, 10); }
function todayStr()   { return new Date().toISOString().slice(0, 10); }

function unlockAchievement(userId, achievementId) {
  const already = db.prepare(
    'SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?'
  ).get(userId, achievementId);
  if (already) return null;

  const def = ACHIEVEMENTS.find(a => a.id === achievementId);
  if (!def) return null;

  db.prepare(
    'INSERT INTO user_achievements (id, user_id, achievement_id, unlocked_at) VALUES (?, ?, ?, ?)'
  ).run(randomUUID(), userId, achievementId, Date.now());

  checkBadgesForAchievement(userId, achievementId);
  return def;
}

function unlockBadge(userId, badgeId) {
  const already = db.prepare(
    'SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?'
  ).get(userId, badgeId);
  if (already) return null;

  const def = BADGES.find(b => b.id === badgeId);
  if (!def) return null;

  db.prepare(
    'INSERT INTO user_badges (id, user_id, badge_id, unlocked_at) VALUES (?, ?, ?, ?)'
  ).run(randomUUID(), userId, badgeId, Date.now());
  return def;
}

function checkBadgesForAchievement(userId, achievementId) {
  for (const badge of BADGES) {
    if (badge.requirement.type === 'achievement' && badge.requirement.achievementId === achievementId) {
      unlockBadge(userId, badge.id);
    }
  }
}

function checkBadgeForRanking(userId) {
  const row = db.prepare(`
    SELECT u.id,
           SUM(ce.caffeine_mg) AS total_caf
    FROM users u
    JOIN coffee_entries ce ON ce.user_id = u.id
    GROUP BY u.id
    ORDER BY total_caf DESC
    LIMIT 1
  `).get();
  if (row && row.id === userId) {
    unlockBadge(userId, 'rank_1');
  }
}

function checkAfterCoffeeLog(userId) {
  const unlocked = [];

  const allEntries = db.prepare(
    'SELECT coffee_id, caffeine_mg, logged_at FROM coffee_entries WHERE user_id = ? ORDER BY logged_at'
  ).all(userId);

  const totalCups     = allEntries.length;
  const totalCaffeine = allEntries.reduce((s, e) => s + e.caffeine_mg, 0);
  const todayEntries  = allEntries.filter(e => dateStr(e.logged_at) === todayStr());
  const todayCaffeine = todayEntries.reduce((s, e) => s + e.caffeine_mg, 0);
  const seenTypes     = new Set(allEntries.map(e => e.coffee_id));
  const latestTs      = allEntries[allEntries.length - 1]?.logged_at;
  const latestHour    = latestTs ? new Date(latestTs).getHours() : -1;

  // Volume
  if (totalCups >= 1)   unlocked.push(..._try(userId, 'first_sip'));
  if (totalCups >= 10)  unlocked.push(..._try(userId, 'ten_cups'));
  if (totalCups >= 50)  unlocked.push(..._try(userId, 'fifty_cups'));
  if (totalCups >= 100) unlocked.push(..._try(userId, 'hundred_cups'));
  if (totalCups >= 500) unlocked.push(..._try(userId, 'five_hundred_cups'));

  // Caffeine total
  if (totalCaffeine >= 1000)  unlocked.push(..._try(userId, 'caffeine_1000'));
  if (totalCaffeine >= 10000) unlocked.push(..._try(userId, 'caffeine_10000'));

  // Daily caffeine thresholds
  if (todayCaffeine >= 500)  unlocked.push(..._try(userId, 'overdrive_day'));
  if (todayCaffeine >= 1000) unlocked.push(..._try(userId, 'gone_day'));

  // Variety
  if (seenTypes.size >= 3)               unlocked.push(..._try(userId, 'variety_3'));
  if (seenTypes.size >= 7)               unlocked.push(..._try(userId, 'variety_7'));
  if (seenTypes.size >= COFFEES.length)  unlocked.push(..._try(userId, 'variety_all'));

  // Time of day
  if (latestHour < 7 && latestHour >= 0) unlocked.push(..._try(userId, 'early_bird'));
  if (latestHour >= 22)                   unlocked.push(..._try(userId, 'night_owl'));

  // Morning ritual
  unlocked.push(...checkMorningRitual(userId, allEntries));

  // Combo
  unlocked.push(...checkCombo(userId, todayEntries));

  // Secret: decaf spy
  const last2 = allEntries.slice(-2);
  if (last2.length === 2 && last2[0].coffee_id === 'hot_chocolate' && last2[1].coffee_id === 'espresso') {
    unlocked.push(..._try(userId, 'decaf_spy'));
  }

  // Secret: monochrome
  if (totalCups >= 10 && seenTypes.size === 1) {
    unlocked.push(..._try(userId, 'monochrome'));
  }

  // Secret: coffee_loop
  unlocked.push(...checkCoffeeLoop(userId, allEntries));

  // Increment casualties if user just crossed 400mg today
  const lastEntry = allEntries[allEntries.length - 1];
  const prevCaffeine = todayCaffeine - (lastEntry?.caffeine_mg || 0);
  if (prevCaffeine < 400 && todayCaffeine >= 400) {
    db.prepare('UPDATE coffee_casualties SET count = count + 1 WHERE id = 1').run();
  }

  return unlocked;
}

function checkCombo(userId, todayEntries) {
  const unlocked = [];
  if (todayEntries.length < 2) return unlocked;
  const now = todayEntries[todayEntries.length - 1].logged_at;
  const window = 2 * 60 * 60 * 1000;
  const inWindow = todayEntries.filter(e => now - e.logged_at <= window);
  const current = inWindow.length;

  const combo = db.prepare('SELECT * FROM user_combos WHERE user_id = ?').get(userId);
  if (!combo) {
    db.prepare(
      'INSERT INTO user_combos (user_id, current_combo, highest_combo, last_coffee_at) VALUES (?, ?, ?, ?)'
    ).run(userId, current, current, now);
  } else {
    const highest = Math.max(combo.highest_combo, current);
    db.prepare(
      'UPDATE user_combos SET current_combo = ?, highest_combo = ?, last_coffee_at = ? WHERE user_id = ?'
    ).run(current, highest, now, userId);
  }

  if (current >= 3) unlocked.push(..._try(userId, 'combo_3'));
  if (current >= 5) unlocked.push(..._try(userId, 'combo_5'));
  return unlocked;
}

function checkMorningRitual(userId, allEntries) {
  if (allEntries.length < 5) return [];
  const byDay = {};
  for (const e of allEntries) {
    const d = dateStr(e.logged_at);
    if (!byDay[d]) byDay[d] = e.logged_at;
  }
  const days = Object.keys(byDay).sort();
  if (days.length < 5) return [];
  const last5 = days.slice(-5);
  const hours = last5.map(d => new Date(byDay[d]).getHours() * 60 + new Date(byDay[d]).getMinutes());
  const baseMin = hours[0];
  if (hours.every(m => Math.abs(m - baseMin) <= 30)) return _try(userId, 'morning_ritual');
  return [];
}

function checkCoffeeLoop(userId, allEntries) {
  if (allEntries.length < 9) return [];
  const byDay = {};
  for (const e of allEntries) {
    const d = dateStr(e.logged_at);
    if (!byDay[d]) byDay[d] = [];
    byDay[d].push(e.coffee_id);
  }
  const days = Object.keys(byDay).sort().slice(-3);
  if (days.length < 3) return [];
  const seqs = days.map(d => byDay[d].slice(0, 3).join(','));
  if (seqs[0] === seqs[1] && seqs[1] === seqs[2]) return _try(userId, 'coffee_loop');
  return [];
}

function checkAfterGoalsComplete(userId) {
  const unlocked = [];
  const streak = db.prepare('SELECT * FROM user_streaks WHERE user_id = ?').get(userId);
  const total = streak?.goals_completed || 0;

  if (!streak) {
    db.prepare(
      'INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_goal_date, goals_completed) VALUES (?, 1, 1, ?, 1)'
    ).run(userId, todayStr());
  } else {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    const isConsecutive = streak.last_goal_date === yesterdayStr;
    const newStreak = isConsecutive ? streak.current_streak + 1 : 1;
    const longest   = Math.max(streak.longest_streak, newStreak);
    db.prepare(
      'UPDATE user_streaks SET current_streak = ?, longest_streak = ?, last_goal_date = ?, goals_completed = ? WHERE user_id = ?'
    ).run(newStreak, longest, todayStr(), total + 1, userId);

    if (newStreak >= 3)  unlocked.push(..._try(userId, 'streak_3'));
    if (newStreak >= 7)  unlocked.push(..._try(userId, 'streak_7'));
    if (newStreak >= 30) unlocked.push(..._try(userId, 'streak_30'));
  }

  const newTotal = total + 1;
  if (newTotal === 1)  unlocked.push(..._try(userId, 'first_goal_complete'));
  if (newTotal >= 10) unlocked.push(..._try(userId, 'goals_10'));

  return unlocked;
}

function checkAfterCompare(userId, comparedWithId) {
  const unlocked = [];

  const existing = db.prepare(
    'SELECT id FROM compare_history WHERE user_id = ? AND compared_with = ?'
  ).get(userId, comparedWithId);
  if (!existing) {
    db.prepare(
      'INSERT INTO compare_history (id, user_id, compared_with, compared_at) VALUES (?, ?, ?, ?)'
    ).run(randomUUID(), userId, comparedWithId, Date.now());
  }

  const uniqueCount = db.prepare(
    'SELECT COUNT(DISTINCT compared_with) AS cnt FROM compare_history WHERE user_id = ?'
  ).get(userId).cnt;

  if (uniqueCount >= 1) unlocked.push(..._try(userId, 'first_compare'));
  if (uniqueCount >= 5) unlocked.push(..._try(userId, 'compare_5'));

  return unlocked;
}

function checkAfterChallengeWin(userId) {
  const unlocked = [];
  unlocked.push(..._try(userId, 'challenge_win'));

  const wins = db.prepare(
    'SELECT COUNT(*) AS cnt FROM challenge_participants WHERE user_id = ? AND completed = 1'
  ).get(userId).cnt;
  if (wins >= 3) {
    const b = unlockBadge(userId, 'challenge_champion');
    if (b) unlocked.push({ type: 'badge', ...b });
  }

  return unlocked;
}

function checkAfterFirstChallenge(userId) {
  return _try(userId, 'first_challenge');
}

function _try(userId, achievementId) {
  const def = unlockAchievement(userId, achievementId);
  if (!def) return [];
  return [{ type: 'achievement', ...def }];
}

module.exports = {
  unlockAchievement,
  unlockBadge,
  checkBadgeForRanking,
  checkAfterCoffeeLog,
  checkAfterGoalsComplete,
  checkAfterCompare,
  checkAfterChallengeWin,
  checkAfterFirstChallenge,
};
