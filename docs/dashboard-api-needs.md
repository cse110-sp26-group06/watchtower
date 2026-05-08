# WatchTower — Dashboard API needs

## API list
The error list page needs `GET /api/errors?project=X&since=Y` and expects an array of error summaries with these fields.

The error detail page needs `GET /api/errordetails?project=X&since=Y` and expects an array of error detail with these fields: occurence, user count, occurence time

The performance overview page needs `GET /api/performance?project=X&since=Y` and expects an array of average response time, error rate, requests/min, endpoint time and active user count. 

The alert configuration page needs `GET /api/alerts?project=X&since=Y` and expects an array of severity filter, rate thresholds, smart grouping & dedpulication, quiet hours, alert channel routing and its fields. 

The feedback configuration page needs `GET /api/feedback?project=X&since=Y` and expects an array of feedbacks with these fields. 

The project settings page needs `GET /api/feedback?project=X&since=Y` and expects an array of SDK installation connection, notification settings, Github integration settings, deployment trackings with these fields.
