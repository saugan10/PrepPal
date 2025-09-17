import dotenv from 'dotenv';
import path from 'path';
// Load .env from project root early so modules that read process.env get the values
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Diagnostic logs to help confirm environment variables are present (masked)
const mongoPresent = Boolean(process.env.MONGODB_URI);
const geminiPresent = Boolean(process.env.GEMINI_API_KEY);
console.log('Startup env check: MONGODB_URI present=', mongoPresent, 'GEMINI_API_KEY present=', geminiPresent);
if (mongoPresent) {
  const uri = process.env.MONGODB_URI as string;
  console.log('MONGODB_URI preview:', uri.substring(0, 10) + '...' + uri.slice(-10));
}

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // log the error server-side but don't throw after responding
    console.error('Unhandled error caught by middleware:', err);
    res.status(status).json({ message });
    // do not rethrow here to avoid crashing the entire server
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  // Do not bind explicitly to '0.0.0.0' on Windows environments where it may be unsupported.
  server.listen(port, () => {
    const addr = server.address();
    if (addr && typeof addr === 'object') {
      log(`serving on ${(addr.address || '0.0.0.0')}:${addr.port}`);
    } else {
      log(`serving on port ${port}`);
    }
  });
})();
