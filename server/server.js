
import express from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { connectToDatabase } from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import projectRouter from "./routes/projectRoutes.js";

const app = express();

// Resolve frontend build directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientDistPath = path.resolve(
  __dirname,
  "../client/dist"
);

// Connect to MongoDB
await connectToDatabase();

// Middleware
const allowedOrigins = (process.env.ORIGINS || "")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests without an Origin header
    // and explicitly configured origins.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());

// API routes
app.use("/api/auth", authRouter);
app.use("/api/projects", projectRouter);

// Handle unknown API routes
app.use("/api", (req, res) => {
  res.status(404).json({
    message: "API route not found"
  });
});

// Serve React frontend
app.use(express.static(clientDistPath));

// React Router fallback
app.get("/{*splat}", (req, res) => {
  res.sendFile(
    path.join(clientDistPath, "index.html")
  );
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(`[Error] ${err.message}`);

  res.status(500).json({
    error: err.message
  });
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Promptify server running on port ${PORT}`);
});
