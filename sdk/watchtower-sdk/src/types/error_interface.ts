export interface ErrorPayload {
  message: string;
  type: string;
  stack_trace: string;
  file: string;
  lineno: number;
  colno: number;
  severity: string;
}

export interface ErrorEvent {
  event_type: "error";
  timestamp: string;
  payload: ErrorPayload;
}

export interface ErrorBatch {
  api_key: string;
  service: string;
  environment: string;
  events: ErrorEvent[];
}
