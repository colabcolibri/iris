ALTER TABLE posts ADD COLUMN carousel_summary TEXT;

CREATE TABLE reply_persona_new (
  id TEXT PRIMARY KEY,
  brand_name TEXT,
  response_language TEXT NOT NULL DEFAULT 'pt-BR',
  max_chars INTEGER NOT NULL DEFAULT 500,
  updated_at TEXT NOT NULL
);

INSERT INTO reply_persona_new (id, brand_name, response_language, max_chars, updated_at)
SELECT
  id,
  brand_name,
  COALESCE(response_language, 'pt-BR'),
  max_chars,
  updated_at
FROM reply_persona;

DROP TABLE reply_persona;
ALTER TABLE reply_persona_new RENAME TO reply_persona;
