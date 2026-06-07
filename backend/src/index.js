import { handleIngest } from "./routes/ingest.js";
import { generateApiKey, createUser, getUserById } from './middleware/auth.js';
import { handleGetErrors, handleGetErrorById, handleResolveError } from './routes/errors.js';
import { handleListProjects } from './routes/projects.js';
import { handleGetLogs } from './routes/logs.js';
import { handleGetPerformance } from './routes/performance.js';
import { handleGetNotificationSettings, handleUpdateNotificationSettings } from './routes/notifications.js';
import { sendDailyDigests } from './cron/digest.js';

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

    // User creation — sprint 4 stub: no password, identity is the returned user_id
    if (path === '/api/users' && request.method === 'POST') {
      let body;
      try {
        body = await request.json();
      } catch {
        return jsonResponse({ status: 'error', message: 'Invalid JSON' }, 400);
      }

      if (!body.email) {
        return jsonResponse({ status: 'error', message: 'Email required' }, 400);
      }

      try {
        const user = await createUser(env, body.email);
        return jsonResponse({ status: 'ok', user_id: user.id, email: user.email }, 201);
      } catch (err) {
        // D1 UNIQUE constraint on email
        if (String(err.message || '').includes('UNIQUE')) {
          return jsonResponse({ status: 'error', message: 'Email already in use' }, 409);
        }
        console.error('Failed to create user:', err);
        return jsonResponse({ status: 'error', message: 'Failed to create user' }, 500);
      }
    }

    // Project creation — generates and stores a new API key for a given owner
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
      if (!body.user_id) {
        return jsonResponse({ status: 'error', message: 'user_id required' }, 400);
      }

      const owner = await getUserById(env, body.user_id);
      if (!owner) {
        return jsonResponse({ status: 'error', message: 'Unknown user_id' }, 404);
      }

      try {
        const key = await generateApiKey(env, body.name, owner.id);
        return jsonResponse({ status: 'ok', project_id: key.id, api_key: key.api_key }, 201);
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

    // Notification settings
    if (path === '/api/notifications/settings' && request.method === 'GET') {
      return handleGetNotificationSettings(request, env);
    }
    if (path === '/api/notifications/settings' && request.method === 'POST') {
      return handleUpdateNotificationSettings(request, env);
    }

    // Project list — Dashboard's project-selection flow
    if (path === '/api/projects' && request.method === 'GET') {
      return handleListProjects(request, env);
    }
    
    // if (path.startsWith("/api/")) { ... }
    // Read API routes — Dashboard calls these to display errors
    if (path === '/api/errors' && request.method === 'GET') {
      return handleGetErrors(request, env);
    }
    if (path === '/api/performance' && request.method === 'GET') {
      return handleGetPerformance(request, env);
    }
    if (path === '/api/logs' && request.method === 'GET') {
      return handleGetLogs(request, env);
    }
    return jsonResponse({ status: "error", message: "Not found" }, 404);
  },
  async scheduled(event, env) {
    await sendDailyDigests(env);
  }
};

export function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
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
