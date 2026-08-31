-- Page access token for Instagram DM thread recovery (encrypted vault)
ALTER TABLE meta_connection ADD COLUMN page_access_token_vault TEXT;
