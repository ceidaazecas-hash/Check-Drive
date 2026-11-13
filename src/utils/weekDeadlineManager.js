/**
 * Week Date Range and Deadline Manager (Week 1 through Week 18)
 * Supports:
 * - 1 Class per Week (Due on class day, Friday, Sunday, or custom day)
 * - 2 Classes per Week for the same module (Displays BOTH class dates for every week!)
 * - Direct selection of all 7 days for Class 1 & Class 2 (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
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
 * Formats hours (0-23) and minutes (0-59) to 12-hour AM/PM string (e.g. "05:00 PM")
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
  if (!timeStr) return { hours: 17, minutes: 0 };
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

  return { hours: 17, minutes: 0 };
}

/**
 * Find the Monday of the week for any given date
 */
export function getWeekMonday(dateObj) {
  const d = dateObj.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const diff = d === 0 ? -6 : 1 - d;
  const mon = new Date(dateObj);
  mon.setDate(dateObj.getDate() + diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

/**
 * Given a week's Monday, get the specific day of that week (0 = Sun, 1 = Mon ... 6 = Sat)
 */
export function getDayInWeek(mon, dayOfWeek) {
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const target = new Date(mon);
  target.setDate(mon.getDate() + offset);
  return target;
}

/**
 * Calculate 18 weeks of complete class schedules and deadlines
 * Accurately computes BOTH class dates for modules with 2 classes per week!
 */
export function calculateSemesterSchedule({
  startDateString = DEFAULT_SEMESTER_START,
  classesPerWeek = 2,
  class1Day = 1, // 1 = Monday
  class2Day = 3, // 3 = Wednesday
  dueTarget = 'class2', // 'class1', 'class2', 'sunday', 'friday'
  defaultHours = 17,
  defaultMinutes = 0
}) {
  const weeks = [];
  const start = parseLocalDate(startDateString || DEFAULT_SEMESTER_START);
  const week1Monday = getWeekMonday(start);

  for (let i = 1; i <= 18; i++) {
    const weekMon = new Date(week1Monday);
    weekMon.setDate(week1Monday.getDate() + (i - 1) * 7);

    const class1Date = getDayInWeek(weekMon, class1Day);
    const class2Date = classesPerWeek === 2 ? getDayInWeek(weekMon, class2Day) : null;

    let deadlineDate;
    if (classesPerWeek === 2 && class2Date) {
      if (dueTarget === 'class1') {
        deadlineDate = new Date(class1Date);
      } else if (dueTarget === 'class2') {
        deadlineDate = new Date(class2Date);
      } else if (dueTarget === 'sunday') {
        deadlineDate = getDayInWeek(weekMon, 0); // Sunday
      } else if (dueTarget === 'friday') {
        deadlineDate = getDayInWeek(weekMon, 5); // Friday
      } else {
        deadlineDate = new Date(class2Date);
      }
    } else {
      if (dueTarget === 'sunday') {
        deadlineDate = getDayInWeek(weekMon, 0);
      } else if (dueTarget === 'friday') {
        deadlineDate = getDayInWeek(weekMon, 5);
      } else {
        deadlineDate = new Date(class1Date);
      }
    }

    deadlineDate.setHours(defaultHours, defaultMinutes, 59, 999);

    const dateStr = formatDateInput(deadlineDate);
    const timeStr = format12HourTime(defaultHours, defaultMinutes);
    const dayName = deadlineDate.toLocaleDateString('en-US', { weekday: 'short' });

    weeks.push({
      weekNumber: i,
      name: `Week ${i}`,
      class1DateString: formatDateInput(class1Date),
      class1Formatted: class1Date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      class2DateString: class2Date ? formatDateInput(class2Date) : null,
      class2Formatted: class2Date ? class2Date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : null,
      startDateIso: class1Date.toISOString(),
      endDateIso: deadlineDate.toISOString(),
      endDate: deadlineDate.toISOString(), // Alias for safety
      deadlineIso: deadlineDate.toISOString(),
      dateString: dateStr,
      timeString: timeStr,
      dayOfWeek: dayName,
      formattedRange: classesPerWeek === 2 && class2Date
        ? `${class1Date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} & ${class2Date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`
        : `${class1Date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`,
      formattedDeadline: formatShortDateTime(deadlineDate)
    });
  }

  return weeks;
}

/**
 * Standard generator for 18 weeks compatible with all matrix components
 */
export function generateDefaultWeekRanges(
  startDateString = DEFAULT_SEMESTER_START,
  defaultHours = 17,
  defaultMinutes = 0,
  classesPerWeek = 2,
  class1Day = 1,
  class2Day = 3,
  dueTarget = 'class2'
) {
  return calculateSemesterSchedule({
    startDateString,
    classesPerWeek,
    class1Day,
    class2Day,
    dueTarget,
    defaultHours,
    defaultMinutes
  });
}

/**
 * Backward compatibility alias
 */
export const calculateWeekDeadlines = calculateSemesterSchedule;

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
