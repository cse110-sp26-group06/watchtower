# WatchTower — Dashboard API needs
This document outlines the required read endpoints for the WatchTower dashboard frontend.
## Base Assumptions

All endpoints:

* return JSON
* are read-only (`GET`)
* support filtering by time range where applicable

## API list
# 1. Error List Page - used by the main dashboard error list view
The error list page needs `GET /api/errors` and expects an array of error summaries with these fields.

## Endpoint

```http
GET /api/errors
```

## Query Parameters

| Parameter | Type   | Description                                              |
| --------- | ------ | -------------------------------------------------------- |
| projectId | string | Current project identifier                               |
| since     | string | Time range filter (`24h`, `7d`, etc.)                    |
| severity  | string | Filter by severity (`critical`, `high`, `medium`, `low`) |
| status    | string | Filter by status (`resolved`, `unresolved`)              |
| page      | number | Pagination page number                                   |
| limit     | number | Results per page                                         |

## Example Request

```http
GET /api/errors?projectId=abc123&since=24h&severity=critical&status=unresolved
```
---
# 2. Error Detail Page - used when a user clicks into a specific error.
The error detail page needs `GET /api/errors` and expects an array of error detail with these fields: occurence, user count, occurence time

## Endpoint

```http
GET /api/errors/:errorId
```

## Example Request

```http
GET /api/errors/err_1
```
---
# 3. Performance Overview Page - used by the performance analytics dashboard

The performance overview page needs `GET /api/performance?projectId=X&since=Y` and expects an array of average response time, error rate, requests/min, endpoint time and active user count. 
## Endpoint

```http
GET /api/performance
```

## Query Parameters

| Parameter | Type   | Description                |
| --------- | ------ | -------------------------- |
| projectId | string | Current project identifier |
| since     | string | Time range filter          |

## Example Request

```http
GET /api/performance?projectId=abc123&since=24h
```
---
# 4. Alert Settings Page - used for configuring alert behavior and notification routing

The alert configuration page needs `GET /api/alert-settings` and expects an array of severity filter, rate thresholds, smart grouping & deduplication, quiet hours, alert channel routing and its fields. 
## Endpoint

```http
GET /api/alert-settings
```

## Query Parameters

| Parameter | Type   | Description                |
| --------- | ------ | -------------------------- |
| projectId | string | Current project identifier |
---
# 5. Feedback Inbox Page - used to display user feedback

The feedback configuration page needs `GET /api/feedback` and expects an array of feedbacks with these fields. 

## Endpoint

```http
GET /api/feedback
```

## Query Parameters

| Parameter | Type   | Description                |
| --------- | ------ | -------------------------- |
| projectId | string | Current project identifier |
| since     | string | Time range filter          |
| rating    | number | Optional rating filter     |
| page      | number | Pagination page number     |
| limit     | number | Results per page           |
---
# 6. Project Settings Page - used to display project integrations and SDK configuration state
The project settings page needs `GET /api/project-settings` and expects an array of SDK installation connection, notification settings, Github integration settings, deployment trackings with these fields.
## Endpoint

```http
GET /api/project-settings
```

## Query Parameters

| Parameter | Type   | Description                |
| --------- | ------ | -------------------------- |
| projectId | string | Current project identifier |
