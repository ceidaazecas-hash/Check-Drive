/**
 * Week Date Range and Deadline Manager (Week 1 through Week 18)
 * Supports:
 * - 1 Class per Week (Due on class day, Friday, Sunday, or custom day)
 * - 2 Classes per Week for the same module (Due on 1st class, 2nd class, or weekend)
 * - Custom individual week overrides
 * - Business days late calculation
 */

export const DEFAULT_SEMESTER_START = '2026-11-09'; // Current semester start (November 2026)

export const WEEKDAYS = [
  { value: 1, label: 'Mon', full: 'Monday' },
  { value: 2, label: 'Tue', full: 'Tuesday' },
  { value: 3, label: 'Wed', full: 'Wednesday' },
  { value: 4, label: 'Thu', full: 'Thursday' },
  { value: 5, label: 'Fri', full: 'Friday' },
  { value: 6, label: 'Sat', full: 'Saturday' },
  { value: 0, label: 'Sun', full: 'Sunday' }
];

/**
 * Safely parse YYYY-MM-DD cleanly in local timezone
 */
export function parseLocalDate(dateString) {
  if (!dateString) return new Date();
  const parts = String(dateString).split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m, d, 0, 0, 0, 0);
    }
  }
  const parsed = new Date(dateString);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Formats a Date object to YYYY-MM-DD for date inputs
 */
export function formatDateInput(dateObj) {
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Formats hours (0-23) and minutes (0-59) to 12-hour AM/PM string (e.g. "11:59 PM")
 */
export function format12HourTime(hours, minutes) {
  const h = hours % 12 || 12;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const m = String(minutes).padStart(2, '0');
  const hStr = String(h).padStart(2, '0');
  return `${hStr}:${m} ${ampm}`;
}

/**
 * Parses user input like "11:59 pm", "5:00 pm", "17:00", "23:59" into { hours, minutes }
 */
export function parseTimeString(timeStr) {
  if (!timeStr) return { hours: 23, minutes: 59 };
  const clean = timeStr.trim().toLowerCase();

  const match12 = clean.match(/^(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?$/i);
  if (match12) {
    let h = parseInt(match12[1], 10);
    const m = match12[2] ? parseInt(match12[2], 10) : 0;
    const isPm = match12[3]?.toLowerCase() === 'pm';
    const isAm = match12[3]?.toLowerCase() === 'am';

    if (isPm && h < 12) h += 12;
    if (isAm && h === 12) h = 0;
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return { hours: h, minutes: m };
    }
  }

  const match24 = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const h = parseInt(match24[1], 10);
    const m = parseInt(match24[2], 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return { hours: h, minutes: m };
    }
  }

  return { hours: 23, minutes: 59 };
}

/**
 * Calculate 18 weeks of deadlines with smart support for:
 * - 1 class per week (due on class day, Friday, Sunday, or custom day)
 * - 2 classes per week (due on 1st class, 2nd class, or weekend)
 */
export function calculateWeekDeadlines({
  startDateString = DEFAULT_SEMESTER_START,
  dueRule = 'same_day', // 'same_day', '2nd_class', 'friday', 'sunday', 'custom_day'
  secondClassOffset = 2, // e.g. +2 days (Wed->Fri) or +3 days (Mon->Thu, Tue->Fri)
  customTargetDay = 5,   // 0 = Sun, 1 = Mon, ..., 5 = Fri
  defaultHours = 17,     // Default 5:00 PM or 11:59 PM
  defaultMinutes = 0
}) {
  const weeks = [];
  const start = parseLocalDate(startDateString || DEFAULT_SEMESTER_START);
  const startDayOfWeek = start.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

  // Determine deadline day offset from week's 1st class
  let offsetDays = 0;
  if (dueRule === 'same_day') {
    offsetDays = 0;
  } else if (dueRule === '2nd_class') {
    offsetDays = Number(secondClassOffset) || 2;
  } else if (dueRule === 'friday') {
    offsetDays = (5 - startDayOfWeek + 7) % 7;
  } else if (dueRule === 'sunday') {
    offsetDays = (7 - startDayOfWeek) % 7;
    if (offsetDays === 0 && startDayOfWeek !== 0) offsetDays = 7;
    if (startDayOfWeek === 0) offsetDays = 0;
  } else if (dueRule === 'custom_day') {
    offsetDays = (customTargetDay - startDayOfWeek + 7) % 7;
  }

  for (let i = 1; i <= 18; i++) {
    const weekStart = new Date(start);
    weekStart.setDate(start.getDate() + (i - 1) * 7);
    weekStart.setHours(0, 0, 0, 0);

    const deadlineDate = new Date(weekStart);
    deadlineDate.setDate(weekStart.getDate() + offsetDays);
    deadlineDate.setHours(defaultHours, defaultMinutes, 59, 999);

    const weekName = `Week ${i}`;
    const dateStr = formatDateInput(deadlineDate);
    const timeStr = format12HourTime(defaultHours, defaultMinutes);
    const dayName = deadlineDate.toLocaleDateString('en-US', { weekday: 'short' });

    weeks.push({
      weekNumber: i,
      name: weekName,
      startDateIso: weekStart.toISOString(),
      endDateIso: deadlineDate.toISOString(),
      endDate: deadlineDate.toISOString(), // Alias for safety
      deadlineIso: deadlineDate.toISOString(),
      dateString: dateStr,
      timeString: timeStr,
      dayOfWeek: dayName,
      formattedRange: `${formatShortDate(weekStart)} (${dayName})`,
      formattedDeadline: formatShortDateTime(deadlineDate)
    });
  }

  return weeks;
}

/**
 * Standard generator function compatible with all components
 */
export function generateDefaultWeekRanges(
  startDateString = DEFAULT_SEMESTER_START,
  defaultHours = 23,
  defaultMinutes = 59,
  dueRule = 'same_day',
  secondClassOffset = 2
) {
  return calculateWeekDeadlines({
    startDateString,
    dueRule,
    secondClassOffset,
    defaultHours,
    defaultMinutes
  });
}

/**
 * Count business days late (excluding Saturdays and Sundays)
 */
export function countBusinessDaysLate(deadlineDate, fileDate) {
  let count = 0;
  const cur = new Date(deadlineDate);
  cur.setHours(0, 0, 0, 0);

  const target = new Date(fileDate);
  target.setHours(0, 0, 0, 0);

  while (cur < target) {
    cur.setDate(cur.getDate() + 1);
    const day = cur.getDay();
    if (day !== 0 && day !== 6) { // Exclude Sunday (0) and Saturday (6)
      count++;
    }
  }

  return Math.max(1, count);
}

/**
 * Check if a file submission is On Time or Late (L), excluding weekends
 */
export function getSubmissionStatus(fileTimestampIso, deadlineIso) {
  if (!fileTimestampIso || !deadlineIso) {
    return { status: 'UNKNOWN', label: 'On Time', isLate: false, daysLate: 0 };
  }

  const fileDate = new Date(fileTimestampIso);
  const deadlineDate = new Date(deadlineIso);

  if (fileDate.getTime() <= deadlineDate.getTime()) {
    return {
      status: 'ON_TIME',
      label: 'On Time',
      isLate: false,
      daysLate: 0
    };
  }

  const daysLate = countBusinessDaysLate(deadlineDate, fileDate);

  return {
    status: 'LATE',
    label: `L (${daysLate}d late)`,
    isLate: true,
    daysLate
  };
}

export function formatShortDate(dateObj) {
  return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatShortDateTime(dateObj) {
  return dateObj.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}
