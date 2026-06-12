import { GitCommit, GitPullRequest, MessageSquare, TimerReset } from "lucide-react";
import type { ContributionDay, UserInsights } from "../lib/types";
import { compactNumber } from "../lib/utils";
import { MetricCard } from "./MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface ContributionAnalyticsProps {
  insights: UserInsights;
}

export function ContributionAnalytics({ insights }: ContributionAnalyticsProps) {
  const contribution = insights.contributionAnalytics;

  return (
    <section className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Commits" value={contribution.commitCount} icon={GitCommit} />
        <MetricCard label="Pull Requests" value={contribution.pullRequestsOpened} icon={GitPullRequest} />
        <MetricCard label="Issues Opened" value={contribution.issuesOpened} icon={MessageSquare} />
        <MetricCard label="Issues Closed" value={contribution.issuesClosed} icon={MessageSquare} />
        <MetricCard label="Active Repos" value={contribution.averageRepositoryActivity} icon={TimerReset} detail="last 180 days %" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contribution Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          {contribution.calendar ? (
            <div className="overflow-x-auto pb-2">
              <div className="grid min-w-[720px] grid-flow-col grid-rows-7 gap-1">
                {contribution.calendar.weeks.flatMap((week) =>
                  week.contributionDays.map((day) => <ContributionCell key={day.date} day={day} />)
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span>Total: {compactNumber(contribution.calendar.totalContributions)}</span>
                <span>Current streak: {compactNumber(contribution.currentStreak)} days</span>
                <span>Longest streak: {compactNumber(contribution.longestStreak)} days</span>
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              {contribution.calendarUnavailableReason}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function ContributionCell({ day }: { day: ContributionDay }) {
  const level =
    day.contributionCount === 0
      ? "bg-muted"
      : day.contributionCount < 3
        ? "bg-primary/30"
        : day.contributionCount < 8
          ? "bg-primary/60"
          : "bg-primary";

  return (
    <span
      title={`${day.date}: ${day.contributionCount} contributions`}
      className={`h-3 w-3 rounded-[2px] ${level}`}
      aria-label={`${day.date}: ${day.contributionCount} contributions`}
    />
  );
}

