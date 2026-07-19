# Candy Dash Backend

Bluehost-friendly leaderboard backend for Candy Dash, built the same
framework-free way as the budgeting app's backend (see
`Budgeting_App/02_Android_Src/backend/`) — a single PHP front controller,
no dependencies, hosted under the shared studio API subdomain instead of a
bespoke per-game API folder.

## Production shape

- Game itself stays where it is:
  `https://trollandunicorn.com/Games/candydash/`
- Leaderboard API:
  `https://api.spinningmonkeystudios.com/games/candydash/`

## Why the API subdomain instead of living beside the game

Same reasoning as the budgeting app: keeps the backend separate from the
Troll & Unicorn WordPress/marketing concerns, reuses one subdomain/cert for
every studio product's API instead of each game growing its own, and
matches the existing platform pattern rather than inventing a new one.

## Folder layout

```text
backend/
  README.md
  api/
    public/
      .htaccess
      index.php
  config/
    candydash-api.config.template.php   (checked in — production shape)
    candydash-api.config.template.json  (checked in — local dev shape)
    candydash-api.config.php            (gitignored — real prod credentials)
    candydash-api.config.json           (gitignored — real local credentials)
  sql/
    candydash_schema.sql
    candydash_newsletter_optins_schema.sql   (optional second table, second DB)
```

## Configuration

Copy whichever template matches your environment and fill in real values —
never commit the result:

- Local dev: `backend/config/candydash-api.config.json` (WAMP defaults:
  `root` / no password / database `candydash` already filled in).
- Production: a filled-in copy of `candydash-api.config.template.php`,
  uploaded via FTP directly into the **same remote folder as `index.php`**
  (`api.spinningmonkeystudios.com/games/candydash/candydash-api.config.php`)
  — never in git. The publish script only ships `api/public/`'s contents,
  flattened straight into that folder, so `backend/config/`'s sibling
  relationship to `backend/api/` doesn't exist on the live server; "beside
  index.php" means literally that folder. (`index.php` also checks a couple
  of other locations as harmless fallbacks, but this is the one that
  actually matches how it's deployed today.)

`database.table` in the config controls which table the API reads/writes —
defaults to `candydash_leaderboard`. Point `database` at a dedicated
database, or reuse an existing one (e.g. the WordPress database) since the
table name won't collide with anything WordPress or a plugin owns.

## Database setup

Run `sql/candydash_schema.sql` against whichever database the config points
at (phpMyAdmin's SQL tab, or `mysql -u <user> -p <db> < candydash_schema.sql`).
It only creates the one table — no `CREATE DATABASE`, since which database
to use is an environment decision, not something the schema should assume.

## Local development

```text
php -S 127.0.0.1:8090 -t backend/api/public backend/api/public/index.php
```

The trailing `index.php` is a router argument, not a typo — PHP's built-in
server doesn't read `.htaccess`, so without an explicit router it 404s any
path that isn't a real file on disk. Passing `index.php` as the router makes
every request go through it, matching what `.htaccess`'s rewrite rule does
under real Apache (WAMP/Bluehost) automatically.

Then hit `http://127.0.0.1:8090/games/candydash/health` etc. — the front
controller strips the `/games/candydash` prefix itself, so it works whether
you're running it standalone like this or mounted at that path on WAMP/Bluehost.

## Deployment

```text
tools/publish-candydash-backend.ps1
```

Credentials + targets live one level up, at the Troll & Unicorn project
root: `Troll_and_Unicorn/tools/bluehost-publish.config.json` (gitignore-equivalent
— that folder isn't a git repo at all, so nothing about it is ever tracked).
It covers every T&U sub-project's FTP upload target, not just this one — see
the `targets` map. `Troll_and_Unicorn/tools/bluehost-publish.config.template.json`
documents the shape. Same underlying Bluehost account as the budgeting app
and the studio WordPress site, so the credentials only exist in one place.

## Routes

- `GET /` — service info.
- `GET /health` — DB connectivity + whether the leaderboard table exists,
  for both `database` and `newsletterDatabase` (if configured).
- `GET /v1/candydash/version`
- `POST /v1/candydash/leaderboard/submit` — body: `{name, score,
  critters_redeemed, critters_lost, time_seconds, email, newsletter_optin}`.
  Returns `{id}`.
- `GET /v1/candydash/leaderboard/top?limit=10` — array of `{id, name, score,
  critters_redeemed, critters_lost, time_seconds}`, sorted by score then
  fastest time. Never returns `email`.

All paths above are relative to the mount point (`/games/candydash` in
production) — `index.php` strips that prefix before routing.

## Newsletter opt-in — scope note

`submit` always records `email` + `newsletter_optin` in the primary
leaderboard table when a player opts in. If `newsletterDatabase` is also
filled in (config), it additionally (best-effort — never blocks or fails
the submit if this second write fails) upserts into
`candydash_newsletter_optins` there, keyed on email — a repeat opt-in
updates the stored name rather than duplicating the row. Typical setup:
point `newsletterDatabase` at the Troll & Unicorn WordPress database, using
the same host/user/password already in that site's `wp-config.php`, so the
website side has its own copy without needing cross-database access.

Either way, that's it — nothing here sends anything or syncs the address
anywhere else. Wiring the actual send/sync (WordPress subscriber list,
Mailchimp, or whatever the newsletter automation ends up being) is
separate, explicitly out-of-scope work for later. When that's built, it can
read `SELECT email, name FROM candydash_newsletter_optins` (or
`candydash_leaderboard WHERE newsletter_optin = 1` if the second database
was never configured).

## Superseded

This replaces the old standalone `api/` folder (flat PHP files, its own
`http://localhost/candy-dash-api` local convention) that was manually
uploaded to `trollandunicorn.com/Games/candydash/api/` before this backend/
restructure. That folder and its Bluehost upload can be deleted once this
one is confirmed live — see `NEXT_CONTEXT_HANDOFF.md` for the migration note.

## Not done here (known gaps)

- No rate limiting / spam protection on the submit route. Fine for a
  low-traffic launch; revisit if the leaderboard gets abused.
- No admin view of opted-in emails yet — query the table directly for now.
