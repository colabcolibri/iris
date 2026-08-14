-- Debounce deslizante: mínimo 30s, máximo 180s (sem resposta imediata).
UPDATE app_settings
SET reply_delay_seconds = CASE
      WHEN reply_delay_seconds IS NULL OR reply_delay_seconds < 30 THEN 30
      WHEN reply_delay_seconds > 180 THEN 180
      ELSE reply_delay_seconds
    END,
    message_reply_delay_seconds = CASE
      WHEN message_reply_delay_seconds IS NULL OR message_reply_delay_seconds < 30 THEN 30
      WHEN message_reply_delay_seconds > 180 THEN 180
      ELSE message_reply_delay_seconds
    END
WHERE id = 'primary';
