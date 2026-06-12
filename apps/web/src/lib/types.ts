export interface RateLimitInfo {
  limit: number | null;
  remaining: number | null;
  resetAt: string | null;
  resource?: string | null;
}

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  bio: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  fork: boolean;
  archived: boolean;
  disabled: boolean;
  private: boolean;
  language: string | null;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  size: number;
  default_branch: string;
  topics?: string[];
  license: { key: string; name: string; spdx_id: string } | null;
  has_issues: boolean;
  has_projects: boolean;
  has_wiki: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string | null;
  activityScore?: number;
}

export interface SimpleGitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
}

export interface LanguageDatum {
  name: string;
  bytes: number;
  repos: number;
  percentage: number;
}

export interface TimelineDatum {
  month: string;
  repositories: number;
  cumulative: number;
}

export interface SocialAnalytics {
  followers: SimpleGitHubUser[];
  following: SimpleGitHubUser[];
  notFollowingBack: SimpleGitHubUser[];
  fans: SimpleGitHubUser[];
  mutuals: SimpleGitHubUser[];
  followersToFollowingRatio: number | null;
}

export interface ContributionDay {
  date: string;
  contributionCount: number;
  weekday: number;
}

export interface ContributionCalendar {
  totalContributions: number;
  weeks: Array<{ contributionDays: ContributionDay[] }>;
}

export interface ContributionAnalytics {
  calendar: ContributionCalendar | null;
  calendarUnavailableReason: string | null;
  commitCount: number | null;
  pullRequestsOpened: number | null;
  issuesOpened: number | null;
  issuesClosed: number | null;
  averageRepositoryActivity: number;
  currentStreak: number;
  longestStreak: number;
  monthlyTrend: Array<{ month: string; contributions: number }>;
}

export interface RepositoryAnalytics {
  totalRepositories: number;
  mostStarredRepository: GitHubRepo | null;
  mostForkedRepository: GitHubRepo | null;
  totalStars: number;
  totalForks: number;
  totalWatchers: number;
  languages: LanguageDatum[];
  repositoryCreationTimeline: TimelineDatum[];
  mostActiveRepositories: GitHubRepo[];
  archivedRepositories: GitHubRepo[];
  forkedRepositories: GitHubRepo[];
  starsByRepository: Array<{ name: string; stars: number; url: string }>;
  forksByRepository: Array<{ name: string; forks: number; url: string }>;
}

export interface ScoreBreakdown {
  accountScore: number;
  repositoryHealthScore: number;
  openSourceActivityScore: number;
  popularityScore: number;
  developerActivityScore: number;
  overallScore: number;
  rank: string;
  badges: string[];
}

export interface UserInsights {
  username: string;
  generatedAt: string;
  profile: GitHubUser;
  repositoryAnalytics: RepositoryAnalytics;
  contributionAnalytics: ContributionAnalytics;
  socialAnalytics: SocialAnalytics;
  scores: ScoreBreakdown;
  rateLimit: RateLimitInfo | null;
}

export interface TrendingRepository {
  id: number;
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  owner: SimpleGitHubUser;
}

export interface CompareResponse {
  left: UserInsights;
  right: UserInsights;
  winner: string | null;
}

