import { handleIngest } from "./routes/ingest.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    // Ingestion routes
    if (path.startsWith("/ingest/") && request.method === "POST") {
      return handleIngest(request, env, path);
    }

    // Read API routes (BE-5 adds these)
    // if (path.startsWith("/api/")) { ... }

    return jsonResponse({ status: "error", message: "Not found" }, 404);
  },
};

export function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
    },
  });
}
