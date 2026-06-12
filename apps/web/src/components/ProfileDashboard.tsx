import { Building2, CalendarDays, ExternalLink, FileCode2, GitFork, Globe, MapPin, Users } from "lucide-react";
import type { UserInsights } from "../lib/types";
import { compactNumber, formatDate } from "../lib/utils";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";

interface ProfileDashboardProps {
  insights: UserInsights;
}

export function ProfileDashboard({ insights }: ProfileDashboardProps) {
  const { profile, repositoryAnalytics, socialAnalytics } = insights;

  return (
    <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <img
              src={profile.avatar_url}
              alt={`${profile.login} avatar`}
              className="h-20 w-20 rounded-lg border object-cover"
              loading="lazy"
            />
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-normal">{profile.name ?? profile.login}</h1>
              <a className="text-sm text-muted-foreground hover:text-primary" href={profile.html_url} target="_blank" rel="noreferrer">
                @{profile.login}
              </a>
              <div className="mt-3 flex flex-wrap gap-2">
                {insights.scores.badges.map((badge) => (
                  <Badge key={badge}>{badge}</Badge>
                ))}
              </div>
            </div>
          </div>

          {profile.bio ? <p className="mt-5 text-sm leading-6 text-muted-foreground">{profile.bio}</p> : null}

          <dl className="mt-5 space-y-3 text-sm">
            <Info icon={Building2} label={profile.company} />
            <Info icon={MapPin} label={profile.location} />
            <Info icon={Globe} label={profile.blog} href={profile.blog || undefined} />
            <Info icon={CalendarDays} label={`Joined ${formatDate(profile.created_at)}`} />
          </dl>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Followers" value={profile.followers} icon={Users} />
        <Stat label="Following" value={profile.following} icon={Users} />
        <Stat label="Public Repos" value={profile.public_repos} icon={FileCode2} />
        <Stat label="Public Gists" value={profile.public_gists} icon={FileCode2} />
        <Stat label="Total Stars" value={repositoryAnalytics.totalStars} icon={ExternalLink} />
        <Stat label="Total Forks" value={repositoryAnalytics.totalForks} icon={GitFork} />
        <Stat label="Watchers" value={repositoryAnalytics.totalWatchers} icon={Users} />
        <Stat label="Follower Ratio" value={socialAnalytics.followersToFollowingRatio} icon={Users} />
      </div>
    </section>
  );
}

interface InfoProps {
  icon: typeof Building2;
  label: string | null | undefined;
  href?: string;
}

function Info({ icon: Icon, label, href }: InfoProps) {
  if (!label) {
    return null;
  }

  const content = (
    <span className="min-w-0 truncate">
      {href ? label.replace(/^https?:\/\//, "") : label}
    </span>
  );

  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="h-4 w-4 shrink-0" />
      {href ? (
        <a href={href.startsWith("http") ? href : `https://${href}`} target="_blank" rel="noreferrer" className="min-w-0 hover:text-primary">
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
}

interface StatProps {
  label: string;
  value: number | null;
  icon: typeof Users;
}

function Stat({ label, value, icon: Icon }: StatProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="truncate text-2xl font-semibold tracking-normal">{value === null ? "N/A" : compactNumber(value)}</p>
        </div>
      </CardContent>
    </Card>
  );
}

