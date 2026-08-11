-- Posts monitorados (externos) devem seguir o modo global por padrão, não ficar com IA off.
UPDATE posts
SET reply_mode = 'inherit'
WHERE status = 'monitored'
  AND reply_mode = 'off'
  AND auto_reply_enabled = 0;
