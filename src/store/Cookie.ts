import Cookies from "js-cookie";

const COOKIE_OPTIONS = { path: "/", sameSite: "Strict" };

export const CookieService = {
  set: (name: string, value: string, days = 7) => {
    Cookies.set(name, value, { ...COOKIE_OPTIONS, expires: days });
  },

  get: (name: string): string | undefined => {
    return Cookies.get(name);
  },

  remove: (name: string) => {
    Cookies.remove(name, COOKIE_OPTIONS);
  },

  removeAll: () => {
    Object.keys(Cookies.get()).forEach((cookie) => Cookies.remove(cookie, COOKIE_OPTIONS));
  },

  exists: (name: string): boolean => {
    return !!Cookies.get(name);
  },
};
