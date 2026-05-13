export interface LogPayload {
  level: string;
  message: string;
  timestamp: string;
}

export interface LogEvent {
  event_type: "log";
  timestamp: string;
  payload: LogPayload;
}

export interface LogBatch {
  api_key: string;
  service: string;
  environment: string;
  events: LogEvent[];
}
