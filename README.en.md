<div align="center">

[![Slovencina](https://img.shields.io/badge/SK-Sloven%C4%8Dina-30363d?style=for-the-badge)](README.md) [![English](https://img.shields.io/badge/EN-English-2ea043?style=for-the-badge)](README.en.md)

</div>

<div align="center">

# 🚧 Maintenance Website

**An elegant single-page maintenance / status page in plain PHP - deploy it in a minute and manage it with a single JSON file.**

![PHP](https://img.shields.io/badge/PHP-7.0%2B-777BB4?style=flat-square&logo=php&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-vanilla-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![JSON](https://img.shields.io/badge/Config-JSON-000000?style=flat-square&logo=json&logoColor=white)
![License](https://img.shields.io/badge/License-GPL--3.0-blue?style=flat-square)

</div>

---

## 📑 Contents

- [🔍 Overview](#-overview)
- [✨ Features](#-features)
- [🚀 Quick start](#-quick-start)
- [📂 Project structure](#-project-structure)
- [⚙️ Configuration](#️-configuration)
- [🌐 HTTP headers](#-http-headers)
- [🎨 Design and technology](#-design-and-technology)
- [⚠️ Known limitations](#️-known-limitations)
- [📄 License](#-license)

---

## 🔍 Overview

Maintenance Website is a single PHP file that renders a dark "glassmorphism" page during an outage or a scheduled maintenance window. It shows a headline, a status pill, an optional countdown, a progress bar, a list of affected services with colour-coded badges, a timeline of next steps, and a footer with contacts and automatic page refresh.

The key difference from an ordinary HTML page is that it responds with **HTTP 503 Service Unavailable** and a `Retry-After` header, so search engines and monitoring tools treat it as a genuine outage rather than as a new page on your site.

No framework, no database, no build step and no admin interface - the entire content is changed by editing `services.json`, which is read on every request.

---

## ✨ Features

- 🛑 **Correct 503 status** - responds with `503` + `Retry-After: 3600` + `Cache-Control: no-cache, no-store, must-revalidate` and `<meta name="robots" content="noindex, nofollow">`.
- 🗂️ **JSON-based configuration** - all content comes from `services.json`, which is merged over the PHP defaults via `array_merge`; a missing or corrupted file will not take the page down.
- 🚦 **Service statuses** - four badge variants: `outage` (red), `degraded` (amber), `operational` (green) and a grey `unknown` fallback for any unrecognised string.
- 📊 **Optional progress bar** - `progress_percent` is clamped to the 0-100 range; a value of `0` hides the bar and renders a simplified status card.
- ⏱️ **Countdown to recovery** - a JS countdown (hours / minutes / seconds) driven by `countdown_target`; if the value is empty the block is not rendered at all.
- 🔄 **Automatic refresh** - the footer counts down the seconds until `location.reload()`, with a server-side minimum of 60 seconds (`max(60, ...)`).
- 🧭 **"What Happens Next" timeline** - steps from `next_steps`, each with an action description and an ETA pill.
- ✉️ **Contact block** - a `mailto:` link and an external link to a status page; if they are not filled in, the footer omits them.
- 🛡️ **Output escaping** - all dynamic content goes through `esc()` with `htmlspecialchars(ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')`.
- 🕒 **Real last-modified time** - "Last updated" is taken from `filemtime()` of `services.json`, with the time zone hard-coded to UTC.
- 💎 **Premium design** - CSS custom properties, three animated blurred orbs, a grid overlay, gradient text, a shimmer on the progress bar and a rotating conic-gradient ring around the icon.
- 📱 **Responsive layout** - the 640px breakpoint stacks the service rows, the timeline and the footer vertically; the 380px breakpoint only shrinks the headline and the countdown blocks.

---

## 🚀 Quick start

The project has no package manager, no dependencies and no build step. All you need is a PHP interpreter (no database, no extensions beyond the core).

### Local preview

```bash
cd files
php -S 127.0.0.1:8000
```

Open `http://127.0.0.1:8000/`.

Verifying the headers:

```bash
curl -i http://127.0.0.1:8000/
```

> [!NOTE]
> The built-in PHP server returns `HTTP/1.1 503 Service Unavailable` - that is intentional, not a bug. The browser will still render the page body normally.

### Deploying to a server

1. Copy `index.php`, `services.json` and `styles.css` into a document root capable of running PHP (Apache + PHP-FPM, nginx + PHP-FPM, LiteSpeed, ordinary shared hosting).
2. Add your own rewrite / redirect rule that routes all traffic to this `index.php` during the maintenance window.
3. Edit `services.json` and reload the page - no restart and no cache purge required.

> [!IMPORTANT]
> The repository does not contain an `.htaccess`, an nginx snippet or a deploy script. Merely copying the files will not switch your site into maintenance mode - you have to write the traffic redirection yourself.

---

## 📂 Project structure

```text
maintenance-website/
├── index.php               # PHP version (274 lines): defaults, JSON loading,
│                           # esc()/badgeModifier(), 503 headers, HTML template, inline JS
├── index.html              # static version: same page, JSON is loaded in the browser
├── services.json           # the single config file, read by both versions
├── styles.css              # 720 lines of theme: tokens, background, cards, badges, 6x @keyframes
├── LICENSE                 # full text of the GNU GPL-3.0
├── README.md               # the Slovak version
└── README.en.md            # this file
```

> [!TIP]
> There are **two entry points rendering the same page**. `index.php` renders on the
> server and sends `503` + `Retry-After` headers - that is the version for a real outage.
> `index.html` is the static version: it loads `services.json` in the browser via `fetch`,
> so it also works on hosting without PHP (GitHub Pages). The static version **cannot**
> send a `503` status code. `styles.css` is linked relatively, so it must sit next to them.

---

## ⚙️ Configuration

Everything is configured in `services.json`.

| Key                    | Type   | Effect                                                                                                           |
| ---------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| `headline`             | string | Text of `<h1>`, `<title>` and `og:title`                                                                          |
| `tagline`              | string | Subheading, meta description and `og:description`                                                                 |
| `status_label`         | string | Text inside the pulsing red pill                                                                                  |
| `countdown_target`     | string | A date parseable by JS `new Date()` (e.g. `2026-07-20T18:00:00Z`); an empty value hides the countdown              |
| `progress_percent`     | int    | Cast to int and clamped to 0-100; `0` hides the progress bar                                                       |
| `auto_refresh_seconds` | int    | Automatic reload interval, with a server-side minimum of 60                                                       |
| `contact_email`        | string | Rendered as a `mailto:` link                                                                                      |
| `contact_url`          | string | A "Status Page" link with `target="_blank" rel="noopener"`                                                        |
| `services[]`           | array  | Objects `{name, description, status}`                                                                             |
| `next_steps[]`         | array  | Objects `{action, eta}`                                                                                           |

### Service statuses

The badge text is always the `status` value converted to upper case - PHP passes it through `strtoupper()` and the CSS on `.service-badge` additionally applies `text-transform: uppercase`. The colour is determined by the `badgeModifier()` function, which compares `strtolower($status)`.

| `status` value   | Badge                                                | Colour                       |
| ---------------- | ---------------------------------------------------- | ---------------------------- |
| `outage`         | OUTAGE                                               | red                          |
| `degraded`       | DEGRADED                                             | amber                        |
| `operational`    | OPERATIONAL                                          | green                        |
| anything else    | the value converted to upper case (`planned` → PLANNED) | grey (fallback `unknown`) |

Missing values have fallbacks: `name` → `Unnamed Service`, `description` → `No description provided.`, `status` → `UNKNOWN`, `action` → `Pending`, `eta` → `TBD`.

### Sample `services.json`

```json
{
  "headline": "We'll Be Back Shortly",
  "tagline": "Our platform is currently undergoing essential maintenance.",
  "status_label": "SERVICE UNAVAILABLE",
  "countdown_target": "",
  "progress_percent": 45,
  "auto_refresh_seconds": 300,
  "contact_email": "",
  "contact_url": "",
  "services": [
    { "name": "API", "description": "Some API endpoints are returning errors.", "status": "outage" },
    { "name": "CDN", "description": "Static assets are operational.", "status": "operational" }
  ],
  "next_steps": [
    { "action": "Investigating root cause with priority.", "eta": "1-2 hours" }
  ]
}
```

### What cannot be set through JSON

| Item                                     | Where it is changed                                |
| ---------------------------------------- | -------------------------------------------------- |
| Time zone (hard-coded to UTC)            | `date_default_timezone_set('UTC')` in `index.php`  |
| The `Retry-After: 3600` value            | `header(...)` in `index.php`                       |
| The apology paragraph and footer text    | literals in the HTML template in `index.php`       |
| Colour scheme and the entire look        | CSS custom properties in `styles.css`              |

---

## 🌐 HTTP headers

| Header           | Value                                  | Why                                                                         |
| ---------------- | -------------------------------------- | --------------------------------------------------------------------------- |
| Status           | `503 Service Unavailable`              | Crawlers and monitoring will not treat the page as valid content            |
| `Retry-After`    | `3600`                                 | Recommended interval before the next attempt, in seconds                    |
| `Cache-Control`  | `no-cache, no-store, must-revalidate`   | Prevents the maintenance page from staying in cache after service is back   |
| `<meta robots>`  | `noindex, nofollow`                    | A safeguard against indexing                                                |

---

## 🎨 Design and technology

| Layer      | Solution                                                                               |
| ---------- | -------------------------------------------------------------------------------------- |
| Backend    | PHP with no framework; uses no syntax newer than PHP 7.0 (because of the `??` operator) |
| Template   | Server-rendered HTML5 directly in `index.php`                                           |
| Styles     | Vanilla CSS, 720 lines, 6 `@keyframes`, 2 media queries, no preprocessor                |
| Scripts    | Inline vanilla JS in an IIFE, no libraries                                              |
| Data       | A JSON file, no database                                                                |
| Typography | Inter from Google Fonts, fallback `system-ui` / Segoe UI / Roboto                        |
| Icons      | Inline Heroicons SVG paths                                                              |

There is no `composer.json`, no `package.json`, no lockfile and no `vendor/` directory - the only external network dependency is the Google Fonts stylesheet. Without an internet connection the page keeps working with the system font.

---

## ⚠️ Known limitations

> [!WARNING]
> **`services.json` is publicly readable.** It sits next to `index.php` in the document root and the web server serves it as a static file at `/services.json` (HTTP 200). Do not put internal system names, incident details or company e-mail addresses in it, or block that path at the web server level.

> [!CAUTION]
> **Reload loop on an expired countdown.** `updateCountdown()` runs immediately after load and calls `location.reload()` when `diff <= 0`. If `countdown_target` points into the past and is left filled in, every load immediately triggers another one - endless refreshing for every visitor until you change or clear the value.

- 🔀 **It does not work without a routing rule** - the repository contains no `.htaccess`, no nginx configuration and no deploy script.
- 🔗 **`contact_url` is not validated against a scheme** - it is HTML-escaped, but a `javascript:` or `data:` value becomes a clickable link. Treat `services.json` as trusted input and never let it be edited through an upload form.
- 🕐 **The timestamp is tied to the file mtime** - any deploy method that rewrites the file (git checkout, rsync, container rebuild) will move "Last updated" even if nothing about the incident has changed. Times are always in UTC.
- 📈 **Auto-refresh generates load of its own** - `auto_refresh_seconds` has a lower bound of 60 but no upper bound. During a real outage every open browser hammers the already overloaded origin at that interval.
- 🎨 **Only the first three timeline dots get their own colour** - the CSS rules are `nth-child(2)` and `nth-child(3)`; the fourth and any further step gets the default purple dot.
- 🧊 **The design relies on `backdrop-filter` and `mask-composite`** - in browsers without support for them the glass cards render as flat translucent panels and the ring around the icon as a solid disc. The content stays readable.
- 🧪 **No tests, no linting, no CI and no logging** - JSON read errors are suppressed with `@` and silently fall back to the defaults, so a corrupted `services.json` only shows up as a generic page without any warning whatsoever.

---

## 📄 License

The project includes a `LICENSE` file with the full text of the **GNU General Public License v3 (29 June 2007)**.

GPL-3.0 is a copyleft licence - if you distribute a modified version, you must release it under GPL-3.0 again. The licence text is an unmodified FSF template with no copyright holder and no year filled in; no source file carries a GPL header.

---

<div align="center">

Built by **Alex Poliak** - [GitHub](https://github.com/Apoliak7777) - [alexpoliak21@gmail.com](mailto:alexpoliak21@gmail.com)

</div>
