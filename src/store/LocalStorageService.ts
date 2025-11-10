/**
 * LocalStorageService
 * A simple wrapper for localStorage with helper methods
 * Similar API to CookieService
 */

const DEFAULT_EXPIRY_DAYS = 7;

export const LocalStorageService = {
  /**
   * Set an item in localStorage
   * @param key The key name
   * @param value The string value to store
   * @param days Expiration in days (optional, default = 7)
   */
  set: (key: string, value: string, days = DEFAULT_EXPIRY_DAYS): void => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    const data = {
      value,
      expiresAt: expiresAt.getTime(), // store expiry timestamp
    };

    localStorage.setItem(key, JSON.stringify(data));
  },

  /**
   * Get an item from localStorage
   * Returns undefined if not found or expired
   */
  get: (key: string): string | undefined => {
    const raw = localStorage.getItem(key);
    if (!raw) return undefined;

    try {
      const data = JSON.parse(raw);
      if (data.expiresAt && Date.now() > data.expiresAt) {
        // auto-remove expired item
        localStorage.removeItem(key);
        return undefined;
      }
      return data.value;
    } catch (err) {
      // if JSON parse fails, treat as plain string
      return raw;
    }
  },

  /**
   * Remove an item
   */
  remove: (key: string): void => {
    localStorage.removeItem(key);
  },

  /**
   * Remove all items
   */
  removeAll: (): void => {
    localStorage.clear();
  },

  /**
   * Check if an item exists and is not expired
   */
  exists: (key: string): boolean => {
    const value = LocalStorageService.get(key);
    return value !== undefined;
  },
};
