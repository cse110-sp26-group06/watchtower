import { jsonResponse } from '../index.js'; // imported function which is convenient for consistent response return
import { validateApiKey } from '../middleware/auth.js';
import { storeError, storePerformance } from '../storage/d1.js'; // import functions from storage and link with it
const VALID_ENDPOINTS = ['/ingest/error', '/ingest/log', '/ingest/performance'];
const REQUIRED_PAYLOAD_FIELDS = {
  // added all properties in event except for severity, will add it after sdk implements it
  '/ingest/error': ['message', 'type', 'stack_trace', 'file', 'lineno', 'colno'],
  '/ingest/log': ['message', 'level', 'timestamp'],
  '/ingest/performance': ['name', 'entryType', 'time', 'duration'],
};

// Hardcoded keys for now — BE-4 replaces with D1 lookup


/**
 * Handles all ingest POST requests from the SDK
 * @param {Request} request - incoming request
 * @param {object} env - Cloudflare env with D1 binding
 * @param {string} path - the endpoint path
 */
export async function handleIngest(request, env, path) {
  // Validate endpoint
  if (!VALID_ENDPOINTS.includes(path)) {
    return jsonResponse({ status: 'error', message: 'Not found' }, 404);
  }

  // Parse JSON body
  let data;
  try {
    data = await request.json();
  } catch {
    return jsonResponse({ status: 'error', message: 'Invalid JSON' }, 400);
  }

  // Validate API key
  const checkAPI = await validateApiKey(env, data.api_key);
  if (!checkAPI) {
    return jsonResponse({ status: 'error', message: 'Invalid API key' }, 401);
  }

  // Validate required envelope fields
  if (!data.service || !data.environment) {
    return jsonResponse({ status: 'error', message: 'Missing required fields' }, 400);
  }

  // Validate events array
  if (!data.events || data.events.length === 0) {
    return jsonResponse({ status: 'error', message: 'No events' }, 400);
  }

  // Loop 1 — validate all events before storing anything
  for (const event of data.events) {
    if (!event.timestamp || !event.payload || !event.event_type) {
      return jsonResponse({ status: 'error', message: 'Invalid event format' }, 400);
    }

    // Validate required payload fields per endpoint
    const requiredFields = REQUIRED_PAYLOAD_FIELDS[path];
    for (const field of requiredFields) {
      if (event.payload[field] === undefined || event.payload[field] === null) {
        return jsonResponse({ status: 'error', message: `Missing required event payload field: ${field}` }, 400);
      }
    }
  }

  // Loop 2 — build record and store each event in D1
  const server_timestamp = new Date().toISOString();
  for (const event of data.events) {
    try {
      if (path === '/ingest/error') {
        const record = {
          id: crypto.randomUUID(), // generates random and unique id for the event
          api_key: data.api_key,
          service: data.service,
          environment: data.environment,
          message: event.payload.message,
          error_type: event.payload.type || null,
          severity: event.payload.severity || 'error', // set to error for null case as it is not implemented yet
          stack_trace: event.payload.stack_trace,
          file: event.payload.file,        
          lineno: event.payload.lineno,    
          colno: event.payload.colno,      
          payload_json: JSON.stringify(event.payload),
          client_timestamp: event.timestamp,
          server_timestamp,
          status: 'unresolved',
        };
        // we send this bounded data to
        await storeError(env, record);
      } else if (path === '/ingest/performance') {
        const record = {
          id: crypto.randomUUID(),
          api_key: data.api_key,
          service: data.service,
          environment: data.environment,
          name: event.payload.name,
          entry_type: event.payload.entryType,
          time: event.payload.time,
          duration: event.payload.duration,
          payload_json: JSON.stringify(event.payload),
          client_timestamp: event.timestamp,
          server_timestamp,
        };
        await storePerformance(env, record);
      }
      // storeLog and storePerformance added once Ethan adds tables
    } catch (err) {
      console.error('D1 write failed:', err);
      return jsonResponse({ status: 'error', message: 'Storage error' }, 500);
    }
  }

  return jsonResponse({ status: 'ok' }, 200);
}
