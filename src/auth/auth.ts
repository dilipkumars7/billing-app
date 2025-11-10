import { CookieService } from "../store/Cookie";

export function isAuthenticated(): boolean {
  // Check for token or user cookie
  return CookieService.exists("authToken");
}

export function login(userToken: string) {
  CookieService.set("authToken", userToken);
}

export function logout() {
  CookieService.remove("authToken");
}
