ALTER TABLE logs ADD COLUMN payload_timestamp TEXT;

UPDATE logs
SET payload_timestamp = client_timestamp
WHERE payload_timestamp IS NULL;
