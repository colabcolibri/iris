-- Debounce em minutos: mínimo 1 min (60s), máximo 60 min (3600s).
UPDATE app_settings
SET reply_delay_seconds = CASE
      WHEN reply_delay_seconds IS NULL OR reply_delay_seconds < 60 THEN 60
      WHEN reply_delay_seconds > 3600 THEN 3600
      ELSE reply_delay_seconds
    END,
    message_reply_delay_seconds = CASE
      WHEN message_reply_delay_seconds IS NULL OR message_reply_delay_seconds < 60 THEN 60
      WHEN message_reply_delay_seconds > 3600 THEN 3600
      ELSE message_reply_delay_seconds
    END
WHERE id = 'primary';
