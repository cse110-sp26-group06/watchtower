/**
 * Converts a captured PerformanceEntry into a normalized WatchTower event.
 * Payload fields vary by entryType: "resource", "paint", or "navigation".
 *
 * @param {PerformanceEntry} entry - The raw entry from PerformanceObserver.
 * @returns {{ event_type: "performance", timestamp: string, payload: object }}
 */

 export function parsePerformance(entry){
    const base = {
        event_type: "performance",
        timestamp: new Date().toISOString(), 
        payload: {
            name: entry.name,
            entryType: entry.entryType,
            time: entry.startTime,
            duration: entry.duration
        }
    }

    if(entry.entryType === 'resource'){
        /**
         *   Measure server connection timestamps
         *   [ TCP connection time = connectEnd - connectStart ]
         */ 
        base.payload.secureConnectionStart = entry.secureConnectionStart;
        base.payload.connectStart = entry.connectStart;
        base.payload.connectEnd = entry.connectEnd;

        /**
         *   Measure domain lookup timestamps
         *   [ domain lookup time = domainLookupEnd - domainLookupStart ]
         */ 
        base.payload.domainLookupStart = entry.domainLookupStart;
        base.payload.domainLookupEnd = entry.domainLookupEnd;

        /**
         *   Measure redirection timestamps
         *   [ redirect = redirectEnd - redirectStart ]
         */ 
        base.payload.redirectStart = entry.redirectStart;
        base.payload.redirectEnd = entry.redirectEnd;

        /**
         *   [ ServiceWorker processing time = fetchStart - workerStart ]
         *   [ request time = responseStart - requestStart ] 
         *   [ fetch time = responseEnd - fetchStart ]
         */ 
        base.payload.workerStart = entry.workerStart;
        base.payload.fetchStart = entry.fetchStart;
        base.payload.requestStart = entry.requestStart;
        base.payload.responseStart = entry.responseStart;
        base.payload.responseEnd = entry.responseEnd;

        /**
         *   [ interim request time = finalResponseHeadersStart - firstInterimResponseStart ]
         */ 
        base.payload.firstInterimResponseStart = entry.firstInterimResponseStart;
        base.payload.finalResponseHeadersStart = entry.finalResponseHeadersStart;

        // Type of fetched resource
        base.payload.contentType = entry.contentType;
        // Delivery method (e.g. cache, fetch)
        base.payload.deliveryType = entry.deliveryType;
        // Feature that initiated the entry
        base.payload.initiatorType = entry.initiatorType;
        // Network protocol used to fetch
        base.payload.nextHopProtocol = entry.nextHopProtocol; 
        // Render-blocking status
        base.payload.renderBlockingStatus = entry.renderBlockingStatus;
        // HTTP status when fetching resource
        base.payload.responseStatus = entry.responseStatus;
        // Size of fetched resource
        base.payload.transferSize = entry.transferSize;
      }



    /**
     * Paint entries measure time to first paint and time to first contentful paint.
     * [ Time to First Paint = startTime of "first-paint" entry ]
     * [ Time to First Contentful Paint = startTime of "first-contentful-paint" entry ]
     * These two are already captured in the base payload, so not necessary to add additional fields.
     */



    if(entry.entryType === 'navigation'){
        // Always returns "navigation" 
        base.payload.initiatorType = entry.initiatorType;
        // Delta between prerendering and activation
        base.payload.activationStart = entry.activationStart;
        // Likeliness of performance record reflecting typical performance 
        base.payload.confidence = entry.confidence;
        // Timestamp of connection restart due to critical HTTP header mismatch
        base.payload.criticalCHRestart = entry.criticalCHRestart;
        // Timestamp right before document loading status is set to 'complete'
        base.payload.domComplete = entry.domComplete;
        
        /**
         * [ dom content load time = domContentLoadedEventEnd - domContentLoadedEventStart ]
         * [ load event time = loadEventEnd - loadEventStart ]
         */
        base.payload.domContentLoadedEventStart = entry.domContentLoadedEventStart;
        base.payload.domContentLoadedEventEnd = entry.domContentLoadedEventEnd;
        base.payload.loadEventStart = entry.loadEventStart;
        base.payload.loadEventEnd = entry.loadEventEnd;

        // Timestamp right before doument status set to 'interactive'
        base.payload.domInteractive = entry.domInteractive;
        // Details why document was prevented from using back/forward cache
        base.payload.notRestoredReasons = entry.notRestoredReasons;
        // Number of redirects since last non-redirect navigation
        base.payload.redirectCount = entry.redirectCount;
        // One of 'navigate' , 'reload' , 'back_forward' 
        base.payload.type = entry.type;
        
        /**
         * Timestamps for unload event handler
         * [ unload event time = unloadEventStart - unloadEventEnd ]
         */
        base.payload.unloadEventEnd = entry.unloadEventEnd;
        base.payload.unloadEventStart = entry.unloadEventStart;
    }

    return base;
}
