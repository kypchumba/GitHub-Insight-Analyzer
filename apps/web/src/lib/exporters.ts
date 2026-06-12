import jsPDF from "jspdf";
import type { UserInsights } from "./types";
import { compactNumber, formatDate } from "./utils";

export function downloadClientCsv(insights: UserInsights) {
  const rows = [
    ["Section", "Metric", "Value"],
    ["Profile", "Username", insights.profile.login],
    ["Profile", "Name", insights.profile.name ?? ""],
    ["Profile", "Created", formatDate(insights.profile.created_at)],
    ["Repositories", "Total", String(insights.repositoryAnalytics.totalRepositories)],
    ["Repositories", "Stars", String(insights.repositoryAnalytics.totalStars)],
    ["Repositories", "Forks", String(insights.repositoryAnalytics.totalForks)],
    ["Social", "Followers", String(insights.profile.followers)],
    ["Social", "Following", String(insights.profile.following)],
    ["Social", "Fans", String(insights.socialAnalytics.fans.length)],
    ["Social", "Not following back", String(insights.socialAnalytics.notFollowingBack.length)],
    ["Scores", "Overall", String(insights.scores.overallScore)],
    ["Scores", "Rank", insights.scores.rank]
  ];
  const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll("\"", "\"\"")}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${insights.profile.login}-github-insights.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportPdf(insights: UserInsights) {
  const doc = new jsPDF();
  const profile = insights.profile;
  const repo = insights.repositoryAnalytics;
  const lines = [
    "GitHub Insight Analyzer",
    `${profile.name ?? profile.login} (@${profile.login})`,
    profile.bio ?? "",
    "",
    `Created: ${formatDate(profile.created_at)}`,
    `Followers: ${compactNumber(profile.followers)} | Following: ${compactNumber(profile.following)}`,
    `Public repos: ${compactNumber(profile.public_repos)} | Public gists: ${compactNumber(profile.public_gists)}`,
    "",
    `Total stars: ${compactNumber(repo.totalStars)}`,
    `Total forks: ${compactNumber(repo.totalForks)}`,
    `Total watchers: ${compactNumber(repo.totalWatchers)}`,
    `Top language: ${repo.languages[0]?.name ?? "N/A"}`,
    "",
    `Overall score: ${insights.scores.overallScore}/100`,
    `Rank: ${insights.scores.rank}`,
    `Badges: ${insights.scores.badges.join(", ")}`,
    "",
    `Generated: ${formatDate(insights.generatedAt)}`
  ];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(lines[0] ?? "", 16, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  let y = 30;
  lines.slice(1).forEach((line) => {
    const wrapped = doc.splitTextToSize(line, 178) as string[];
    doc.text(wrapped, 16, y);
    y += Math.max(6, wrapped.length * 6);
  });

  doc.save(`${profile.login}-github-insights.pdf`);
}

