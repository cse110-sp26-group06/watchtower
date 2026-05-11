// these are temporary arrays for saving data for each endpoint
const stored = {
  errors: [],
  logs: [],
  performance: []
};

export default {
  async fetch(request, env) {

    // get the endpoint route(error,performance,log) from the url next to "post"
    const url = new URL(request.url);
    const endpoint = url.pathname;

    // if the request method does not equal post, return error
    if (request.method !== "POST") {
        return Response.json({ status: "error", message: "Post is only allowed for method" }, { status: 405 });
    }
    // If the checkpoint is not valid, then returns error
    if (!["/ingest/error", "/ingest/log", "/ingest/performance"].includes(endpoint)) {
      return Response.json({ status: "error", message: "Not found" }, { status: 404 });
    }

    // variable data will contain the information in post written in json format

    // For example, when the post sent it in form "api_key": "client1", we can access it by data.api_key

    // We try to get the information using try function below, and returns error if it is not json format
    let data;
    try {
      data = await request.json();
    } catch {
      return Response.json({ status: "error", message: "Invalid JSON" }, { status: 400 });
    }

    // These are temporary API keys, will change it authentication key generator for security
    const API_KEYS = ["client1", "client2", "client3"];

    // when the api_key is not passed to us, or it is not one of the client1 - client3, we return error
    if (!data.api_key || !API_KEYS.includes(data.api_key)) {
      return Response.json({ status: "error", message: "Invalid API key" }, { status: 401 });
    }

    // Validate events
    if (!data.events || data.events.length === 0) {
      return Response.json({ status: "error", message: "No events" }, { status: 400 });
    }


    const server_timestamp = new Date().toISOString();

    for (const event of data.events) {
        // copies everything from the event object, using ... event
      const record = { ...event, api_key: data.api_key, service: data.service, environment: data.environment, server_timestamp };

      // According to the endpoint the post designated,  we assign the data in the right array
      
      //Later we will replace these arrays (error, performance,log) with D1 server
      if (endpoint === "/ingest/error") stored.errors.push(record);
      else if (endpoint === "/ingest/log") stored.logs.push(record);
      else if (endpoint === "/ingest/performance") stored.performance.push(record);
      //Following prints the data that is sent, and its endpoint
        console.log(`[${endpoint}]`, record);
    }
    

    // as we have reached till the end without any error, we return 200 ok
    return Response.json({ status: "ok" }, { status: 200 });
  },
};