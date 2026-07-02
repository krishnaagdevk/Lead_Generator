import { api } from "./api";

export interface AuthUser {
  id: number;
  email: string;
  plan: string;
}

export async function login(email: string, password: string): Promise<void> {
  const data = await api.post<{ access_token: string }>("/auth/login", { email, password });
  localStorage.setItem("access_token", data.access_token);
}

export async function signup(email: string, password: string): Promise<void> {
  const data = await api.post<{ access_token: string }>("/auth/signup", { email, password });
  localStorage.setItem("access_token", data.access_token);
}

export function logout(): void {
  localStorage.removeItem("access_token");
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("access_token");
}

export function getMe(): Promise<AuthUser> {
  return api.get<AuthUser>("/auth/me");
}
