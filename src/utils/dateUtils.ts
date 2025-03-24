/**
 * Formats a date in a human-readable format
 * @param date The date to format
 * @returns Formatted date string
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

/**
 * Formats a date with time in a human-readable format
 * @param date The date to format
 * @returns Formatted date and time string
 */
export const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

/**
 * Gets a date formatted as YYYY-MM-DD
 * @param date The date to format
 * @returns Date in YYYY-MM-DD format
 */
export const getISODateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Checks if a date is today
 * @param date The date to check
 * @returns True if the date is today
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Checks if a date is yesterday
 * @param date The date to check
 * @returns True if the date is yesterday
 */
export const isYesterday = (date: Date): boolean => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
};

/**
 * Checks if a date is in the past
 * @param date The date to check
 * @returns True if the date is in the past
 */
export const isPast = (date: Date): boolean => {
  const now = new Date();
  return date < now;
};

/**
 * Checks if a date is in the future
 * @param date The date to check
 * @returns True if the date is in the future
 */
export const isFuture = (date: Date): boolean => {
  const now = new Date();
  return date > now;
};

/**
 * Checks if a date is overdue
 * @param date The date to check
 * @param isCompleted Whether the task is completed
 * @returns True if the date is overdue
 */
export const isOverdue = (date: Date, isCompleted: boolean = false): boolean => {
  // Completed tasks are never overdue
  if (isCompleted) return false;
  
  return isPast(date);
};

/**
 * Gets a human-readable relative date string
 * @param date The date to convert to relative string
 * @returns A string like "Today", "Yesterday", "In 3 days", "3 days ago", etc.
 */
export const getRelativeDateString = (date: Date): string => {
  const now = new Date();
  
  // Check if it's today
  if (isToday(date)) {
    return 'Today';
  }
  
  // Check if it's yesterday
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  
  // Calculate days difference
  const diffTime = Math.abs(date.getTime() - now.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Check if it's within a week
  if (diffDays <= 7) {
    if (date > now) {
      return `In ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  }
  
  // Check if it's within a month
  if (diffDays <= 30) {
    const weeks = Math.ceil(diffDays / 7);
    if (date > now) {
      return `In ${weeks} week${weeks !== 1 ? 's' : ''}`;
    } else {
      return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
    }
  }
  
  // Just return the formatted date for longer periods
  return formatDate(date);
};

/**
 * Gets the start of a day (midnight)
 * @param date The date to get the start of day for
 * @returns A new Date set to midnight of the given date
 */
export const getStartOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

/**
 * Gets the end of a day (23:59:59.999)
 * @param date The date to get the end of day for
 * @returns A new Date set to the last millisecond of the given date
 */
export const getEndOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};

/**
 * Gets the date range for a week containing the given date
 * @param date A date within the week
 * @returns An object with startDate and endDate for the week
 */
export const getWeekRange = (date: Date): { startDate: Date; endDate: Date } => {
  const startDate = new Date(date);
  const day = startDate.getDay();
  const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  
  startDate.setDate(diff);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);
  
  return { startDate, endDate };
};

/**
 * Gets the date range for a month containing the given date
 * @param date A date within the month
 * @returns An object with startDate and endDate for the month
 */
export const getMonthRange = (date: Date): { startDate: Date; endDate: Date } => {
  const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  endDate.setHours(23, 59, 59, 999);
  
  return { startDate, endDate };
}; 