import { FormEvent, useMemo, useState } from "react";
import { BarChart3, GitCompare, History, Search, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getFavorites, getSearchHistory } from "../lib/storage";
import { normalizeUsername } from "../lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";

export function SearchPanel() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const history = useMemo(() => getSearchHistory(), []);
  const favorites = useMemo(() => getFavorites(), []);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const normalized = normalizeUsername(username);
    if (normalized) {
      navigate(`/u/${normalized}`);
    }
  };

  const submitCompare = (event: FormEvent) => {
    event.preventDefault();
    const leftUser = normalizeUsername(left);
    const rightUser = normalizeUsername(right);
    if (leftUser && rightUser) {
      navigate(`/compare/${leftUser}/${rightUser}`);
    }
  };

  return (
    <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <BarChart3 className="h-5 w-5" />
            </span>
            <div>
              <CardTitle className="text-xl">Analyze a GitHub Profile</CardTitle>
              <p className="text-sm text-muted-foreground">Public profile, repositories, contribution signals, and social graph.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-5">
          <form onSubmit={submitSearch} className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="pl-9"
                placeholder="octocat"
                aria-label="GitHub username"
              />
            </div>
            <Button type="submit" className="sm:w-36">
              <Search className="h-4 w-4" />
              Analyze
            </Button>
          </form>

          <div className="grid gap-4 sm:grid-cols-2">
            <QuickList icon={History} title="Recent" items={history} onPick={(item) => navigate(`/u/${item}`)} />
            <QuickList icon={Star} title="Favorites" items={favorites} onPick={(item) => navigate(`/u/${item}`)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
              <GitCompare className="h-5 w-5" />
            </span>
            <div>
              <CardTitle>Compare Developers</CardTitle>
              <p className="text-sm text-muted-foreground">Score two public profiles side by side.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <form onSubmit={submitCompare} className="space-y-3">
            <Input value={left} onChange={(event) => setLeft(event.target.value)} placeholder="first username" aria-label="First username" />
            <Input value={right} onChange={(event) => setRight(event.target.value)} placeholder="second username" aria-label="Second username" />
            <Button type="submit" variant="secondary" className="w-full">
              <GitCompare className="h-4 w-4" />
              Compare
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

interface QuickListProps {
  icon: typeof History;
  title: string;
  items: string[];
  onPick: (item: string) => void;
}

function QuickList({ icon: Icon, title, items, onPick }: QuickListProps) {
  return (
    <div className="rounded-lg border p-3">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {title}
      </div>
      <div className="flex min-h-9 flex-wrap gap-2">
        {items.length ? (
          items.map((item) => (
            <button key={item} type="button" onClick={() => onPick(item)}>
              <Badge className="cursor-pointer hover:border-primary hover:text-foreground">@{item}</Badge>
            </button>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">No entries yet</span>
        )}
      </div>
    </div>
  );
}

