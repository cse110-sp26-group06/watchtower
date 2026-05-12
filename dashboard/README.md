# Watchtower: Dashboard
This folder contains the HTML, CSS, and JavaScript files for the Watchtower dashboard, as well as centralized module for talking to the backend's read endpoints.

## Folder Structure
```
/dashboard
│
├── index.html          # Main dashboard page (error list)
├── error-detail.html   # Page for displaying detailed error information
├── performance.html    # Page for viewing performance metrics
├── feedback.html       # Page for submitting and viewing feedback
├── alerts.html         # Page for managing alerts
├── settings.html       # Page for configuring dashboard settings
│
├── /assets
│   ├── /icons
│   ├── /images
│   └── /fonts
│
├── /styles # css files
|
├── /scripts
|   └── /api
│   |   ├── api.js          # Core API utilities (fetch wrappers, base URL, etc.)
│   |   ├── errors.js       # Functions for error-related endpoints
│   |   ├── performance.js  # Functions for performance endpoints
│   |   └── alerts.js       # Functions for alert endpoints
│   └── /components         # Reusable UI components like the nav bar, error cards, etc.
│   └── /pages              # JS specific to each page(event listeners, page init, etc.)
|   └── /utils              # Utility functions (formatting, date handling, etc.)
│
└── README.md # go over folder structure, description
```