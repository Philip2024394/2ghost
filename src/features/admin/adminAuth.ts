const ADMIN_EMAIL    = "2dateme.com@gmail.com";
const ADMIN_PASSWORD = "admin1240176";
const SESSION_KEY    = "ghost_admin_session";

export function adminLogin(email: string, password: string): boolean {
  if (email.toLowerCase().trim() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    localStorage.setItem(SESSION_KEY, btoa(`${email}:${Date.now()}`));
    return true;
  }
  return false;
}

export function adminLogout() {
  localStorage.removeItem(SESSION_KEY);
}

export function isAdminAuthenticated(): boolean {
  return !!localStorage.getItem(SESSION_KEY);
}
