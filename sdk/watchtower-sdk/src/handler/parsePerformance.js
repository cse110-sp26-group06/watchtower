/**
 * Converts a captured performance datum into a WatchTower performance event.
 *
 * The returned event matches the schema defined in
 * sdk/watchtower-sdk/src/types/performance_schema.json.
 *
 * @returns {{ event_type: "performance", timestamp: string, payload { TODO } } }} A normalized performance event.
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

    if(entry.entryType === 'paint'){
        // Timestamp at end of rendering phase, beginning of paint phase
        base.payload.paintTime = entry.paintTime;
        // Timestamp when painted pixels are presented on screen
        base.payload.presentationTime = entry.presentationTime;
    }

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

    /** Originally though I needed these to parse each type of event, not sure if they are still needed 
     * observer.observe({ type: 'resource', buffered: true })
     * observer.observe({ type: 'paint', buffered: true })
     * observer.observe({ type: 'navigation', buffered: true })
     * 
     */

    
    return base;
    
 }
 
