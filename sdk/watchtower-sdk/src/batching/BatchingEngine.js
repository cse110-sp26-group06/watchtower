/**
 * BatchingEngine
 *
 * Maintains separate queues for logs, errors, and spans.
 * Flushes queues based on time or count thresholds.
 * Sends batches to the backend via a provided send function.
 *
 * @class
 * @param {Object} options
 * @param {Object} options.thresholds - Per-event-type flush thresholds.
 * @param {Function} options.sendFn - Function used to send batches to backend.
 */
class BatchingEngine {
  constructor({
    thresholds = {
      error: { maxTimeMs: 1000, maxCount: 10 },
      log:   { maxTimeMs: 3000, maxCount: 50 },
      span:  { maxTimeMs: 2000, maxCount: 25 }
    },
    sendFn
  }) {}

  enqueue(type, event) {}

  flush(type) {}

  flushAll() {}

  start() {}

  stop() {}
}
