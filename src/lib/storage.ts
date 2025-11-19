import { format, parseISO, isValid } from "date-fns";

//
// -------- Safe localStorage wrapper (works in browser-only + avoids SSR blowups) --------
//

const getLocalStorage = (): Storage | null => {
  if (typeof window === "undefined") return null; // SSR / non-browser
  try {
    return window.localStorage;
  } catch {
    // Can throw in private mode / hardened environments
    return null;
  }
};

export const storage = {
  get: <T>(key: string): T | null => {
    try {
      const ls = getLocalStorage();
      if (!ls) return null;

      const item = ls.getItem(key);
      if (!item) return null;

      return JSON.parse(item) as T;
    } catch (error) {
      console.error(
        `Error getting item from localStorage for key "${key}":`,
        error
      );
      return null;
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      const ls = getLocalStorage();
      if (!ls) return;
      ls.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(
        `Error setting item to localStorage for key "${key}":`,
        error
      );
    }
  },

  remove: (key: string): void => {
    try {
      const ls = getLocalStorage();
      if (!ls) return;
      ls.removeItem(key);
    } catch (error) {
      console.error(
        `Error removing item from localStorage for key "${key}":`,
        error
      );
    }
  },
};

//
// -------- Types --------
//

export type UserProfile = {
  name: string;
  gender: "Male" | "Female"; // extend later if needed
  /**
   * ISO date string for start of current/most recent period.
   * Example: "2023-10-27"
   */
  periodStartDate?: string;
};

//
// -------- Keys --------
//

const USER_PROFILE_KEY = "userProfile";

//
// -------- User profile helpers (optional but handy) --------
//

export const getUserProfile = (): UserProfile | null => {
  return storage.get<UserProfile>(USER_PROFILE_KEY);
};

export const saveUserProfile = (profile: UserProfile): void => {
  storage.set(USER_PROFILE_KEY, profile);
};