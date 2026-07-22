// Shared helpers for route handlers.

// YYYY-MM-DD for a given epoch-millis timestamp.
function dateStr(ts) { return new Date(ts).toISOString().slice(0, 10); }

// YYYY-MM-DD for the current day in UTC.
function todayStr() { return new Date().toISOString().slice(0, 10); }

// YYYY-MM-DD for the current day in the client's local timezone.
// utcOffsetMinutes: minutes east of UTC (e.g. +120 for CET summer, -300 for EST).
function localTodayStr(utcOffsetMinutes) {
  if (utcOffsetMinutes == null) return todayStr();
  return new Date(Date.now() + utcOffsetMinutes * 60000).toISOString().slice(0, 10);
}

// Epoch-millis bounds [start, end] covering a whole calendar day in the client's timezone.
function localDayBounds(localToday, utcOffsetMinutes) {
  if (utcOffsetMinutes == null) {
    const start = new Date(localToday + 'T00:00:00').getTime();
    return { start, end: start + 86400000 - 1 };
  }
  // Parse midnight of localToday as UTC, then shift back by the client offset.
  const start = Date.parse(localToday + 'T00:00:00Z') - utcOffsetMinutes * 60000;
  return { start, end: start + 86400000 - 1 };
}

// Epoch-millis for a specific local wall-clock time (HH:MM) on localToday.
function localTimeMs(localToday, hours, minutes, utcOffsetMinutes) {
  if (utcOffsetMinutes == null) {
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    return new Date(`${localToday}T${hh}:${mm}:00`).getTime();
  }
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  return Date.parse(`${localToday}T${hh}:${mm}:00Z`) - utcOffsetMinutes * 60000;
}

// Epoch-millis bounds [start, end] covering a whole calendar day (UTC-based, legacy).
function dayBounds(dayString) {
  const start = new Date(dayString + 'T00:00:00').getTime();
  const end   = new Date(dayString + 'T23:59:59.999').getTime();
  return { start, end };
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

module.exports = { dateStr, todayStr, localTodayStr, localDayBounds, localTimeMs, dayBounds, DATE_RE };
