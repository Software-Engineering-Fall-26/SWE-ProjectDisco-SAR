import {
  handleAnalyzeRequest,
  handleEnhanceRequest,
} from "./handleAnalyzeRequest.js";
import { AnalysisError } from "./groq.js";

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on("data", (chunk) => {
      size += chunk.length;

      if (size > 20_000) {
        reject(new AnalysisError("Idea is too long to analyze.", 413));
        req.destroy();
        return;
      }

      chunks.push(chunk);
    });

    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");

      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new AnalysisError("Request body must be JSON.", 400));
      }
    });

    req.on("error", () => {
      reject(new AnalysisError("Could not read the request.", 400));
    });
  });
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

const ideaRoutes = {
  "/api/analyze-idea": handleAnalyzeRequest,
  "/api/enhance-idea": handleEnhanceRequest,
};

function attachAnalyzeRoute(middlewares, env) {
  middlewares.use(async (req, res, next) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const handle = ideaRoutes[url.pathname];

    if (!handle) {
      next();
      return;
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      sendJson(res, 405, { error: "Use POST." });
      return;
    }

    try {
      const body = await readJsonBody(req);
      const result = await handle({
        body,
        apiKey: env.GROQ_API_KEY,
        authorization: req.headers.authorization,
        supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL,
        supabaseAnonKey:
          env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY,
      });

      sendJson(res, 200, result);
    } catch (error) {
      const status = error.status || 500;
      sendJson(res, status, {
        error: error.message || "Could not complete that request.",
      });
    }
  });
}

export function groqAnalyzePlugin(env) {
  return {
    name: "groq-analyze-idea",
    configureServer(server) {
      attachAnalyzeRoute(server.middlewares, env);
    },
    configurePreviewServer(server) {
      attachAnalyzeRoute(server.middlewares, env);
    },
  };
}
