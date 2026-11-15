<?php
/**
 * Maintenance Website — PHP entry point
 * https://github.com/Apoliak7777/maintenance-website
 *
 * Answers with a real "503 Service Unavailable" (plus Retry-After and no-cache
 * headers) and serves index.html as one self-contained response: services.json,
 * styles.css, app.js and the icon are inlined, so it works from any URL the
 * maintenance rewrite sends here. Headline, tagline, status label, message and
 * brand are filled in on the server too, so the page says the right thing even
 * without JavaScript. Everything visual lives in index.html, styles.css and
 * app.js, which is why the PHP and the static version always look the same.
 *
 * Requires PHP 7.2 or newer, no extensions beyond the core.
 */

declare(strict_types=1);

$configFile   = __DIR__ . '/services.json';
$templateFile = __DIR__ . '/index.html';

/* ------------------------------------------------------------- helpers */

function esc($value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** A config value as trimmed text, or null when the key is missing. */
function configText(array $config, string $key): ?string
{
    if (!array_key_exists($key, $config) || $config[$key] === null) {
        return null;
    }
    return is_scalar($config[$key]) && !is_bool($config[$key]) ? trim((string) $config[$key]) : '';
}

/** Same rules as app.js: false or <= 0 turns it off, otherwise at least 60 s. */
function refreshSeconds($value): int
{
    if ($value === false) {
        return 0;
    }
    if (!is_numeric($value)) {
        return 300;
    }
    $seconds = (int) round((float) $value);
    return $seconds <= 0 ? 0 : max(60, $seconds);
}

/** Replaces the content of the element marked data-slot="$name". */
function fillSlot(string $html, string $name, string $innerHtml): string
{
    $pattern = '/(<([a-z][a-z0-9]*)\b[^>]*\bdata-slot="' . preg_quote($name, '/') . '"[^>]*>).*?(<\/\2>)/s';
    $result = preg_replace_callback($pattern, function (array $m) use ($innerHtml): string {
        return $m[1] . $innerHtml . $m[3];
    }, $html, 1);
    return $result === null ? $html : $result;
}

function replaceOnce(string $html, string $pattern, string $replacement): string
{
    $result = preg_replace_callback($pattern, function () use ($replacement): string {
        return $replacement;
    }, $html, 1);
    return $result === null ? $html : $result;
}

/* -------------------------------------------------------------- config */

$config    = [];
$updatedAt = time();

if (is_readable($configFile)) {
    $parsed = json_decode((string) file_get_contents($configFile), true);
    if (is_array($parsed)) {
        $config = $parsed;
    } else {
        error_log('maintenance-website: services.json is not valid JSON, showing the defaults.');
    }
    $updatedAt = filemtime($configFile) ?: time();
}

if (empty($config['updated_at'])) {
    $config['updated_at'] = gmdate('c', $updatedAt);
}

/* ------------------------------------------------------------- headers */

// When to come back: the countdown target if it is still ahead, otherwise in an hour.
$retryAfter = 3600;
if (!empty($config['countdown_target']) && is_string($config['countdown_target'])) {
    $target = strtotime($config['countdown_target']);
    if ($target !== false && $target > time()) {
        $retryAfter = max(60, $target - time());
    }
}

http_response_code(503);
header('Retry-After: ' . $retryAfter);
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Content-Type: text/html; charset=utf-8');
header('X-Robots-Tag: noindex, nofollow');

/* ---------------------------------------------------------------- page */

$html = is_readable($templateFile) ? file_get_contents($templateFile) : false;
if ($html === false) {
    // index.html is missing: still answer with a readable maintenance page.
    echo '<!doctype html><meta charset="utf-8"><title>Maintenance</title>',
         '<h1>We&#39;ll be back shortly</h1><p>The site is down for maintenance.</p>';
    exit;
}

$lang = strtolower((string) configText($config, 'lang'));
if (preg_match('/^[a-z]{2}$/', $lang)) {
    $html = replaceOnce($html, '/<html lang="[^"]*"/', '<html lang="' . $lang . '"');
}

$brand = configText($config, 'brand_name');
if ($brand !== null && $brand !== '') {
    $html = str_replace(
        ['<div class="brand" id="brand" data-slot="brand_name" hidden></div>',
         '<p class="site-footer__brand" data-slot="footer_brand"></p>'],
        ['<div class="brand" id="brand" data-slot="brand_name">' . esc($brand) . '</div>',
         '<p class="site-footer__brand" data-slot="footer_brand">' . esc($brand) . '</p>'],
        $html
    );
}

$footerText = configText($config, 'footer_text');
if ($footerText !== null && $footerText !== '') {
    $html = str_replace(
        '<p class="site-footer__text" data-slot="footer_text" hidden></p>',
        '<p class="site-footer__text" data-slot="footer_text">' . esc($footerText) . '</p>',
        $html
    );
}

// The photo next to the headline: only http(s) addresses or plain relative paths.
$image = configText($config, 'image_url');
if ($image !== null && preg_match('#^(https?://[^\s"<>]+|[A-Za-z0-9._~/-][A-Za-z0-9._~/%?=&+-]*)$#', $image)
    && !preg_match('#^//#', $image)) {
    $alt  = (string) configText($config, 'image_alt');
    $html = str_replace(
        ['<section class="hero" id="hero"',
         '<div class="hero__media" id="hero-media" hidden></div>'],
        ['<section class="hero hero--media" id="hero"',
         '<div class="hero__media" id="hero-media"><img src="' . esc($image) . '" alt="' . esc($alt) . '" decoding="async"></div>'],
        $html
    );
}

$headline = configText($config, 'headline');
if ($headline !== null && $headline !== '') {
    $title = $headline . ' — ' . ($brand ?: 'Maintenance');
    $html  = fillSlot($html, 'headline', esc($headline));
    $html  = replaceOnce($html, '/<title>.*?<\/title>/s', '<title>' . esc($title) . '</title>');
    $html  = replaceOnce($html, '/<meta property="og:title" content="[^"]*">/', '<meta property="og:title" content="' . esc($title) . '">');
}

// An empty status label keeps the default text in the banner; empty tagline or message hide them.
foreach (['status_label', 'tagline', 'message'] as $key) {
    $value = configText($config, $key);
    if ($value !== null && ($value !== '' || $key !== 'status_label')) {
        $html = fillSlot($html, $key, esc($value));
    }
}

$tagline = configText($config, 'tagline');
if ($tagline !== null && $tagline !== '') {
    $html = replaceOnce($html, '/<meta name="description" content="[^"]*">/', '<meta name="description" content="' . esc($tagline) . '">');
    $html = replaceOnce($html, '/<meta property="og:description" content="[^"]*">/', '<meta property="og:description" content="' . esc($tagline) . '">');
}

// Reload fallback for visitors without JavaScript.
$refresh  = refreshSeconds(array_key_exists('auto_refresh_seconds', $config) ? $config['auto_refresh_seconds'] : null);
$noscript = $refresh > 0 ? '<noscript><meta http-equiv="refresh" content="' . $refresh . '"></noscript>' : '';
$html     = str_replace('<noscript><meta http-equiv="refresh" content="300"></noscript>', $noscript, $html);

// Inline the stylesheet, the script and the icon. The maintenance rewrite can send any URL
// here (/shop/cart, /blog/post), where relative links to styles.css would break; inlined,
// the page renders from every path and needs no further requests to a busy server.
$assets = [
    '<link rel="stylesheet" href="styles.css">' => ['styles.css', '<style>', '</style>'],
    '<script src="app.js"></script>'            => ['app.js', '<script>', '</script>'],
];
foreach ($assets as $tag => $asset) {
    $file = __DIR__ . '/' . $asset[0];
    $code = is_readable($file) ? (string) file_get_contents($file) : '';
    if ($code !== '' && stripos($code, $asset[2]) === false) {
        $html = str_replace($tag, $asset[1] . "\n" . $code . $asset[2], $html);
    }
}
$iconFile = __DIR__ . '/favicon.svg';
if (is_readable($iconFile)) {
    $icon = base64_encode((string) file_get_contents($iconFile));
    $html = str_replace('href="favicon.svg"', 'href="data:image/svg+xml;base64,' . $icon . '"', $html);
}

// The whole config goes to app.js inline; JSON_HEX_TAG keeps "</script>" from closing the tag.
$flags = JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
       | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE;
$json  = json_encode($config, $flags);
if ($json === false) {
    $json = '{}';
}
$html = str_replace(
    '<!-- maintenance:config -->',
    '<script id="maintenance-config" type="application/json">' . $json . '</script>',
    $html
);

echo $html;
