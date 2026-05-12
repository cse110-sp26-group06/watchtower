import { jsonResponse } from "../index.js";

const VALID_ENDPOINTS = ["/ingest/error", "/ingest/log", "/ingest/performance"];
const REQUIRED_PAYLOAD_FIELDS = {
  "/ingest/error": ["message", "stack_trace"],
  "/ingest/log": ["message", "level", "timestamp"],
  "/ingest/performance": ["name", "start_timestamp", "end_timestamp", "duration_ms"],
}

// Hardcoded keys for now — BE-4 replaces with D1 lookup
const API_KEYS = ["client1", "client2", "client3"];

export async function handleIngest(request, env, path) {
  // Validate endpoint
  if (!VALID_ENDPOINTS.includes(path)) {
    return jsonResponse({ status: "error", message: "Not found" }, 404);
  }

  // Parse JSON body
  let data;
  try {
    data = await request.json();
  } catch {
    return jsonResponse({ status: "error", message: "Invalid JSON" }, 400);
  }

  // Validate API key
  if (!data.api_key || !API_KEYS.includes(data.api_key)) {
    return jsonResponse({ status: "error", message: "Invalid API key" }, 401);
  }

  // Validate required envelope fields
  if (!data.service || !data.environment) {
    return jsonResponse({ status: "error", message: "Missing required fields" }, 400);
  }

  if (!data.events || data.events.length === 0) {
    return jsonResponse({ status: "error", message: "No events" }, 400);
  }


  for(const event of data.events){
    if(!event.timestamp || !event.payload || !event.event_type){
      return jsonResponse({ status: "error", message: "Invalid event format" }, 400);
    }
    // Validate required event payload fields based on endpoint
    const requiredFields = REQUIRED_PAYLOAD_FIELDS[path];
    for (const field of requiredFields) {
      if (event.payload[field] === undefined || event.payload[field] === null) {
        return jsonResponse({ status: "error", message: `Missing required event payload field: ${field}` }, 400);
      }
    }
    
  }



  // Process events — BE-3 wires this to D1
  const server_timestamp = new Date().toISOString();
  for (const event of data.events) {
    const record = {
      ...event,
      api_key: data.api_key,
      service: data.service,
      environment: data.environment,
      server_timestamp,
    };
    console.log(`[${path}]`, record);
    // TODO: env.DB.prepare(...).bind(...).run()
  }

  return jsonResponse({ status: "ok" }, 200);
}
