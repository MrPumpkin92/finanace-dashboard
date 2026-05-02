/**
 * Validation Utility Functions
 */

export class Validators {
  /**
   * Validate email format
   */
  public static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate amount (positive number)
   */
  public static isValidAmount(amount: unknown): amount is number {
    return typeof amount === 'number' && amount > 0 && isFinite(amount);
  }

  /**
   * Validate ISO date format
   */
  public static isValidISODate(dateStr: string): boolean {
    const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoRegex.test(dateStr)) {
      return false;
    }
    const date = new Date(`${dateStr}T00:00:00Z`);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Validate UUID format
   */
  public static isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validate transaction type
   */
  public static isValidTransactionType(type: unknown): type is 'income' | 'expense' {
    return type === 'income' || type === 'expense';
  }

  /**
   * Validate category type
   */
  public static isValidCategoryType(
    type: unknown
  ): type is 'income' | 'expense' | 'transfer' {
    return type === 'income' || type === 'expense' || type === 'transfer';
  }

  /**
   * Sanitize string input
   */
  public static sanitize(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 1000); // Limit length
  }
}
