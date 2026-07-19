-- Candy Dash leaderboard schema. One table, prefixed candydash_ so it can
-- share a database with other studio products without name collisions
-- (matches the budgeting app's budgeting_* convention).
--
-- Run once against whichever database backend/config/candydash-api.config.php
-- points at: `mysql -u <user> -p <db> < candydash_schema.sql`, or paste into
-- phpMyAdmin's SQL tab with that database selected.

CREATE TABLE IF NOT EXISTS candydash_leaderboard (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(20) NOT NULL,
  score INT UNSIGNED NOT NULL,
  critters_redeemed INT UNSIGNED NOT NULL DEFAULT 0,
  critters_lost INT UNSIGNED NOT NULL DEFAULT 0,
  time_seconds INT UNSIGNED NULL,
  -- Newsletter opt-in capture only — no automated sending happens here.
  -- The future newsletter automation can read WHERE newsletter_optin = 1.
  email VARCHAR(255) NULL,
  newsletter_optin TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_score (score DESC),
  INDEX idx_time (time_seconds)
) ENGINE=InnoDB;
