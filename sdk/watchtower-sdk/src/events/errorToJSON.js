window.addEventListener("error", (event) => {
  handleError(event);
});

function handleError(event) {

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
      severity: "UNDEFINED", //TODO
    }
  };
}


 