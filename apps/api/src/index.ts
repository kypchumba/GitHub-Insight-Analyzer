import compression from "compression";
import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./env.js";
import { GitHubApiError } from "./services/githubClient.js";
import { githubRouter } from "./routes/github.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: env.NODE_ENV === "production" ? undefined : false
  })
);
app.use(compression());
app.use(cors({ origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    name: "GitHub Insight Analyzer API",
    timestamp: new Date().toISOString()
  });
});

app.use("/api", githubRouter);

const clientDist = path.resolve(__dirname, "../../web/dist");
app.use(express.static(clientDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }

  res.sendFile(path.join(clientDist, "index.html"), (error) => {
    if (error) {
      next();
    }
  });
});

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof GitHubApiError) {
    const status = error.status === 404 ? 404 : error.status === 403 ? 429 : error.status;
    res.status(status).json({
      message:
        error.status === 404
          ? "GitHub user was not found. Check the username and try again."
          : error.message,
      rateLimit: error.rateLimit,
      details: error.details
    });
    return;
  }

  if (error?.name === "ZodError") {
    res.status(400).json({ message: "Invalid request.", details: error.flatten?.() ?? error });
    return;
  }

  console.error(error);
  res.status(500).json({ message: "Unexpected server error." });
};

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`GitHub Insight Analyzer API running on http://localhost:${env.PORT}`);
});

