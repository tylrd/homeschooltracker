/**
 * Returns the next school day (Mon-Fri) after the given date.
 */
export function nextSchoolDay(date: Date): Date {
  const next = new Date(date);
  do {
    next.setDate(next.getDate() + 1);
  } while (next.getDay() === 0 || next.getDay() === 6);
  return next;
}

/**
 * Check if a date falls on one of the selected school days.
 * schoolDays is an array of day-of-week numbers (0=Sun, 1=Mon, ..., 6=Sat).
 */
export function isSchoolDay(date: Date, schoolDays: number[]): boolean {
  return schoolDays.includes(date.getDay());
}

/**
 * Generate lesson dates starting from startDate for `count` lessons,
 * only on the given school days (day-of-week numbers).
 */
export function generateLessonDates(
  startDate: Date,
  count: number,
  schoolDays: number[],
): Date[] {
  const dates: Date[] = [];
  const current = new Date(startDate);

  // If startDate itself is a school day, include it
  if (isSchoolDay(current, schoolDays)) {
    dates.push(new Date(current));
  }

  while (dates.length < count) {
    current.setDate(current.getDate() + 1);
    if (isSchoolDay(current, schoolDays)) {
      dates.push(new Date(current));
    }
  }

  return dates;
}

/**
 * Format a date string (YYYY-MM-DD) for display.
 */
export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Get today's date as YYYY-MM-DD string.
 */
export function getTodayDate(): string {
  const now = new Date();
  return toDateString(now);
}

/**
 * Convert a Date object to YYYY-MM-DD string.
 */
export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string into a Date (local timezone).
 */
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get the next school day after the given date string, returning a date string.
 */
export function nextSchoolDayStr(dateStr: string): string {
  return toDateString(nextSchoolDay(parseDate(dateStr)));
}
