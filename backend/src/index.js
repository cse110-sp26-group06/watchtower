import { handleIngest } from "./routes/ingest.js";
import { generateApiKey } from './middleware/auth.js';
import { handleGetErrors, handleGetErrorById, handleResolveError } from './routes/errors.js';

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

    // 
    // Project creation — generates and stores a new API key
    if (path === '/api/key_generate' && request.method === 'POST') {
      let body;
      try {
        body = await request.json();
      } catch {
        return jsonResponse({ status: 'error', message: 'Invalid JSON' }, 400);
      }

      if (!body.name) {
        return jsonResponse({ status: 'error', message: 'Project name required' }, 400);
      }

      try {
        const key = await generateApiKey(env, body.name);
        return jsonResponse({ status: 'ok', project_id: key.id, api_key: key.api_key, }, 201);
      } catch (err) {
        console.error('Failed to create project:', err);
        return jsonResponse({ status: 'error', message: 'Failed to create project' }, 500);
      }
    }
    // Ingestion routes
    if (path.startsWith("/ingest/") && request.method === "POST") {
      return handleIngest(request, env, path);
    }

    // Single error detail — must be before /api/errors route
    if (path.startsWith('/api/errors/') && request.method === 'GET') {
      const id = path.replace('/api/errors/', '');
      return handleGetErrorById(request, env, id);
    }

    // Mark error as resolved
    if (path.startsWith('/api/errors/') && request.method === 'PATCH') {
      const id = path.replace('/api/errors/', '');
      return handleResolveError(request, env, id);
    }
    // Error list
    if (path === '/api/errors' && request.method === 'GET') {
      return handleGetErrors(request, env);
    }
    // Read API routes (BE-5 adds these)
    // if (path.startsWith("/api/")) { ... }
    // Read API routes — Dashboard calls these to display errors
    if (path === '/api/errors' && request.method === 'GET') {
      return handleGetErrors(request, env);
    }

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
