import { FormEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GitCompare, RefreshCcw, Search } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Progress } from "../components/ui/progress";
import { Skeleton } from "../components/ui/skeleton";
import { compareUsers } from "../lib/api";
import type { UserInsights } from "../lib/types";
import { compactNumber, normalizeUsername } from "../lib/utils";

export default function ComparePage() {
  const params = useParams();
  const navigate = useNavigate();
  const left = normalizeUsername(params.left ?? "");
  const right = normalizeUsername(params.right ?? "");
  const [leftInput, setLeftInput] = useState(left);
  const [rightInput, setRightInput] = useState(right);

  const query = useQuery({
    queryKey: ["compare", left, right],
    queryFn: () => compareUsers(left, right),
    enabled: Boolean(left && right)
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const nextLeft = normalizeUsername(leftInput);
    const nextRight = normalizeUsername(rightInput);
    if (nextLeft && nextRight) {
      navigate(`/compare/${nextLeft}/${nextRight}`);
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <Card>
        <CardContent className="p-5">
          <form onSubmit={submit} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <Input value={leftInput} onChange={(event) => setLeftInput(event.target.value)} placeholder="first username" />
            <Input value={rightInput} onChange={(event) => setRightInput(event.target.value)} placeholder="second username" />
            <Button type="submit">
              <GitCompare className="h-4 w-4" />
              Compare
            </Button>
          </form>
        </CardContent>
      </Card>

      {query.isLoading ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      ) : query.isError ? (
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <h1 className="text-2xl font-semibold tracking-normal">Comparison unavailable</h1>
            <p className="text-muted-foreground">{query.error instanceof Error ? query.error.message : "Unable to compare these users."}</p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => query.refetch()}>
                <RefreshCcw className="h-4 w-4" />
                Retry
              </Button>
              <Link to="/" className="inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium hover:bg-secondary">
                Search
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : query.data ? (
        <>
          <Card>
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-normal">Developer Comparison</h1>
                <p className="text-sm text-muted-foreground">
                  {query.data.winner ? `${query.data.winner} leads by overall score.` : "The overall score is tied."}
                </p>
              </div>
              <GitCompare className="h-8 w-8 text-primary" />
            </CardContent>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <CompareCard insights={query.data.left} opponent={query.data.right} />
            <CompareCard insights={query.data.right} opponent={query.data.left} />
          </div>
        </>
      ) : null}
    </main>
  );
}

function CompareCard({ insights, opponent }: { insights: UserInsights; opponent: UserInsights }) {
  const rows = [
    ["Overall Score", insights.scores.overallScore, opponent.scores.overallScore],
    ["Repos", insights.repositoryAnalytics.totalRepositories, opponent.repositoryAnalytics.totalRepositories],
    ["Stars", insights.repositoryAnalytics.totalStars, opponent.repositoryAnalytics.totalStars],
    ["Forks", insights.repositoryAnalytics.totalForks, opponent.repositoryAnalytics.totalForks],
    ["Followers", insights.profile.followers, opponent.profile.followers],
    ["Activity", insights.contributionAnalytics.averageRepositoryActivity, opponent.contributionAnalytics.averageRepositoryActivity]
  ] as const;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <img src={insights.profile.avatar_url} alt="" className="h-16 w-16 rounded-lg border" />
          <div className="min-w-0">
            <CardTitle className="truncate">{insights.profile.name ?? insights.profile.login}</CardTitle>
            <Link to={`/u/${insights.profile.login}`} className="text-sm text-muted-foreground hover:text-primary">
              @{insights.profile.login}
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {rows.map(([label, value, opponentValue]) => {
          const max = Math.max(value, opponentValue, 1);
          return (
            <div key={label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{label}</span>
                <span className="font-medium">{compactNumber(value)}</span>
              </div>
              <Progress value={(value / max) * 100} />
            </div>
          );
        })}
        <div className="rounded-md border p-3 text-sm text-muted-foreground">
          <Search className="mr-2 inline h-4 w-4" />
          Rank {insights.scores.rank}, {insights.scores.badges.join(", ")}
        </div>
      </CardContent>
    </Card>
  );
}

