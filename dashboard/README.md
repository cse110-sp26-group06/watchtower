# Watchtower: Dashboard
This folder contains the HTML, CSS, and JavaScript files for the Watchtower dashboard, as well as centralized module for talking to the backend's read endpoints.

## Local Setup
The error list page calls the deployed backend and needs a WatchTower API key. On a fresh clone, create a local config file:

```sh
cp dashboard/scripts/utils/env.example.js dashboard/scripts/utils/env.js
```

Then edit `dashboard/scripts/utils/env.js` and set `WATCHTOWER_API_KEY` to a valid project key. This file is intentionally gitignored so real keys are not committed.

Alternatively, use the onboarding page to generate a project. The dashboard can read the saved project API key from `localStorage`.

If the page shows "Failed to load errors" on another machine, first check that they are logged in locally and have either `dashboard/scripts/utils/env.js` configured or a saved onboarding project.

## Folder Structure
```
/dashboard
│
├── index.html              # Login landing page
├── projects.html           # Project switcher / dashboard home
├── onboarding.html         # First-project onboarding flow
├── error-list.html         # Error list page
├── error-detail.html       # Single error detail page
├── performance.html        # Performance view placeholder
├── feedback.html           # Feedback view placeholder
├── alerts.html             # Alert settings placeholder
├── settings.html           # Project settings placeholder
│
├── /assets
│   ├── /icons
│   ├── /images
│   └── /fonts
│
├── /styles
│   ├── globals.css         # Shared design tokens / base styles
│   ├── components.css      # Shared component styles
│   ├── layout.css          # Shared app shell / navbar layout
│   └── /pages              # Page-specific CSS
│
├── /scripts
│   ├── /api
│   │   ├── api.js          # Shared fetch wrapper for dashboard API calls
│   │   └── errors.js       # Error endpoint helpers
│   ├── /components
│   │   ├── errorCard.js    # Reusable error list/detail card helpers
│   │   └── navbar.js       # Shared authenticated sidebar nav
│   ├── /pages
│   │   ├── /errorDetail
│   │   │   ├── errorDetail.js
│   │   │   └── stackTrace.js
│   │   ├── /errorList
│   │   │   ├── errorFilter.js
│   │   │   └── errorList.js
│   │   ├── /login
│   │   │   ├── login.js
│   │   │   └── staticPage.js
│   │   ├── /onboarding
│   │   │   └── onboarding.js
│   │   └── /projects
│   │       └── projects.js
│   └── /utils              # Auth, DOM, project, toast, API constants helpers
│
├── /tests                  # Node-based frontend unit tests
│
└── README.md               # Dashboard-specific structure and notes
```
