import { jsonResponse } from '../index.js';
import { getLogs } from '../storage/d1.js';
import { validateApiKey } from '../middleware/auth.js';

export async function handleGetLogs(request,env) {
  const url = new URL(request.url);
  const api_key = url.searchParams.get('api_key');
  const project = await validateApiKey(env, api_key);
  if (!project) {
    return jsonResponse({ status: 'error', message: 'Invalid API key' }, 401);
  }

  const queryParams = {
    level: url.searchParams.get('level'),
    since: url.searchParams.get('since'),
    page: parseInt(url.searchParams.get('page') ?? '1'),
    limit: parseInt(url.searchParams.get('limit') ?? '20'),
  };

  try {
    const logs = await getLogs(env, api_key, queryParams);
    return jsonResponse({ status: 'ok', logs }, 200);
  } catch (err) {
    console.error('Failed to fetch logs:', err);
    return jsonResponse({ status: 'error', message: 'Failed to fetch logs' }, 500);
  }
}


