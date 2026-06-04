CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY,
    api_key TEXT NOT NULL,
    service TEXT NOT NULL,
    environment TEXT NOT NULL,
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    payload_timestamp TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    client_timestamp TEXT NOT NULL,
    server_timestamp TEXT NOT NULL,
    FOREIGN KEY (api_key) REFERENCES projects(api_key)
);

DROP TABLE IF EXISTS logs_migration_tmp;

CREATE TABLE logs_migration_tmp (
    id TEXT PRIMARY KEY,
    api_key TEXT NOT NULL,
    service TEXT NOT NULL,
    environment TEXT NOT NULL,
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    payload_timestamp TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    client_timestamp TEXT NOT NULL,
    server_timestamp TEXT NOT NULL,
    FOREIGN KEY (api_key) REFERENCES projects(api_key)
);

INSERT INTO logs_migration_tmp (
    id,
    api_key,
    service,
    environment,
    level,
    message,
    payload_timestamp,
    payload_json,
    client_timestamp,
    server_timestamp
)
SELECT
    id,
    api_key,
    service,
    environment,
    level,
    message,
    COALESCE(json_extract(payload_json, '$.timestamp'), client_timestamp),
    payload_json,
    client_timestamp,
    server_timestamp
FROM logs;

DROP TABLE logs;
ALTER TABLE logs_migration_tmp RENAME TO logs;

CREATE INDEX IF NOT EXISTS idx_logs_api_key
ON logs (api_key);

CREATE INDEX IF NOT EXISTS idx_logs_level
ON logs (level);

CREATE INDEX IF NOT EXISTS idx_logs_server_timestamp
ON logs (server_timestamp);
