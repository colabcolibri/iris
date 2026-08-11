ALTER TABLE comments ADD COLUMN ig_timestamp TEXT;

UPDATE comments
SET ig_timestamp = created_at
WHERE ig_timestamp IS NULL;
