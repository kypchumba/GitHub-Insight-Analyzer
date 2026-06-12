import { Archive, GitFork, Star, Watch } from "lucide-react";
import type { UserInsights } from "../lib/types";
import { compactNumber, formatDate } from "../lib/utils";
import { MetricCard } from "./MetricCard";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface RepositoryAnalyticsProps {
  insights: UserInsights;
}

export function RepositoryAnalytics({ insights }: RepositoryAnalyticsProps) {
  const repo = insights.repositoryAnalytics;

  return (
    <section className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Repositories" value={repo.totalRepositories} icon={GitFork} />
        <MetricCard label="Total Stars" value={repo.totalStars} icon={Star} />
        <MetricCard label="Total Forks" value={repo.totalForks} icon={GitFork} />
        <MetricCard label="Total Watchers" value={repo.totalWatchers} icon={Watch} />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <RepoHighlight title="Most Starred" repo={repo.mostStarredRepository} metric={`${compactNumber(repo.mostStarredRepository?.stargazers_count ?? 0)} stars`} />
        <RepoHighlight title="Most Forked" repo={repo.mostForkedRepository} metric={`${compactNumber(repo.mostForkedRepository?.forks_count ?? 0)} forks`} />
        <Card>
          <CardHeader>
            <CardTitle>Repository Mix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <MixRow label="Archived" value={repo.archivedRepositories.length} icon={Archive} />
            <MixRow label="Forked" value={repo.forkedRepositories.length} icon={GitFork} />
            <MixRow label="Primary Languages" value={repo.languages.length} icon={Star} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Most Active Repositories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-muted-foreground">
                <tr className="border-b">
                  <th className="py-3 pr-4 font-medium">Repository</th>
                  <th className="py-3 pr-4 font-medium">Language</th>
                  <th className="py-3 pr-4 font-medium">Stars</th>
                  <th className="py-3 pr-4 font-medium">Forks</th>
                  <th className="py-3 pr-4 font-medium">Updated</th>
                  <th className="py-3 pr-4 font-medium">Activity</th>
                </tr>
              </thead>
              <tbody>
                {repo.mostActiveRepositories.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-3 pr-4">
                      <a href={item.html_url} target="_blank" rel="noreferrer" className="font-medium hover:text-primary">
                        {item.name}
                      </a>
                      {item.description ? <p className="line-clamp-1 text-xs text-muted-foreground">{item.description}</p> : null}
                    </td>
                    <td className="py-3 pr-4">{item.language ?? "N/A"}</td>
                    <td className="py-3 pr-4">{compactNumber(item.stargazers_count)}</td>
                    <td className="py-3 pr-4">{compactNumber(item.forks_count)}</td>
                    <td className="py-3 pr-4">{formatDate(item.pushed_at ?? item.updated_at)}</td>
                    <td className="py-3 pr-4">{compactNumber(item.activityScore ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

interface RepoHighlightProps {
  title: string;
  repo: UserInsights["repositoryAnalytics"]["mostStarredRepository"];
  metric: string;
}

function RepoHighlight({ title, repo, metric }: RepoHighlightProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {repo ? (
          <div className="space-y-3">
            <a href={repo.html_url} target="_blank" rel="noreferrer" className="text-lg font-semibold hover:text-primary">
              {repo.name}
            </a>
            <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">{repo.description ?? "No description available."}</p>
            <div className="flex flex-wrap gap-2">
              <Badge>{metric}</Badge>
              {repo.language ? <Badge>{repo.language}</Badge> : null}
              {repo.archived ? <Badge>Archived</Badge> : null}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No repositories found.</p>
        )}
      </CardContent>
    </Card>
  );
}

function MixRow({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Archive }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border p-3">
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {label}
      </span>
      <span className="font-semibold">{compactNumber(value)}</span>
    </div>
  );
}

