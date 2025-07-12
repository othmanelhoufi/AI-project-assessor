/**
 * Utility functions for formatting data
 */
export class Formatters {
  static formatAspectName(key) {
    return key.replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())
              .trim();
  }

  static formatDate(date) {
    if (date instanceof Date) {
      return date.toLocaleDateString();
    }
    return new Date(date).toLocaleDateString();
  }

  /**
   * NEW: Formats an ISO date string into a more readable, local timestamp.
   * @param {string} isoString - The ISO date string to format.
   * @returns {string} A formatted timestamp (e.g., "7/12/2025, 5:14 PM").
   */
  static formatTimestamp(isoString) {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    // Use locale-specific formatting for date and time.
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  static formatDuration(min, max, unit = 'months') {
    if (min === max) {
      return `${min} ${unit}`;
    }
    return `${min}-${max} ${unit}`;
  }

  static truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

  static capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  static generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}