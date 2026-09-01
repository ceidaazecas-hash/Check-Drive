/**
 * Week Date Range and Deadline Manager (Week 1 through Week 18, Monday - Friday business days)
 */

export const DEFAULT_SEMESTER_START = '2026-06-08'; // Monday June 8, 2026

/**
 * Generate 18 weeks of date ranges and deadlines based on a start date (Monday to Friday, excluding Sat/Sun)
 * @param {string} startDateString - ISO YYYY-MM-DD string for Semester Week 1 Monday
 * @returns {Array} Array of 18 week objects
 */
export function generateDefaultWeekRanges(startDateString = DEFAULT_SEMESTER_START) {
  const weeks = [];
  const start = new Date(startDateString);

  for (let i = 1; i <= 18; i++) {
    // Week start is Monday
    const weekStart = new Date(start);
    weekStart.setDate(start.getDate() + (i - 1) * 7);
    weekStart.setHours(0, 0, 0, 0);

    // Week end is Friday (+4 days from Monday), excluding Saturday and Sunday
    const weekFriday = new Date(weekStart);
    weekFriday.setDate(weekStart.getDate() + 4);
    weekFriday.setHours(23, 59, 59, 999);

    const weekName = `Week ${i}`;

    weeks.push({
      weekNumber: i,
      name: weekName,
      startDateIso: weekStart.toISOString(),
      endDateIso: weekFriday.toISOString(),
      deadlineIso: weekFriday.toISOString(), // Default deadline is Friday 23:59
      formattedRange: `${formatShortDate(weekStart)} - ${formatShortDate(weekFriday)}`,
      formattedDeadline: formatShortDateTime(weekFriday)
    });
  }

  return weeks;
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
 * @param {string} fileTimestampIso - ISO date string of file upload/modified
 * @param {string} deadlineIso - ISO date string of target week deadline
 * @returns {Object} { status: 'ON_TIME'|'LATE', label: string, isLate: boolean, daysLate: number }
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

  // Calculate working/business days late (excluding weekends)
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
