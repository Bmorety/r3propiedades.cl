-- MySQL / phpMyAdmin migration for the PHP site database.
-- Do not run this in Supabase/Postgres: this app is configured with a mysql: PDO DSN.
ALTER TABLE properties
  ADD COLUMN show_price TINYINT(1) NOT NULL DEFAULT 1 AFTER visible;
