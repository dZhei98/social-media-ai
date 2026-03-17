import cookieParser from "cookie-parser";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import authRoutes from "./routes/auth.routes.js";
import postRoutes from "./routes/posts.routes.js";
import userRoutes from "./routes/users.routes.js";
import { attachCurrentUser } from "./middleware/auth.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { renderApp } from "./ssr/render.jsx";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const appRoot = path.resolve(currentDir, "..");

export function createApp() {
  const app = express();

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(attachCurrentUser);

  app.use(express.static(path.join(appRoot, "public")));

  app.get("/health", (req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/posts", postRoutes);

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/") || req.path === "/api" || path.extname(req.path)) {
      next();
      return;
    }

    renderApp(req, res);
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
