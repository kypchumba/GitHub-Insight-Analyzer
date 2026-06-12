import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { ReactNode } from "react";
import type { UserInsights } from "../../lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

const colors = ["#2da44e", "#bf8700", "#0969da", "#8250df", "#cf222e", "#1f883d", "#9a6700", "#57606a"];

interface InsightChartsProps {
  insights: UserInsights;
}

export function InsightCharts({ insights }: InsightChartsProps) {
  const repo = insights.repositoryAnalytics;
  const social = [
    { label: "Followers", value: insights.profile.followers },
    { label: "Following", value: insights.profile.following }
  ];
  const contributionTrend = insights.contributionAnalytics.monthlyTrend.slice(-12);

  return (
    <section className="grid gap-5 xl:grid-cols-2">
      <ChartCard title="Stars by Repository">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={repo.starsByRepository}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="name" interval={0} angle={-25} textAnchor="end" height={80} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="stars" fill="#2da44e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Forks by Repository">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={repo.forksByRepository}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="name" interval={0} angle={-25} textAnchor="end" height={80} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="forks" fill="#0969da" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Language Distribution">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={repo.languages.slice(0, 8)} dataKey="percentage" nameKey="name" innerRadius={58} outerRadius={98} paddingAngle={2}>
              {repo.languages.slice(0, 8).map((entry, index) => (
                <Cell key={entry.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value}%`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Repository Growth Timeline">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={repo.repositoryCreationTimeline}>
            <defs>
              <linearGradient id="repoGrowth" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#2da44e" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#2da44e" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="month" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Area type="monotone" dataKey="cumulative" stroke="#2da44e" fill="url(#repoGrowth)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Followers vs Following">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={social}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="label" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#bf8700" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Contribution Trends">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={contributionTrend}>
            <defs>
              <linearGradient id="contributionTrend" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#8250df" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#8250df" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="month" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Area type="monotone" dataKey="contributions" stroke="#8250df" fill="url(#contributionTrend)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </section>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
