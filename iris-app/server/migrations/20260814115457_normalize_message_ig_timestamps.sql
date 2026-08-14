-- Meta Graph API returns created_time as +0000 (no colon). SQLite datetime() cannot
-- parse that offset, so ORDER BY on ig_timestamp was effectively random for synced DMs.
UPDATE messages
SET ig_timestamp = substr(replace(ig_timestamp, '+0000', '+00:00'), 1, 19) || '.000Z'
WHERE ig_timestamp GLOB '*+0000'
  AND ig_timestamp NOT GLOB '*.000Z';
