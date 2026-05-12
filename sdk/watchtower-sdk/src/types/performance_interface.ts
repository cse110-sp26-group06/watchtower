export interface SpanPayload {
  span_id?: string;
  trace_id?: string;
  name: string;
  start_timestamp: string;
  end_timestamp: string;
  duration_ms: number;
}

export interface SpanEvent {
  event_type: "span";
  timestamp: string;
  payload: SpanPayload;
}

export interface SpanBatch {
  api_key: string;
  service: string;
  environment: string;
  events: SpanEvent[];
}
