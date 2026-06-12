import type { CompareResponse, TrendingRepository, UserInsights } from "./types";

const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";

export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message: unknown }).message)
        : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

export const getUserInsights = (username: string) => apiGet<UserInsights>(`/api/users/${encodeURIComponent(username)}`);

export const getRecommendations = (username: string) =>
  apiGet<TrendingRepository[]>(`/api/users/${encodeURIComponent(username)}/recommendations`);

export const getTrending = () => apiGet<TrendingRepository[]>("/api/trending");

export const compareUsers = (left: string, right: string) =>
  apiGet<CompareResponse>(`/api/compare/${encodeURIComponent(left)}/${encodeURIComponent(right)}`);

export const csvExportUrl = (username: string) => `${API_BASE}/api/users/${encodeURIComponent(username)}/export.csv`;

