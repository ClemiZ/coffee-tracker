// Pool of daily tasks. Each day, a random selection is assigned to the user.
// `check` is the server-side function name used to evaluate completion.
const TASK_POOL = [
  {
    id: 'log_first_coffee',
    label: 'Log your first coffee of the day',
    icon: '☕',
    check: 'hasLoggedToday',
  },
  {
    id: 'try_new_type',
    label: 'Try a coffee type you haven\'t had this week',
    icon: '🆕',
    check: 'triedNewTypeThisWeek',
  },
  {
    id: 'stay_under_limit',
    label: 'Stay under 400mg caffeine',
    icon: '🛡️',
    check: 'stayUnderLimit',
  },
  {
    id: 'log_before_10am',
    label: 'Log a coffee before 10:00 AM',
    icon: '🌅',
    check: 'loggedBefore10am',
  },
  {
    id: 'log_after_3pm',
    label: 'Log a coffee after 3:00 PM',
    icon: '🌆',
    check: 'loggedAfter3pm',
  },
  {
    id: 'two_types',
    label: 'Have at least 2 different coffee types today',
    icon: '🎭',
    check: 'twoTypesToday',
  },
  {
    id: 'three_cups',
    label: 'Log 3 or more coffees today',
    icon: '3️⃣',
    check: 'threeOrMoreCups',
  },
  {
    id: 'have_espresso',
    label: 'Have an espresso today',
    icon: '🟤',
    check: 'hadEspresso',
  },
  {
    id: 'have_latte',
    label: 'Have a latte or latte macchiato today',
    icon: '🥛',
    check: 'hadLatte',
  },
  {
    id: 'under_200mg',
    label: 'Keep caffeine under 200mg today',
    icon: '💚',
    check: 'underTwoHundredMg',
  },
  {
    id: 'log_within_hour_of_waking',
    label: 'Log your first coffee before 8:00 AM',
    icon: '⏰',
    check: 'loggedBefore8am',
  },
  {
    id: 'log_exactly_two',
    label: 'Log exactly 2 coffees today',
    icon: '✌️',
    check: 'exactlyTwoCups',
  },
  {
    id: 'have_doppio',
    label: 'Have a doppio today',
    icon: '💪',
    check: 'hadDoppio',
  },
  {
    id: 'have_cold',
    label: 'Have a frappuccino or cold brew today',
    icon: '🧋',
    check: 'hadColdDrink',
  },
];

const TASKS_PER_DAY = 4;

function getDailyTasks(dateStr, userId) {
  // Deterministic shuffle based on date + userId so the same user always gets
  // the same tasks on a given day but different users get different tasks.
  const seed = [...(dateStr + userId)].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const shuffled = [...TASK_POOL].sort((a, b) => {
    const ha = Math.sin(seed + a.id.length) * 10000;
    const hb = Math.sin(seed + b.id.length) * 10000;
    return (ha - Math.floor(ha)) - (hb - Math.floor(hb));
  });
  return shuffled.slice(0, TASKS_PER_DAY);
}

module.exports = { TASK_POOL, TASKS_PER_DAY, getDailyTasks };
