import { Router } from "express";
import { z } from "zod";
import { getRepositoryRecommendations, getTrendingRepositories, getUserInsights, toCsv } from "../services/analyzer.js";

export const githubRouter = Router();

const usernameSchema = z.string().trim().min(1).max(39).regex(/^[a-zA-Z0-9-]+$/, "Invalid GitHub username");

githubRouter.get("/users/:username", async (req, res, next) => {
  try {
    const username = usernameSchema.parse(req.params.username);
    res.json(await getUserInsights(username));
  } catch (error) {
    next(error);
  }
});

githubRouter.get("/users/:username/export.csv", async (req, res, next) => {
  try {
    const username = usernameSchema.parse(req.params.username);
    const insights = await getUserInsights(username);
    res.header("Content-Type", "text/csv");
    res.attachment(`${insights.profile.login}-github-insights.csv`);
    res.send(toCsv(insights));
  } catch (error) {
    next(error);
  }
});

githubRouter.get("/users/:username/recommendations", async (req, res, next) => {
  try {
    const username = usernameSchema.parse(req.params.username);
    res.json(await getRepositoryRecommendations(username));
  } catch (error) {
    next(error);
  }
});

githubRouter.get("/compare/:left/:right", async (req, res, next) => {
  try {
    const left = usernameSchema.parse(req.params.left);
    const right = usernameSchema.parse(req.params.right);
    const [leftInsights, rightInsights] = await Promise.all([getUserInsights(left), getUserInsights(right)]);

    res.json({
      left: leftInsights,
      right: rightInsights,
      winner:
        leftInsights.scores.overallScore === rightInsights.scores.overallScore
          ? null
          : leftInsights.scores.overallScore > rightInsights.scores.overallScore
            ? leftInsights.profile.login
            : rightInsights.profile.login
    });
  } catch (error) {
    next(error);
  }
});

githubRouter.get("/trending", async (req, res, next) => {
  try {
    const language = typeof req.query.language === "string" ? req.query.language : undefined;
    res.json(await getTrendingRepositories(language));
  } catch (error) {
    next(error);
  }
});

