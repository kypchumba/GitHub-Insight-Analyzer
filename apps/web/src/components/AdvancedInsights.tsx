import { Award, Flame, Medal, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import type { UserInsights } from "../lib/types";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";

interface AdvancedInsightsProps {
  insights: UserInsights;
}

const scoreRows = [
  ["Account", "accountScore", Award],
  ["Repository Health", "repositoryHealthScore", ShieldCheck],
  ["Open Source", "openSourceActivityScore", Sparkles],
  ["Popularity", "popularityScore", TrendingUp],
  ["Developer Activity", "developerActivityScore", Flame]
] as const;

export function AdvancedInsights({ insights }: AdvancedInsightsProps) {
  const scores = insights.scores;

  return (
    <section className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <Card>
        <CardContent className="flex h-full flex-col items-center justify-center p-6 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-8 border-primary/20 bg-primary text-4xl font-bold text-primary-foreground">
            {scores.rank}
          </div>
          <h2 className="mt-4 text-xl font-semibold tracking-normal">{scores.overallScore}/100</h2>
          <p className="text-sm text-muted-foreground">Overall developer score</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {scores.badges.map((badge) => (
              <Badge key={badge} className="border-primary/40 text-foreground">
                <Medal className="mr-1 h-3 w-3 text-accent" />
                {badge}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Advanced Scores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {scoreRows.map(([label, key, Icon]) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <Icon className="h-4 w-4 text-primary" />
                  {label}
                </span>
                <span className="text-muted-foreground">{scores[key]}/100</span>
              </div>
              <Progress value={scores[key]} />
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}

