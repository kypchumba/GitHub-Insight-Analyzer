import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileDown, Heart, Link as LinkIcon, RefreshCcw } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { AdvancedInsights } from "../components/AdvancedInsights";
import { ContributionAnalytics } from "../components/ContributionAnalytics";
import { InsightCharts } from "../components/charts/InsightCharts";
import { ProfileDashboard } from "../components/ProfileDashboard";
import { RepositoryAnalytics } from "../components/RepositoryAnalytics";
import { SocialTables } from "../components/social/SocialTables";
import { TrendingRepos } from "../components/TrendingRepos";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { csvExportUrl, getRecommendations, getUserInsights } from "../lib/api";
import { exportPdf, downloadClientCsv } from "../lib/exporters";
import { addSearchHistory, getFavorites, toggleFavorite } from "../lib/storage";
import { formatDate, normalizeUsername } from "../lib/utils";

export default function UserPage() {
  const params = useParams();
  const username = normalizeUsername(params.username ?? "");
  const [favorites, setFavorites] = useState(() => getFavorites());

  const query = useQuery({
    queryKey: ["user", username],
    queryFn: () => getUserInsights(username),
    enabled: Boolean(username)
  });

  const recommendations = useQuery({
    queryKey: ["recommendations", username],
    queryFn: () => getRecommendations(username),
    enabled: query.isSuccess
  });

  useEffect(() => {
    if (query.data?.profile.login) {
      addSearchHistory(query.data.profile.login);
    }
  }, [query.data?.profile.login]);

  const isFavorite = useMemo(
    () => Boolean(query.data && favorites.some((item) => item.toLowerCase() === query.data.profile.login.toLowerCase())),
    [favorites, query.data]
  );

  if (query.isLoading) {
    return <DashboardSkeleton />;
  }

  if (query.isError) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <h1 className="text-2xl font-semibold tracking-normal">Profile unavailable</h1>
            <p className="text-muted-foreground">{query.error instanceof Error ? query.error.message : "Unable to load this GitHub user."}</p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => query.refetch()}>
                <RefreshCcw className="h-4 w-4" />
                Retry
              </Button>
              <Link to="/" className="inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium hover:bg-secondary">
                New search
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!query.data) {
    return null;
  }

  const insights = query.data;
  const shareUrl = window.location.href;

  return (
    <main className="printable-dashboard mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="no-print flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold tracking-normal">@{insights.profile.login}</h2>
            <Badge>Generated {formatDate(insights.generatedAt)}</Badge>
            {insights.rateLimit?.remaining !== null && insights.rateLimit?.remaining !== undefined ? (
              <Badge>API remaining {insights.rateLimit.remaining}</Badge>
            ) : null}
          </div>
          <p className="truncate text-sm text-muted-foreground">{shareUrl}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={isFavorite ? "secondary" : "outline"}
            onClick={() => setFavorites(toggleFavorite(insights.profile.login))}
            title={isFavorite ? "Remove favorite" : "Add favorite"}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
            Favorite
          </Button>
          <Button variant="outline" onClick={() => navigator.clipboard.writeText(shareUrl)}>
            <LinkIcon className="h-4 w-4" />
            Copy URL
          </Button>
          <Button variant="outline" onClick={() => downloadClientCsv(insights)}>
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <a href={csvExportUrl(insights.profile.login)} className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-secondary">
            <Download className="h-4 w-4" />
            API CSV
          </a>
          <Button onClick={() => exportPdf(insights)}>
            <FileDown className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      <ProfileDashboard insights={insights} />
      <AdvancedInsights insights={insights} />
      <RepositoryAnalytics insights={insights} />
      <ContributionAnalytics insights={insights} />
      <InsightCharts insights={insights} />
      <SocialTables insights={insights} />
      <TrendingRepos title="Repository Recommendations" repositories={recommendations.data} isLoading={recommendations.isLoading} />
    </main>
  );
}

function DashboardSkeleton() {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <Skeleton className="h-20" />
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <Skeleton className="h-72" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
      </div>
      <Skeleton className="h-72" />
      <Skeleton className="h-96" />
    </main>
  );
}
