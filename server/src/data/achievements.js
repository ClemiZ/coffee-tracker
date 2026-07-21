const ACHIEVEMENTS = [
  // ── Volume milestones ──────────────────────────────────────────────────────
  {
    id: 'first_sip',
    name: 'First Sip',
    description: 'Log your very first coffee',
    icon: '☕',
    secret: false,
    category: 'milestone',
  },
  {
    id: 'ten_cups',
    name: 'Getting Started',
    description: 'Log 10 total coffees',
    icon: '🔟',
    secret: false,
    category: 'milestone',
  },
  {
    id: 'fifty_cups',
    name: 'Regular',
    description: 'Log 50 total coffees',
    icon: '📈',
    secret: false,
    category: 'milestone',
  },
  {
    id: 'hundred_cups',
    name: 'Century',
    description: 'Log 100 total coffees',
    icon: '💯',
    secret: false,
    category: 'milestone',
  },
  {
    id: 'five_hundred_cups',
    name: 'Coffee Legend',
    description: 'Log 500 total coffees',
    icon: '🏆',
    secret: false,
    category: 'milestone',
  },

  // ── Caffeine milestones ────────────────────────────────────────────────────
  {
    id: 'caffeine_1000',
    name: 'Caffeinated',
    description: 'Consume 1,000mg caffeine total',
    icon: '⚡',
    secret: false,
    category: 'caffeine',
  },
  {
    id: 'caffeine_10000',
    name: 'Caffeine Machine',
    description: 'Consume 10,000mg caffeine total',
    icon: '🔋',
    secret: false,
    category: 'caffeine',
  },
  {
    id: 'overdrive_day',
    name: 'Into the Red',
    description: 'Reach Overdrive in a single day (500mg+)',
    icon: '🔥',
    secret: true,
    category: 'caffeine',
  },
  {
    id: 'gone_day',
    name: 'Flatlined',
    description: 'Reach the Gone theme... somehow survive',
    icon: '⬛',
    secret: true,
    category: 'caffeine',
  },

  // ── Variety ────────────────────────────────────────────────────────────────
  {
    id: 'variety_3',
    name: 'Explorer',
    description: 'Try 3 different coffee types',
    icon: '🗺️',
    secret: false,
    category: 'variety',
  },
  {
    id: 'variety_7',
    name: 'Connoisseur',
    description: 'Try 7 different coffee types',
    icon: '🎩',
    secret: false,
    category: 'variety',
  },
  {
    id: 'variety_all',
    name: 'Full Menu',
    description: 'Try every coffee type on the menu',
    icon: '📋',
    secret: false,
    category: 'variety',
  },

  // ── Time of day ────────────────────────────────────────────────────────────
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Log a coffee before 7:00 AM',
    icon: '🌅',
    secret: false,
    category: 'time',
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Log a coffee after 10:00 PM',
    icon: '🦉',
    secret: true,
    category: 'time',
  },
  {
    id: 'morning_ritual',
    name: 'Morning Ritual',
    description: 'Log coffee at the same time (±30min) for 5 consecutive days',
    icon: '⏰',
    secret: true,
    category: 'time',
  },

  // ── Streaks ────────────────────────────────────────────────────────────────
  {
    id: 'streak_3',
    name: 'On a Roll',
    description: 'Complete daily goals 3 days in a row',
    icon: '🔥',
    secret: false,
    category: 'streak',
  },
  {
    id: 'streak_7',
    name: 'Committed',
    description: 'Complete daily goals 7 days in a row',
    icon: '🔥🔥',
    secret: false,
    category: 'streak',
  },
  {
    id: 'streak_30',
    name: 'Unstoppable',
    description: 'Complete daily goals 30 days in a row',
    icon: '🔥🔥🔥',
    secret: false,
    category: 'streak',
  },

  // ── Combos ─────────────────────────────────────────────────────────────────
  {
    id: 'combo_3',
    name: 'Triple Shot',
    description: 'Log 3 coffees within 2 hours',
    icon: '⚡',
    secret: false,
    category: 'combo',
  },
  {
    id: 'combo_5',
    name: 'Quintuple Shot',
    description: 'Log 5 coffees within 2 hours',
    icon: '💥',
    secret: false,
    category: 'combo',
  },

  // ── Goals ──────────────────────────────────────────────────────────────────
  {
    id: 'first_goal_complete',
    name: 'Goal-Getter',
    description: 'Complete all daily goals for the first time',
    icon: '✅',
    secret: false,
    category: 'goals',
  },
  {
    id: 'goals_10',
    name: 'Disciplined',
    description: 'Complete all daily goals 10 times',
    icon: '📊',
    secret: false,
    category: 'goals',
  },

  // ── Social ─────────────────────────────────────────────────────────────────
  {
    id: 'first_compare',
    name: 'How Do You Compare?',
    description: 'Compare stats with another user for the first time',
    icon: '⚖️',
    secret: false,
    category: 'social',
  },
  {
    id: 'compare_5',
    name: 'Competitive',
    description: 'Compare stats with 5 different users',
    icon: '🏅',
    secret: false,
    category: 'social',
  },

  // ── Challenges ─────────────────────────────────────────────────────────────
  {
    id: 'first_challenge',
    name: 'Up for a Challenge',
    description: 'Complete your first challenge',
    icon: '🎯',
    secret: false,
    category: 'challenge',
  },
  {
    id: 'challenge_win',
    name: 'Champion',
    description: 'Win a community challenge',
    icon: '🥇',
    secret: false,
    category: 'challenge',
  },

  // ── Secret easter eggs ─────────────────────────────────────────────────────
  {
    id: 'decaf_spy',
    name: 'Decaf Spy',
    description: 'A beverage of deception, followed by the real thing',
    icon: '🕵️',
    secret: true,
    category: 'secret',
  },
  {
    id: 'coffee_loop',
    name: 'Coffee Loop',
    description: 'Same pattern, day after day after day...',
    icon: '🔄',
    secret: true,
    category: 'secret',
  },
  {
    id: 'monochrome',
    name: 'Monochrome',
    description: 'One type. Only ever one type. Always.',
    icon: '🎯',
    secret: true,
    category: 'secret',
  },
];

module.exports = { ACHIEVEMENTS };
