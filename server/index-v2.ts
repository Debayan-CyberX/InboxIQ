// Express server for Better Auth API routes - Alternative approach
import express from "express";
import cors from "cors";
import { auth } from "./auth.js";

const app = express();
const PORT = process.env.AUTH_PORT || 3001;
const VITE_PORT = process.env.VITE_PORT || 8080;

// Middleware
app.use(cors({
  origin: [
    `http://localhost:${VITE_PORT}`,
    `http://localhost:5173`,
    process.env.VITE_APP_URL || "http://localhost:8080"
  ],
  credentials: true,
}));
app.use(express.json());

// Better Auth API routes
// Try using the handler as a request handler
app.use("/api/auth", async (req, res) => {
  try {
    console.log(`📥 ${req.method} ${req.originalUrl}`);
    // Better Auth handler - might need different signature
    const handler = auth.handler;
    if (typeof handler === 'function') {
      // Try calling with just request, it might return a response
      const result = await handler(req);
      if (result) {
        return res.json(result);
      }
    }
    // If handler didn't respond, send error
    if (!res.headersSent) {
      res.status(404).json({ error: "Auth endpoint not found" });
    }
  } catch (error) {
    console.error("❌ Auth handler error:", error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: "Internal server error", 
        message: error instanceof Error ? error.message : String(error) 
      });
    }
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "better-auth" });
});

app.listen(PORT, () => {
  console.log(`\n✅ Better Auth server running on http://localhost:${PORT}`);
  console.log(`📡 Auth API available at http://localhost:${PORT}/api/auth`);
  console.log(`🔗 Make sure VITE_BETTER_AUTH_URL=http://localhost:${PORT} in your .env.local\n`);
});









