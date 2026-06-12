import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  MAX_GITHUB_PAGES: z.coerce.number().int().positive().default(50),
  GITHUB_TOKEN: z.string().optional()
});

export const env = envSchema.parse(process.env);

