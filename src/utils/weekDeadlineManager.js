/**
 * Week Date Range and Deadline Manager (Week 1 through Week 18, Monday - Friday business days)
 */

export const DEFAULT_SEMESTER_START = '2026-06-08'; // Monday June 8, 2026

/**
 * Generate 18 weeks of date ranges and deadlines based on a start date (Monday to Friday, excluding Sat/Sun)
 * @param {string} startDateString - ISO YYYY-MM-DD string for Semester Week 1 Monday
 * @param {number} defaultHours - Default deadline hour (default: 23 for 11:59 PM)
 * @param {number} defaultMinutes - Default deadline minute (default: 59)
 * @returns {Array} Array of 18 week objects
 */
export function generateDefaultWeekRanges(startDateString = DEFAULT_SEMESTER_START, defaultHours = 23, defaultMinutes = 59) {
  const weeks = [];
  
  // Parse YYYY-MM-DD cleanly in local timezone
  const parts = startDateString.split('-');
  const start = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 0, 0, 0, 0);

  for (let i = 1; i <= 18; i++) {
    // Week start is Monday
    const weekStart = new Date(start);
    weekStart.setDate(start.getDate() + (i - 1) * 7);
    weekStart.setHours(0, 0, 0, 0);

    // Week end is Friday (+4 days from Monday), excluding Saturday and Sunday
    const weekFriday = new Date(weekStart);
    weekFriday.setDate(weekStart.getDate() + 4);
    weekFriday.setHours(defaultHours, defaultMinutes, 59, 999);

    const weekName = `Week ${i}`;

    weeks.push({
      weekNumber: i,
      name: weekName,
      startDateIso: weekStart.toISOString(),
      endDateIso: weekFriday.toISOString(),
      deadlineIso: weekFriday.toISOString(),
      dateString: formatDateInput(weekFriday),
      timeString: format12HourTime(defaultHours, defaultMinutes),
      formattedRange: `${formatShortDate(weekStart)} - ${formatShortDate(weekFriday)}`,
      formattedDeadline: formatShortDateTime(weekFriday)
    });
  }

  return weeks;
}

/**
 * Formats a Date object to YYYY-MM-DD for date inputs
 */
export function formatDateInput(dateObj) {
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
