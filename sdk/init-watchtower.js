import { initWatchtower } from './node_modules/watchtower/sdk/src/index.js';

initWatchtower({
  apiKey: " ",
  service: " ",
  environment: " ",
  errorMaxTimeMs: 500,
  errorMaxCount: 10,
  logMaxTimeMs: 500,
  logMaxCount: 10,
  performanceMaxTimeMs: 500,
  performanceMaxCount: 10
});
