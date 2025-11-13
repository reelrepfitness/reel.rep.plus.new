/**
 * Timezone-Aware Date Utilities
 * All dates are handled in Israel timezone (Asia/Jerusalem)
 */

// Israel timezone
const ISRAEL_TZ = 'Asia/Jerusalem';

/**
 * Format date for database storage (YYYY-MM-DD)
 * @param date - Date to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDate(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (!dateObj || isNaN(dateObj.getTime())) {
      // Fallback to today if invalid
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    // Fallback to today on any error
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

/**
 * Format a date in Hebrew locale
 */
export function formatDateHebrew(date: Date | string, formatStr: string = 'PPP'): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (!dateObj || isNaN(dateObj.getTime())) {
      return '';
    }

    // Simple Hebrew date format
    const days = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
    const months = [
      "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
      "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
    ];

    const dayName = days[dateObj.getDay()];
    const day = dateObj.getDate();
    const month = months[dateObj.getMonth()];
    const year = dateObj.getFullYear();

    return `יום ${dayName}, ${day} ${month} ${year}`;
  } catch (error) {
    return '';
  }
}

/**
 * Format time in 24-hour format
 */
export function formatTime(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (!dateObj || isNaN(dateObj.getTime())) {
      return '';
    }

    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (error) {
    return '';
  }
}

/**
 * Format date and time together
 */
export function formatDateTime(date: Date | string): string {
  try {
    const dateStr = formatDateHebrew(date);
    const timeStr = formatTime(date);
    return `${dateStr} ${timeStr}`;
  } catch (error) {
    return '';
  }
}

/**
 * Format relative time in Hebrew
 */
export function formatRelative(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (!dateObj || isNaN(dateObj.getTime())) {
      return '';
    }

    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'כרגע';
    if (minutes < 60) return `לפני ${minutes} דקות`;
    if (hours < 24) return `לפני ${hours} שעות`;
    return `לפני ${days} ימים`;
  } catch (error) {
    return '';
  }
}

/**
 * Get current time in Israel timezone
 */
export function nowInIsrael(): Date {
  return new Date();
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string): boolean {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (!dateObj || isNaN(dateObj.getTime())) {
      return false;
    }

    const today = formatDate(new Date());
    const checkDate = formatDate(dateObj);

    return today === checkDate;
  } catch (error) {
    return false;
  }
}

/**
 * Parse ISO string to Date
 */
export function parseISOInIsrael(isoString: string): Date {
  try {
    const date = new Date(isoString);

    if (isNaN(date.getTime())) {
      return new Date();
    }

    return date;
  } catch (error) {
    return new Date();
  }
}

/**
 * Get Hebrew day name
 */
export function getHebrewDayName(date: Date | string): string {
  const days = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (!dateObj || isNaN(dateObj.getTime())) {
      return '';
    }

    return days[dateObj.getDay()];
  } catch (error) {
    return '';
  }
}

/**
 * Get Hebrew month name
 */
export function getHebrewMonthName(date: Date | string): string {
  const months = [
    "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
    "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
  ];

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (!dateObj || isNaN(dateObj.getTime())) {
      return '';
    }

    return months[dateObj.getMonth()];
  } catch (error) {
    return '';
  }
}

// Re-export for backward compatibility
export { formatDate as formatDateForDB, formatDateHebrew as formatDateDisplay };