## Design SDK API Surface

### Design Methodology
- Extension SDK that can be added to a program; not required 
- Lightweight, configurable



### High Level Structure
1. Signal Capture Layer
2. Event Normalization and Enrichment
3. Local Queue + Batching
4. Transport Layer
5. Configuration and Initialization

### 1) Signal Capture Layer
- Errors/Exceptions
	- Global error catching
	- Provide functions so users can manually log errors to watchtower
- Performance Metrics
- User Signals

### 2) Event Normalization and Enrichment
- Adds metadata to the captured event information
  - Stack trace
  - User/Session ID
  - App Version

### 3) Local Queue + Batching
- Push events in a queue
- Batch them every (# seconds or # events)
- Compress

### 4) Transport Layer
- HTTPS POST
  - Send JSON packets to backend
  - NEEDS TO BE CODESIGNED WITH BACKEND
    - What does authentication look like?
    - Where do the POSTs go?
    - What does backend respond with?

### 5) Config and init
```
WatchTower.init({
  apiKey: "...",
  service: "checkout-service",
  environment: "production",
  release: "v1.4.2",
  capturePerformance: true,
  captureErrors: true,
});
```

# Required Keys
| Key | Why it matters |
| --- | --- |
| **apiKey** | Authenticates the SDK with your backend |
| **service** | Identifies the app/service (e.g., “checkout-service”) |
| **environment** | prod / staging / dev |
| **release** | Version or git SHA for error grouping |

Feature Toggle
| Key | Purpose |
| --- | --- |
| **captureErrors** | Enable automatic error capture |
| **captureUnhandledRejections** | Toggle promise rejection capture |
| **capturePerformance** | Enable performance instrumentation |
| **captureNetwork** | Enable fetch/XHR instrumentation |
| **captureConsole** | Capture console logs as breadcrumbs |

Performance and Batching
| Key | Purpose |
| --- | --- |
| **maxQueueSize** | Prevent memory blowups |
| **flushInterval** | How often to send batches |
| **maxBatchSize** | Limit batch payload size |
| **retryBackoff** | Control retry behavior |

Advanced Customization
| Key | Purpose |
| --- | --- |
| **beforeSend(event)** | Modify or drop events before sending |
| **sampleRate** | Keep only a percentage of events |
| **integrations** | Framework-specific plugins |
| **ignoreErrors** | Regex list of errors to ignore |
| **ignoreUrls** | Ignore events from certain endpoints |
| **user** | Attach user identity |


# Resources:

Microsoft - [Creating an SDK](https://learn.microsoft.com/en-us/visualstudio/extensibility/creating-a-software-development-kit?view=visualstudio)\
IBM - [API vs SDK](https://www.youtube.com/watch?v=kG-fLp9BTRo) \
JSON - [JSON Docs](https://www.json.org/json-en.html)
