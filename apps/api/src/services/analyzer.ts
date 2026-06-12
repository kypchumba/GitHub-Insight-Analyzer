import { cache } from "./cache.js";
import { getLatestRateLimit, githubFetch, githubGraphql, paginateGithub } from "./githubClient.js";
import { calculateScores } from "./scoring.js";
import type {
  ContributionAnalytics,
  ContributionCalendar,
  GitHubRepo,
  GitHubUser,
  LanguageDatum,
  RepositoryAnalytics,
  SimpleGitHubUser,
  SocialAnalytics,
  TimelineDatum,
  TrendingRepository,
  UserInsights
} from "../types/github.js";

const topBy = <T>(items: T[], score: (item: T) => number): T | null => {
  if (!items.length) {
    return null;
  }

  return [...items].sort((a, b) => score(b) - score(a))[0] ?? null;
};

const monthKey = (date: string) => date.slice(0, 7);

const daysSince = (date: string | null) => {
  if (!date) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.max(0, (Date.now() - new Date(date).getTime()) / 86_400_000);
};

async function withFallback<T>(factory: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await factory();
  } catch {
    return fallback;
  }
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, mapper: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index] as T);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function normalizeUsername(username: string): string {
  return username.trim().replace(/^@/, "");
}

function buildRepositoryTimeline(repos: GitHubRepo[]): TimelineDatum[] {
  const grouped = new Map<string, number>();
  repos.forEach((repo) => {
    grouped.set(monthKey(repo.created_at), (grouped.get(monthKey(repo.created_at)) ?? 0) + 1);
  });

  let cumulative = 0;
  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, repositories]) => {
      cumulative += repositories;
      return { month, repositories, cumulative };
    });
}

function buildLanguageData(languageMaps: Array<Record<string, number>>, repos: GitHubRepo[]): LanguageDatum[] {
  const bytes = new Map<string, { bytes: number; repos: number }>();

  languageMaps.forEach((languageMap, index) => {
    const repo = repos[index];
    const entries = Object.entries(languageMap);

    if (!entries.length && repo?.language) {
      const current = bytes.get(repo.language) ?? { bytes: 0, repos: 0 };
      bytes.set(repo.language, { bytes: current.bytes + Math.max(repo.size, 1), repos: current.repos + 1 });
      return;
    }

    entries.forEach(([language, amount]) => {
      const current = bytes.get(language) ?? { bytes: 0, repos: 0 };
      bytes.set(language, { bytes: current.bytes + amount, repos: current.repos + 1 });
    });
  });

  const totalBytes = Array.from(bytes.values()).reduce((sum, item) => sum + item.bytes, 0);

  return Array.from(bytes.entries())
    .map(([name, item]) => ({
      name,
      bytes: item.bytes,
      repos: item.repos,
      percentage: totalBytes ? Number(((item.bytes / totalBytes) * 100).toFixed(2)) : 0
    }))
    .sort((a, b) => b.bytes - a.bytes);
}

function calculateSocialAnalytics(followers: SimpleGitHubUser[], following: SimpleGitHubUser[], profile: GitHubUser): SocialAnalytics {
  const followerLogins = new Set(followers.map((user) => user.login.toLowerCase()));
  const followingLogins = new Set(following.map((user) => user.login.toLowerCase()));

  return {
    followers,
    following,
    notFollowingBack: following.filter((user) => !followerLogins.has(user.login.toLowerCase())),
    fans: followers.filter((user) => !followingLogins.has(user.login.toLowerCase())),
    mutuals: followers.filter((user) => followingLogins.has(user.login.toLowerCase())),
    followersToFollowingRatio: profile.following === 0 ? null : Number((profile.followers / profile.following).toFixed(2))
  };
}

function calculateStreaks(calendar: ContributionCalendar | null) {
  if (!calendar) {
    return { currentStreak: 0, longestStreak: 0, monthlyTrend: [] as Array<{ month: string; contributions: number }> };
  }

  const days = calendar.weeks
    .flatMap((week) => week.contributionDays)
    .sort((a, b) => a.date.localeCompare(b.date));
  let longestStreak = 0;
  let rolling = 0;

  days.forEach((day) => {
    if (day.contributionCount > 0) {
      rolling += 1;
      longestStreak = Math.max(longestStreak, rolling);
    } else {
      rolling = 0;
    }
  });

  let currentStreak = 0;
  for (let index = days.length - 1; index >= 0; index -= 1) {
    const day = days[index];
    if (!day || day.contributionCount === 0) {
      if (currentStreak === 0) continue;
      break;
    }
    currentStreak += 1;
  }

  const monthly = new Map<string, number>();
  days.forEach((day) => {
    monthly.set(monthKey(day.date), (monthly.get(monthKey(day.date)) ?? 0) + day.contributionCount);
  });

  return {
    currentStreak,
    longestStreak,
    monthlyTrend: Array.from(monthly.entries()).map(([month, contributions]) => ({ month, contributions }))
  };
}

async function fetchSearchTotal(path: string): Promise<number | null> {
  return withFallback(async () => {
    const response = await githubFetch<{ total_count: number }>(path);
    return response.total_count;
  }, null);
}

async function fetchContributionCalendar(username: string): Promise<ContributionCalendar | null> {
  const response = await githubGraphql<{
    user: {
      contributionsCollection: {
        contributionCalendar: ContributionCalendar;
      };
    } | null;
  }>(
    `query UserContributionCalendar($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
                weekday
              }
            }
          }
        }
      }
    }`,
    { login: username }
  );

  return response?.user?.contributionsCollection.contributionCalendar ?? null;
}

async function buildContributionAnalytics(username: string, repos: GitHubRepo[]): Promise<ContributionAnalytics> {
  const issueParams = (query: string) => new URLSearchParams({ q: query, per_page: "1" }).toString();
  const [calendar, commitCount, pullRequestsOpened, issuesOpened, issuesClosed] = await Promise.all([
    withFallback(() => fetchContributionCalendar(username), null),
    fetchSearchTotal(`/search/commits?${issueParams(`author:${username}`)}`),
    fetchSearchTotal(`/search/issues?${issueParams(`author:${username} type:pr`)}`),
    fetchSearchTotal(`/search/issues?${issueParams(`author:${username} type:issue`)}`),
    fetchSearchTotal(`/search/issues?${issueParams(`author:${username} type:issue state:closed`)}`)
  ]);

  const recentRepos = repos.filter((repo) => daysSince(repo.pushed_at ?? repo.updated_at) <= 180);
  const averageRepositoryActivity = repos.length ? Number(((recentRepos.length / repos.length) * 100).toFixed(1)) : 0;
  const streaks = calculateStreaks(calendar);

  return {
    calendar,
    calendarUnavailableReason: calendar ? null : "Set GITHUB_TOKEN on the server to enable GitHub GraphQL contribution calendar data.",
    commitCount,
    pullRequestsOpened,
    issuesOpened,
    issuesClosed,
    averageRepositoryActivity,
    currentStreak: streaks.currentStreak,
    longestStreak: streaks.longestStreak,
    monthlyTrend: streaks.monthlyTrend
  };
}

async function buildRepositoryAnalytics(repos: GitHubRepo[]): Promise<RepositoryAnalytics> {
  const languageMaps = await mapWithConcurrency(
    repos,
    4,
    async (repo) => await withFallback(() => githubFetch<Record<string, number>>(repo.languages_url), {})
  );

  const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
  const totalWatchers = repos.reduce((sum, repo) => sum + repo.watchers_count, 0);

  return {
    totalRepositories: repos.length,
    mostStarredRepository: topBy(repos, (repo) => repo.stargazers_count),
    mostForkedRepository: topBy(repos, (repo) => repo.forks_count),
    totalStars,
    totalForks,
    totalWatchers,
    languages: buildLanguageData(languageMaps, repos),
    repositoryCreationTimeline: buildRepositoryTimeline(repos),
    mostActiveRepositories: [...repos]
      .map((repo) => ({
        ...repo,
        activityScore: Math.round(
          Math.max(0, 100 - daysSince(repo.pushed_at ?? repo.updated_at) / 3) +
            repo.stargazers_count * 2 +
            repo.forks_count * 1.5 +
            repo.open_issues_count * 0.5
        )
      }))
      .sort((a, b) => b.activityScore - a.activityScore)
      .slice(0, 10),
    archivedRepositories: repos.filter((repo) => repo.archived),
    forkedRepositories: repos.filter((repo) => repo.fork),
    starsByRepository: [...repos]
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 12)
      .map((repo) => ({ name: repo.name, stars: repo.stargazers_count, url: repo.html_url })),
    forksByRepository: [...repos]
      .sort((a, b) => b.forks_count - a.forks_count)
      .slice(0, 12)
      .map((repo) => ({ name: repo.name, forks: repo.forks_count, url: repo.html_url }))
  };
}

export async function getUserInsights(rawUsername: string): Promise<UserInsights> {
  const username = normalizeUsername(rawUsername);

  return cache.getOrSet(`user:${username.toLowerCase()}`, async () => {
    const profile = await githubFetch<GitHubUser>(`/users/${encodeURIComponent(username)}`);
    const [repos, followers, following] = await Promise.all([
      paginateGithub<GitHubRepo>(`/users/${encodeURIComponent(username)}/repos?type=all&sort=updated&direction=desc`),
      paginateGithub<SimpleGitHubUser>(`/users/${encodeURIComponent(username)}/followers`),
      paginateGithub<SimpleGitHubUser>(`/users/${encodeURIComponent(username)}/following`)
    ]);

    const [repositoryAnalytics, contributionAnalytics] = await Promise.all([
      buildRepositoryAnalytics(repos),
      buildContributionAnalytics(username, repos)
    ]);

    return {
      username: profile.login,
      generatedAt: new Date().toISOString(),
      profile,
      repositoryAnalytics,
      contributionAnalytics,
      socialAnalytics: calculateSocialAnalytics(followers, following, profile),
      scores: calculateScores(profile, repos, contributionAnalytics),
      rateLimit: getLatestRateLimit()
    };
  });
}

export async function getTrendingRepositories(language?: string): Promise<TrendingRepository[]> {
  const cacheKey = `trending:${language ?? "global"}`;
  return cache.getOrSet(cacheKey, async () => {
    const query = language ? `language:${language} stars:>100 sort:stars` : "stars:>10000";
    const params = new URLSearchParams({
      q: query,
      sort: "stars",
      order: "desc",
      per_page: "8"
    });
    const response = await githubFetch<{ items: Array<GitHubRepo & { owner: SimpleGitHubUser }> }>(
      `/search/repositories?${params.toString()}`
    );

    return response.items.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      url: repo.html_url,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      owner: repo.owner
    }));
  }, 900);
}

export async function getRepositoryRecommendations(username: string): Promise<TrendingRepository[]> {
  const insights = await getUserInsights(username);
  const topLanguage = insights.repositoryAnalytics.languages[0]?.name;
  return getTrendingRepositories(topLanguage);
}

export function toCsv(insights: UserInsights): string {
  const rows = [
    ["Section", "Metric", "Value"],
    ["Profile", "Username", insights.profile.login],
    ["Profile", "Name", insights.profile.name ?? ""],
    ["Profile", "Followers", String(insights.profile.followers)],
    ["Profile", "Following", String(insights.profile.following)],
    ["Repositories", "Total", String(insights.repositoryAnalytics.totalRepositories)],
    ["Repositories", "Stars", String(insights.repositoryAnalytics.totalStars)],
    ["Repositories", "Forks", String(insights.repositoryAnalytics.totalForks)],
    ["Repositories", "Watchers", String(insights.repositoryAnalytics.totalWatchers)],
    ["Social", "Not Following Back", String(insights.socialAnalytics.notFollowingBack.length)],
    ["Social", "Fans", String(insights.socialAnalytics.fans.length)],
    ["Social", "Mutuals", String(insights.socialAnalytics.mutuals.length)],
    ["Scores", "Overall", String(insights.scores.overallScore)],
    ["Scores", "Rank", insights.scores.rank]
  ];

  return rows
    .map((row) => row.map((cell) => `"${String(cell).replaceAll("\"", "\"\"")}"`).join(","))
    .join("\n");
}

