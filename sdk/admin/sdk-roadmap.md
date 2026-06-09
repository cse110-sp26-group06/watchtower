sdk/
├── admin/                 # SDK planning and design documentation
│   ├── sdk-design.md      # Design notes for the SDK architecture
│   └── sdk-roadmap.md     # SDK file structure diagram
├── src/                   # Core SDK source code
│   ├── api/               # API function for SDK
│   ├── batching/          # Event batching and queue handling
│   ├── handler/           # Event parsing functions
│   ├── transport/         # Transport and delivery mechanisms
│   ├── types/             # Schemas and type checker for events
│   ├── wrapper/           # Wrapper for console functions
│   └── index.js           # Main SDK entry point
├── test/                  # SDK testing and example usage
│   ├── error-test.html    # HTML test page for manual error checks
│   ├── error-test.js      # JavaScript test harness for SDK errors
│   └── simulate_error.js  # Script to simulate SDK errors
└── init-watchtower.js     # Placeholder to initialize watchtower


Pipeline

Watchtower Init
    ↓
Detect Error / Log / Performance Event
    ↓
Parse Event
    ↓
Send to Batching Engine
    ↓
Batch Events
    ↓
Transport Function
    ↓
Send to API Endpoints

