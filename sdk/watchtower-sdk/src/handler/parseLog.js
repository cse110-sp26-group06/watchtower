export function parseLog(level, args = []) {
  const message = formatConsoleMessage(args);

  const sourceLocation = getSourceLocationFromStack();

  return {
    event_type: "log",
    timestamp: new Date().toISOString(),
    payload: {
      level,
      message,
      ...(sourceLocation.file !== undefined ? { file: sourceLocation.file } : {}),
      ...(sourceLocation.lineno !== undefined ? { lineno: sourceLocation.lineno } : {}),
      ...(sourceLocation.colno !== undefined ? { colno: sourceLocation.colno } : {})
    }
  };
}

function formatConsoleMessage(args) {
  if (!args || args.length === 0) {
    return "";
  }

  return args
    .map((arg) => {
      if (typeof arg === "string") {
        return arg;
      }

      if (arg instanceof Error) {
        return arg.stack ?? arg.message;
      }

      if (typeof arg === "undefined") {
        return "undefined";
      }

      if (typeof arg === "object") {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }

      return String(arg);
    })
    .join(" ");
}

function getSourceLocationFromStack() {
  const stack = new Error().stack ?? "";
  const lines = stack.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    const match = trimmed.match(/\(?(.+?):(\d+)(?::(\d+))?\)?$/);
    if (!match) {
      continue;
    }

    const [, file, lineno, colno] = match;

    if (!file) {
      continue;
    }

    const isWatchtowerInternal =
      file.includes("watchtower-sdk/src") ||
      file.includes("watchtower-sdk\\src");

    if (isWatchtowerInternal) {
      continue;
    }

    return {
      file,
      lineno: Number(lineno),
      colno: colno ? Number(colno) : undefined
    };
  }

  return {
    file: undefined,
    lineno: undefined,
    colno: undefined
  };
}