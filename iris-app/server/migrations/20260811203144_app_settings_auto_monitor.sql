ALTER TABLE app_settings ADD COLUMN auto_monitor_enabled INTEGER NOT NULL DEFAULT 1;
ALTER TABLE app_settings ADD COLUMN auto_monitor_interval_seconds INTEGER NOT NULL DEFAULT 300;
