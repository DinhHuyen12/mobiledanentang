const AUTH_TOKEN_KEY = "token";
const AUTH_EMAIL_KEY = "email_verify";
const REGISTER_DATA_KEY = "register_payload";
const AUTH_COOKIE_KEY = "auth_token";
const COOKIE_MAX_AGE = 60 * 60 * 8;

function isBrowser() {
  return typeof window !== "undefined";
}

type AuthTokenPayload = {
  id?: number;
  role?: number;
  username?: string;
  full_name?: string;
  exp?: number;
  iat?: number;
};

export type PendingRegisterPayload = {
  username: string;
  full_name: string;
  email: string;
  phone: string;
  password: string;
  role_id: number;
  class_id?: number;
  enrollment_date?: string;
  status?: string;
  lecturer_code?: string;
  academic_rank?: string;
  specialization?: string;
};

export const ADMIN_ROLE_ID = 1;
export const LECTURER_ROLE_ID = 2;
export const STUDENT_ROLE_ID = 3;

export function getAuthToken() {
  if (!isBrowser()) {
    return null;
  }

  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string) {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(AUTH_TOKEN_KEY, token);
  document.cookie = `${AUTH_COOKIE_KEY}=${encodeURIComponent(token)}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

export function clearAuthToken() {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(AUTH_TOKEN_KEY);
  document.cookie = `${AUTH_COOKIE_KEY}=; path=/; max-age=0; samesite=lax`;
}

export function getPendingVerifyEmail() {
  if (!isBrowser()) {
    return null;
  }

  return localStorage.getItem(AUTH_EMAIL_KEY);
}

export function setPendingVerifyEmail(email: string) {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(AUTH_EMAIL_KEY, email);
}

export function clearPendingVerifyEmail() {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(AUTH_EMAIL_KEY);
}

export function setPendingRegisterData(payload: PendingRegisterPayload) {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(REGISTER_DATA_KEY, JSON.stringify(payload));
}

export function getPendingRegisterData(): PendingRegisterPayload | null {
  if (!isBrowser()) {
    return null;
  }

  const raw = localStorage.getItem(REGISTER_DATA_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PendingRegisterPayload;
  } catch {
    return null;
  }
}

export function clearPendingRegisterData() {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(REGISTER_DATA_KEY);
}

export function parseAuthToken(token?: string | null): AuthTokenPayload | null {
  if (!token) {
    return null;
  }

  try {
    const parts = token.split(".");
    if (parts.length < 2) {
      return null;
    }

    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const decoded = atob(payload);
    return JSON.parse(decoded) as AuthTokenPayload;
  } catch {
    return null;
  }
}

export function getAuthUser() {
  return parseAuthToken(getAuthToken());
}

export function isAdminUser(user?: AuthTokenPayload | null) {
  return Number(user?.role) === ADMIN_ROLE_ID;
}

export function isLecturerUser(user?: AuthTokenPayload | null) {
  return Number(user?.role) === LECTURER_ROLE_ID;
}

export function isStudentUser(user?: AuthTokenPayload | null) {
  return Number(user?.role) === STUDENT_ROLE_ID;
}

export function getDefaultRouteByRole(role?: number | null) {
  const roleId = Number(role);

  if (roleId === ADMIN_ROLE_ID) {
    return "/admin/dashboard";
  }

  if (roleId === LECTURER_ROLE_ID) {
    return "/lecturer";
  }

  return "/student";
}
