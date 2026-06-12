import { useMemo, useState } from "react";
import { Search, UserRoundCheck, UserRoundPlus, UserRoundX } from "lucide-react";
import type { SimpleGitHubUser, UserInsights } from "../../lib/types";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type Tab = "notFollowingBack" | "fans" | "mutuals";

const tabs: Array<{ id: Tab; label: string; icon: typeof UserRoundX }> = [
  { id: "notFollowingBack", label: "Not Following Back", icon: UserRoundX },
  { id: "fans", label: "Fans", icon: UserRoundPlus },
  { id: "mutuals", label: "Mutuals", icon: UserRoundCheck }
];

interface SocialTablesProps {
  insights: UserInsights;
}

export function SocialTables({ insights }: SocialTablesProps) {
  const [tab, setTab] = useState<Tab>("notFollowingBack");
  const [query, setQuery] = useState("");
  const social = insights.socialAnalytics;
  const rows = social[tab];

  const filtered = useMemo(
    () => rows.filter((user) => user.login.toLowerCase().includes(query.trim().toLowerCase())),
    [query, rows]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Analytics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex items-center justify-between rounded-md border p-3 text-left transition ${
                  active ? "border-primary bg-primary/10" : "hover:bg-secondary"
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Icon className="h-4 w-4 text-primary" />
                  {item.label}
                </span>
                <span className="text-lg font-semibold">{social[item.id].length}</span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Search users" />
        </div>

        <div className="max-h-[420px] overflow-auto rounded-md border">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-card text-muted-foreground">
              <tr className="border-b">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Profile</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <SocialRow key={user.id} user={user} />
              ))}
              {!filtered.length ? (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function SocialRow({ user }: { user: SimpleGitHubUser }) {
  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <img src={user.avatar_url} alt="" className="h-9 w-9 rounded-md border" loading="lazy" />
          <span className="font-medium">@{user.login}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <a href={user.html_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
          Open
        </a>
      </td>
    </tr>
  );
}

