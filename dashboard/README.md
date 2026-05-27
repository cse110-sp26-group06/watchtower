# Watchtower: Dashboard
This folder contains the HTML, CSS, and JavaScript files for the Watchtower dashboard, as well as centralized module for talking to the backend's read endpoints.

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
