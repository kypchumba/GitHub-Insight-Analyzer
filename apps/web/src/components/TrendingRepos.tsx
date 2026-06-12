import { useQuery } from "@tanstack/react-query";
import { ExternalLink, GitFork, Star } from "lucide-react";
import { getTrending } from "../lib/api";
import type { TrendingRepository } from "../lib/types";
import { compactNumber } from "../lib/utils";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

interface TrendingReposProps {
  title?: string;
  repositories?: TrendingRepository[];
  isLoading?: boolean;
}

export function TrendingRepos({ title = "Trending Repositories", repositories, isLoading }: TrendingReposProps) {
  const trending = useQuery({
    queryKey: ["trending"],
    queryFn: getTrending,
    enabled: !repositories
  });

  const rows = repositories ?? trending.data ?? [];
  const loading = isLoading ?? trending.isLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-32" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {rows.map((repo) => (
              <a key={repo.id} href={repo.url} target="_blank" rel="noreferrer" className="rounded-lg border p-4 transition hover:border-primary">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-1 font-semibold">{repo.name}</h3>
                  <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
                <p className="mt-2 line-clamp-2 min-h-10 text-sm text-muted-foreground">{repo.description ?? repo.fullName}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {repo.language ? <Badge>{repo.language}</Badge> : null}
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {compactNumber(repo.stars)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <GitFork className="h-3 w-3" />
                    {compactNumber(repo.forks)}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

