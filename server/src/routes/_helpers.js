// Shared helpers for route handlers.

// YYYY-MM-DD for a given epoch-millis timestamp.
function dateStr(ts) { return new Date(ts).toISOString().slice(0, 10); }

// YYYY-MM-DD for the current day.
function todayStr() { return new Date().toISOString().slice(0, 10); }

// Epoch-millis bounds [start, end] covering a whole calendar day.
function dayBounds(dayString) {
  const start = new Date(dayString + 'T00:00:00').getTime();
  const end   = new Date(dayString + 'T23:59:59.999').getTime();
  return { start, end };
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

module.exports = { dateStr, todayStr, dayBounds, DATE_RE };
