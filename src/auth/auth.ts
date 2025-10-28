// src/utils/auth.ts
export function isAuthenticated(): boolean {
  // Example: check if "user" cookie exists
  return document.cookie.includes("user=");
}