<?php

return [
    'environment' => 'production',
    'database' => [
        'host' => 'localhost',
        'port' => 3306,
        'database' => 'replace_me_candydash',
        'username' => 'replace_me_candydash_user',
        'password' => 'replace_me_password',
        'charset' => 'utf8mb4',
        // Table name only — no CREATE DATABASE here. Point this at a
        // dedicated database, or reuse an existing one (e.g. WordPress's)
        // since candydash_leaderboard won't collide with anything it owns.
        'table' => 'candydash_leaderboard',
    ],
    // Optional. Fill this in to also mirror newsletter opt-ins into a
    // second database — e.g. the Troll & Unicorn WordPress database — so
    // the website side has its own copy without cross-database access.
    // Leave every value blank/empty to skip this entirely; opt-ins still
    // get recorded in the primary table's email/newsletter_optin columns
    // either way. Find the WordPress DB's host/name/user/password in that
    // site's wp-config.php (cPanel File Manager) — reuse them here, do not
    // create a new WP DB user unless you want one scoped just to this.
    'newsletterDatabase' => [
        'host' => '',
        'port' => 3306,
        'database' => '',
        'username' => '',
        'password' => '',
        'charset' => 'utf8mb4',
        'table' => 'candydash_newsletter_optins',
    ],
    // Tighten to the game's real hosting origin(s) before going live, e.g.
    // 'https://trollandunicorn.com'. Comma-separated for more than one.
    'cors' => [
        'allowedOrigins' => '*',
    ],
];
