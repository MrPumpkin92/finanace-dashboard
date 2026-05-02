/**
 * Date Utility Functions
 */

export class DateUtils {
  /**
   * Get the start of the current month
   */
  public static getMonthStart(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  /**
   * Get the end of the current month
   */
  public static getMonthEnd(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  /**
   * Get the start of the current year
   */
  public static getYearStart(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), 0, 1);
  }

  /**
   * Get the end of the current year
   */
  public static getYearEnd(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), 11, 31);
  }

  /**
   * Get the last N days
   */
  public static getLastDays(days: number, endDate: Date = new Date()): Date {
    const start = new Date(endDate);
    start.setDate(start.getDate() - days);
    return start;
  }

  /**
   * Format date to ISO string (YYYY-MM-DD)
   */
  public static toISODate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Parse ISO date string
   */
  public static parseISODate(dateStr: string): Date {
    return new Date(`${dateStr}T00:00:00Z`);
  }
}
