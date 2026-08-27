/**
 * Week Date Range and Deadline Manager (Week 1 through Week 18)
 */

export const DEFAULT_SEMESTER_START = '2026-06-08'; // Monday June 8, 2026

/**
 * Generate 18 weeks of date ranges and deadlines based on a start date
 * @param {string} startDateString - ISO YYYY-MM-DD string for Semester Week 1 Monday
 * @returns {Array} Array of 18 week objects
 */
export function generateDefaultWeekRanges(startDateString = DEFAULT_SEMESTER_START) {
  const weeks = [];
  const start = new Date(startDateString);

  for (let i = 1; i <= 18; i++) {
    const weekStart = new Date(start);
    weekStart.setDate(start.getDate() + (i - 1) * 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekName = `Week ${i}`;

    weeks.push({
      weekNumber: i,
      name: weekName,
      startDateIso: weekStart.toISOString(),
      endDateIso: weekEnd.toISOString(),
      deadlineIso: weekEnd.toISOString(), // Default deadline is end of week Sunday 23:59
      formattedRange: `${formatShortDate(weekStart)} - ${formatShortDate(weekEnd)}`,
      formattedDeadline: formatShortDateTime(weekEnd)
    });
  }

  return weeks;
}

/**
 * Check if a file submission is On Time or Late (L)
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

  // Calculate days late
  const diffTime = Math.abs(fileDate.getTime() - deadlineDate.getTime());
  const daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

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
