-- Optional second table for candy-dash's newsletter opt-ins, meant to live
-- in a DIFFERENT database than candydash_schema.sql's leaderboard table —
-- typically the Troll & Unicorn WordPress database, so the website side has
-- its own copy to read without needing cross-database access.
--
-- Deliberately not wp_-prefixed and doesn't touch any WordPress-owned table
-- (wp_users, a plugin's subscriber table, etc.) — just a plain holding
-- table. Only needed if backend/config/candydash-api.config.php's
-- newsletterDatabase block is filled in; if left blank, opt-ins still get
-- recorded in the primary leaderboard table's email/newsletter_optin
-- columns and this second table is simply skipped.
--
-- Run against whichever database newsletterDatabase points at (e.g. select
-- the WordPress database in phpMyAdmin first, then run this in its SQL tab).

CREATE TABLE IF NOT EXISTS candydash_newsletter_optins (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(20) NULL,
  source VARCHAR(40) NOT NULL DEFAULT 'candy-dash',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_email (email)
) ENGINE=InnoDB;
