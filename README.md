# GitHub Insight Analyzer

GitHub Insight Analyzer is a full-stack TypeScript web application for exploring public GitHub user statistics without requiring visitor login or OAuth. Users can enter any public username and see profile details, repository analytics, contribution signals, social graph comparisons, scoring, badges, charts, exports, recommendations, and two-user comparisons.

## Features

- Public GitHub username search with invalid-user errors.
- Profile dashboard with avatar, name, bio, company, location, website, join date, followers, following, repositories, and gists.
- Repository analytics for stars, forks, watchers, languages, timelines, active repositories, archived repositories, and forked repositories.
- Contribution analytics using public REST search endpoints and optional GitHub GraphQL contribution calendar when `GITHUB_TOKEN` is configured.
- Social analytics by fetching `/followers` and `/following`, then calculating not-following-back, fans, and mutuals.
- Advanced scores: account, repository health, open-source activity, popularity, developer activity, overall rank, and badges.
- Recharts visualizations for repository stars, forks, languages, growth, followers vs following, and contribution trends.
- Light/dark mode, loading skeletons, animated counters, search history, favorites, shareable profile URLs, CSV export, PDF export, compare mode, recommendations, and trending repositories.
- Express API caching, retry logic, rate-limit propagation, and paginated GitHub fetching.
- Docker, GitHub Actions CI, and Vercel frontend configuration.

## Tech Stack

Frontend:

- React
- TypeScript
- Tailwind CSS
- Shadcn-inspired reusable UI components
- TanStack Query
- Recharts
- jsPDF

Backend:

- Node.js
- Express
- TypeScript
- GitHub REST API
- GitHub GraphQL API for contribution calendar when a server token is available

## Folder Structure

```text
githubstat/
  apps/
    api/
      src/
        routes/          Express API routes
        services/        GitHub client, caching, analytics, scoring
        types/           Shared backend data contracts
        env.ts           Environment validation
        index.ts         API bootstrap and static frontend serving
    web/
      src/
        components/      Dashboard, charts, social tables, UI primitives
        hooks/           Animated counter hook
        lib/             API client, storage, types, exports, utilities
        pages/           Home, profile, compare routes
  .github/workflows/ci.yml
  Dockerfile
  docker-compose.yml
  vercel.json
```

## Installation

```bash
npm install
cp .env.example .env
npm run dev
```

The dev command starts:

- API: `http://localhost:4000`
- Web: `http://localhost:5173`

Open `http://localhost:5173` and search for a public GitHub username.

## Environment Variables

```bash
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
CACHE_TTL_SECONDS=300
MAX_GITHUB_PAGES=50
GITHUB_TOKEN=
VITE_API_URL=http://localhost:4000
```

`GITHUB_TOKEN` is optional. Without it, the app still works through public REST endpoints, but GraphQL contribution calendar data is unavailable and GitHub rate limits are lower. The token belongs to the server, not the app user, so visitors do not need GitHub login or OAuth.

## API Architecture

The backend exposes a small API layer under `/api`:

```text
GET /api/health
GET /api/users/:username
GET /api/users/:username/export.csv
GET /api/users/:username/recommendations
GET /api/compare/:left/:right
GET /api/trending
```

`GET /api/users/:username` orchestrates:

- `GET /users/{username}`
- `GET /users/{username}/repos`
- `GET /users/{username}/followers`
- `GET /users/{username}/following`
- repository language endpoints
- GitHub Search API counts for commits, pull requests, issues opened, and issues closed
- optional GraphQL `contributionsCollection.contributionCalendar`

The API uses an in-memory TTL cache to reduce repeated GitHub calls, paginates REST list endpoints up to `MAX_GITHUB_PAGES`, retries transient failures, and returns GitHub rate-limit metadata to the frontend.

## Social Analytics Logic

GitHub does not expose a direct "not following back" endpoint. The backend fetches:

```text
GET /users/{username}/followers
GET /users/{username}/following
```

Then it calculates:

- Not Following Back: `following - followers`
- Fans: `followers - following`
- Mutual Connections: `intersection(followers, following)`

The frontend displays each category in searchable tables.

## Build

```bash
npm run typecheck
npm run lint
npm run build
npm run start
```

In production, the Express app serves the built frontend from `apps/web/dist`.

## Docker

```bash
docker compose up --build
```

Then open `http://localhost:4000`.

## Vercel Deployment

The included `vercel.json` deploys the frontend from `apps/web/dist`. Update the API rewrite destination:

```json
{
  "source": "/api/(.*)",
  "destination": "https://your-api-host.example.com/api/$1"
}
```

Set `VITE_API_URL` if the frontend should call a separately hosted API directly.

## CI/CD

`.github/workflows/ci.yml` runs on pushes and pull requests to `main`:

- install dependencies
- typecheck
- lint
- build
- Docker image build

## Notes

- Public unauthenticated GitHub REST API calls are rate limited. Add `GITHUB_TOKEN` for higher limits and contribution calendar support.
- Very large accounts may require increasing `MAX_GITHUB_PAGES`, but that also increases API usage.
- The scoring model is deterministic and transparent; adjust `apps/api/src/services/scoring.ts` to tune ranking behavior.

