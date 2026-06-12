import { env } from "../env.js";
import type { RateLimitInfo } from "../types/github.js";

const REST_BASE_URL = "https://api.github.com";
const GRAPHQL_URL = "https://api.github.com/graphql";

export class GitHubApiError extends Error {
  readonly status: number;
  readonly details: unknown;
  readonly rateLimit: RateLimitInfo | null;

  constructor(message: string, status: number, details: unknown, rateLimit: RateLimitInfo | null) {
    super(message);
    this.name = "GitHubApiError";
    this.status = status;
    this.details = details;
    this.rateLimit = rateLimit;
  }
}

let latestRateLimit: RateLimitInfo | null = null;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function buildHeaders(extra?: HeadersInit): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "GitHub-Insight-Analyzer"
  };

  if (env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
  }

  return { ...headers, ...(extra ?? {}) };
}

function parseRateLimit(headers: Headers): RateLimitInfo {
  const reset = headers.get("x-ratelimit-reset");
  const parsed: RateLimitInfo = {
    limit: Number(headers.get("x-ratelimit-limit")) || null,
    remaining: Number(headers.get("x-ratelimit-remaining")) || null,
    resetAt: reset ? new Date(Number(reset) * 1000).toISOString() : null,
    resource: headers.get("x-ratelimit-resource")
  };
  latestRateLimit = parsed;
  return parsed;
}

function restUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith("http")) {
    return pathOrUrl;
  }

  return `${REST_BASE_URL}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}

async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function githubFetch<T>(pathOrUrl: string, init: RequestInit = {}, retries = 2): Promise<T> {
  const response = await fetch(restUrl(pathOrUrl), {
    ...init,
    headers: buildHeaders(init.headers)
  });
  const rateLimit = parseRateLimit(response.headers);

  if (response.ok) {
    return (await parseResponse(response)) as T;
  }

  const details = await parseResponse(response);
  const retryAfter = Number(response.headers.get("retry-after")) || 0;
  const retryable = response.status >= 500 || (response.status === 403 && retryAfter > 0);

  if (retryable && retries > 0) {
    await sleep((retryAfter || 2 ** (3 - retries)) * 1000);
    return githubFetch<T>(pathOrUrl, init, retries - 1);
  }

  const message =
    typeof details === "object" && details && "message" in details
      ? String((details as { message: unknown }).message)
      : `GitHub API request failed with status ${response.status}`;
  throw new GitHubApiError(message, response.status, details, rateLimit);
}

export async function githubGraphql<T>(query: string, variables: Record<string, unknown>): Promise<T | null> {
  if (!env.GITHUB_TOKEN) {
    return null;
  }

  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: buildHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ query, variables })
  });
  const rateLimit = parseRateLimit(response.headers);
  const payload = (await parseResponse(response)) as { data?: T; errors?: Array<{ message: string }> };

  if (!response.ok || payload.errors?.length) {
    throw new GitHubApiError(
      payload.errors?.map((error) => error.message).join("; ") || "GitHub GraphQL request failed",
      response.status,
      payload,
      rateLimit
    );
  }

  return payload.data ?? null;
}

export async function paginateGithub<T>(path: string, perPage = 100, maxPages = env.MAX_GITHUB_PAGES): Promise<T[]> {
  const joiner = path.includes("?") ? "&" : "?";
  const results: T[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const pageResults = await githubFetch<T[]>(`${path}${joiner}per_page=${perPage}&page=${page}`);
    results.push(...pageResults);

    if (pageResults.length < perPage) {
      break;
    }
  }

  return results;
}

export function getLatestRateLimit(): RateLimitInfo | null {
  return latestRateLimit;
}

