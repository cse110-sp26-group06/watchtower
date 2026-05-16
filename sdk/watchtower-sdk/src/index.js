import BatchingEngine from "./batching/BatchingEngine";
import {send} from  "./transport/send.js"

/**
 * Initializes the WatchTower SDK and starts the global batching engine.
 *
 * This function must be called once at application startup. It configures
 * authentication, environment metadata, batching thresholds, and starts the
 * background flush timers responsible for sending events to the backend.
 *
 * @function initWatchtower
 *
 * @param {Object} [config={}] - Optional configuration object.
 *
 * @param {string} config.apiKey
 *        The API key used to authenticate with the WatchTower backend.
 *
 * @param {string} [config.service="unknown-service"]
 *        Logical service name (e.g., "checkout-service", "frontend-app").
 *        Used to group events in the backend.
 *
 * @param {string} [config.environment="production"]
 *        Deployment environment (e.g., "production", "staging", "development").
 *
 * @param {number} [config.errorMaxTimeMs=1000]
 *        Maximum time (in ms) before flushing error events, even if the batch
 *        has not reached the max count.
 *
 * @param {number} [config.errorMaxCount=10]
 *        Maximum number of error events allowed in a batch before forcing a flush.
 *
 * @param {number} [config.logMaxTimeMs=3000]
 *        Maximum time (in ms) before flushing log events.
 *
 * @param {number} [config.logMaxCount=50]
 *        Maximum number of log events allowed in a batch.
 *
 * @param {number} [config.spanMaxTimeMs=2000]
 *        Maximum time (in ms) before flushing span (performance) events.
 *
 * @param {number} [config.spanMaxCount=25]
 *        Maximum number of span events allowed in a batch.
 *
 * @throws {Error}
 *         Throws if called more than once or if required fields (like apiKey)
 *         are missing.
 *
 * @example
 * // Basic usage
 * initWatchtower({
 *   apiKey: "abc123",
 *   service: "frontend",
 *   environment: "production"
 * });
 *
 * @example
 * // Custom batching thresholds
 * initWatchtower({
 *   apiKey: "abc123",
 *   errorMaxCount: 5,
 *   logMaxTimeMs: 1000
 * });
 */
export function initWatchtower(config = {}) {
  const thresholds = {
    error: {
      maxTimeMs: config.errorMaxTimeMs ?? 1000,
      maxCount:  config.errorMaxCount  ?? 10
    },
    log: {
      maxTimeMs: config.logMaxTimeMs ?? 3000,
      maxCount:  config.logMaxCount  ?? 50
    },
    span: {
      maxTimeMs: config.spanMaxTimeMs ?? 2000,
      maxCount:  config.spanMaxCount  ?? 25
    }
  };

  engine = new BatchingEngine({
    thresholds,
    sendFn: sendFn,
    api_key: config.apiKey,
    service: config.service,
    environment: config.environment
  });

  engine.start();
}


