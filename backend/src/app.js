import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean)
  : ["http://localhost:5173"];

const normalizedOrigins = allowedOrigins.map((origin) => {
  try {
    return new URL(origin).origin;
  } catch {
    return origin.toLowerCase();
  }
});

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) {
        return cb(null, true);
      }

      const requestOrigin = origin.toLowerCase();
      if (normalizedOrigins.includes(requestOrigin)) {
        return cb(null, true);
      }

      try {
        const requestHostname = new URL(requestOrigin).hostname;
        if (normalizedOrigins.includes(requestHostname)) {
          return cb(null, true);
        }
      } catch {
        // ignore invalid origin parsing
      }

      return cb(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "team-task-manager-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Not found" });
});

app.use(errorHandler);

export default app;
