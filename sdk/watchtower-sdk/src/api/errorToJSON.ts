import { ErrorEvent, ErrorStackFrame } from "../types";

window.addEventListener("error", (event) => {
  handleError(event);
});

function handleError(event): ErrorEvent {

  return {
    event_type: "error",
    timestamp: new Date().toISOString(),
    payload: {
      message: event.message,
      type: event.error.name,
      stack_trace: event.error.stack, 
      file: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      severity: "string", //TODO
    }
  };
}


 