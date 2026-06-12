import type { ContributionAnalytics, GitHubRepo, GitHubUser, ScoreBreakdown } from "../types/github.js";

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));

const daysBetween = (date: string | null) => {
  if (!date) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.max(0, (Date.now() - new Date(date).getTime()) / 86_400_000);
};

export function calculateScores(
  profile: GitHubUser,
  repos: GitHubRepo[],
  contributionAnalytics: ContributionAnalytics
): ScoreBreakdown {
  const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
  const nonForkRepos = repos.filter((repo) => !repo.fork);
  const recentRepos = repos.filter((repo) => daysBetween(repo.pushed_at ?? repo.updated_at) <= 180);
  const documentedRepos = repos.filter((repo) => Boolean(repo.description));
  const licensedRepos = repos.filter((repo) => Boolean(repo.license));
  const activeRepoRatio = repos.length ? recentRepos.length / repos.length : 0;
  const accountAgeYears = Math.max(0.1, (Date.now() - new Date(profile.created_at).getTime()) / 31_536_000_000);

  const accountScore = clamp(
    Math.log10(profile.followers + 1) * 18 +
      Math.log10(profile.public_repos + 1) * 18 +
      Math.min(accountAgeYears, 8) * 4 +
      Math.min(profile.public_gists, 20)
  );

  const repositoryHealthScore = clamp(
    activeRepoRatio * 35 +
      (repos.length ? documentedRepos.length / repos.length : 0) * 25 +
      (repos.length ? licensedRepos.length / repos.length : 0) * 15 +
      (repos.length ? nonForkRepos.length / repos.length : 0) * 15 +
      Math.log10(totalStars + totalForks + 1) * 10
  );

  const openSourceActivityScore = clamp(
    Math.log10((contributionAnalytics.pullRequestsOpened ?? 0) + 1) * 24 +
      Math.log10((contributionAnalytics.issuesOpened ?? 0) + 1) * 18 +
      Math.log10((contributionAnalytics.issuesClosed ?? 0) + 1) * 12 +
      contributionAnalytics.averageRepositoryActivity * 0.25 +
      Math.min(contributionAnalytics.longestStreak, 60) * 0.35
  );

  const popularityScore = clamp(
    Math.log10(profile.followers + 1) * 25 +
      Math.log10(totalStars + 1) * 30 +
      Math.log10(totalForks + 1) * 20 +
      (profile.followers > profile.following ? 12 : 0)
  );

  const developerActivityScore = clamp(
    Math.log10((contributionAnalytics.commitCount ?? 0) + 1) * 20 +
      Math.min(repos.length, 80) * 0.55 +
      activeRepoRatio * 35 +
      Math.min(contributionAnalytics.currentStreak, 30) * 0.8
  );

  const overallScore = clamp(
    accountScore * 0.18 +
      repositoryHealthScore * 0.22 +
      openSourceActivityScore * 0.2 +
      popularityScore * 0.18 +
      developerActivityScore * 0.22
  );

  const badges = new Set<string>();
  if (developerActivityScore >= 55 || activeRepoRatio >= 0.35) badges.add("Rising Developer");
  if (openSourceActivityScore >= 45 || (contributionAnalytics.pullRequestsOpened ?? 0) >= 25) {
    badges.add("Open Source Contributor");
  }
  if (nonForkRepos.length >= 8) badges.add("Repository Creator");
  if (profile.followers >= 50 || profile.following >= 50) badges.add("Community Builder");
  if (totalStars >= 100) badges.add("Star Collector");
  if (!badges.size) badges.add("GitHub Explorer");

  const rank =
    overallScore >= 85
      ? "S"
      : overallScore >= 70
        ? "A"
        : overallScore >= 55
          ? "B"
          : overallScore >= 40
            ? "C"
            : "D";

  return {
    accountScore,
    repositoryHealthScore,
    openSourceActivityScore,
    popularityScore,
    developerActivityScore,
    overallScore,
    rank,
    badges: Array.from(badges)
  };
}

