<?php
// ============================================================
//  Maintenance Page — Premium Dark Glassmorphism
//  Reads configuration from services.json in the same directory.
// ============================================================

$servicesFile = __DIR__ . '/services.json';
$data = [
    'headline'             => "We'll Be Back Shortly",
    'tagline'              => 'Our platform is currently undergoing essential maintenance to enhance your experience.',
    'status_label'         => 'SERVICE UNAVAILABLE',
    'services'             => [],
    'next_steps'           => [],
    'countdown_target'     => '',
    'progress_percent'     => 0,
    'auto_refresh_seconds' => 300,
    'contact_email'        => '',
    'contact_url'          => '',
];

$lastUpdated = time();

if (file_exists($servicesFile)) {
    $json   = @file_get_contents($servicesFile);
    $parsed = @json_decode($json, true);
    if (is_array($parsed)) {
        $data = array_merge($data, $parsed);
    }
    $lastUpdated = filemtime($servicesFile);
}

function esc($s) {
    return htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function badgeModifier($status) {
    switch (strtolower($status)) {
        case 'outage':      return 'outage';
        case 'degraded':    return 'degraded';
        case 'operational': return 'operational';
        default:            return 'unknown';
    }
}

date_default_timezone_set('UTC');

// Send proper maintenance headers
http_response_code(503);
header('Retry-After: 3600');
header('Cache-Control: no-cache, no-store, must-revalidate');

$progressPercent     = max(0, min(100, (int)$data['progress_percent']));
$hasCountdown        = !empty($data['countdown_target']);
$hasProgress         = $progressPercent > 0;
$hasContact          = !empty($data['contact_email']) || !empty($data['contact_url']);
$autoRefreshSeconds  = max(60, (int)$data['auto_refresh_seconds']);
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <meta name="description" content="<?php echo esc($data['tagline']); ?>" />
    <meta property="og:title" content="<?php echo esc($data['headline']); ?> — Maintenance" />
    <meta property="og:description" content="<?php echo esc($data['tagline']); ?>" />
    <title><?php echo esc($data['headline']); ?> — Maintenance</title>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

    <link rel="stylesheet" href="styles.css" />
</head>
<body>

    <!-- Animated background -->
    <div class="bg-layer" aria-hidden="true">
        <div class="bg-orb bg-orb--1"></div>
        <div class="bg-orb bg-orb--2"></div>
        <div class="bg-orb bg-orb--3"></div>
    </div>
    <div class="bg-grid" aria-hidden="true"></div>

    <main class="page-wrap">

        <!-- ===== Hero ===== -->
        <header class="hero">
            <div class="hero__icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.049.58.025 1.193-.14 1.743" />
                </svg>
            </div>

            <div class="hero__pill">
                <span class="hero__pill-dot"></span>
                <?php echo esc($data['status_label']); ?>
            </div>

            <h1 class="hero__headline"><?php echo esc($data['headline']); ?></h1>
            <p class="hero__tagline"><?php echo esc($data['tagline']); ?></p>

            <?php if ($hasCountdown): ?>
            <!-- Countdown Timer -->
            <div class="countdown" id="countdown" data-target="<?php echo esc($data['countdown_target']); ?>">
                <div class="countdown__block">
                    <span class="countdown__number" id="cd-hours">--</span>
                    <span class="countdown__label">Hours</span>
                </div>
                <div class="countdown__block">
                    <span class="countdown__number" id="cd-minutes">--</span>
                    <span class="countdown__label">Minutes</span>
                </div>
                <div class="countdown__block">
                    <span class="countdown__number" id="cd-seconds">--</span>
                    <span class="countdown__label">Seconds</span>
                </div>
            </div>
            <?php endif; ?>
        </header>

        <!-- ===== Progress ===== -->
        <?php if ($hasProgress): ?>
        <section class="progress-section">
            <div class="glass-card">
                <div class="section-header">
                    <span class="section-label">Current Status</span>
                    <span class="section-label"><?php echo $progressPercent; ?>% Complete</span>
                </div>
                <p class="progress-message">
                    We sincerely apologize for any inconvenience. Our engineering team is working diligently to restore full service.
                </p>
                <div class="progress-bar-wrap">
                    <div class="progress-bar-fill" style="width: <?php echo $progressPercent; ?>%"></div>
                </div>
                <div class="progress-meta">
                    <span class="progress-percent">Maintenance in progress</span>
                    <span class="progress-updated">Updated <?php echo date('M j, g:i A T', $lastUpdated); ?></span>
                </div>
            </div>
        </section>
        <?php else: ?>
        <section class="progress-section">
            <div class="glass-card">
                <div class="section-header">
                    <span class="section-label">Current Status</span>
                </div>
                <p class="progress-message">
                    We sincerely apologize for any inconvenience. Our engineering team is working diligently to restore full service.
                </p>
                <div class="progress-meta">
                    <span class="progress-percent">Maintenance in progress</span>
                    <span class="progress-updated">Updated <?php echo date('M j, g:i A T', $lastUpdated); ?></span>
                </div>
            </div>
        </section>
        <?php endif; ?>

        <!-- ===== Affected Services ===== -->
        <?php if (!empty($data['services'])): ?>
        <section class="services-section">
            <div class="glass-card">
                <h2 class="section-title">Affected Services</h2>
                <div class="services-grid">
                    <?php foreach ($data['services'] as $i => $s):
                        $mod = badgeModifier($s['status'] ?? 'unknown');
                    ?>
                    <div class="service-row">
                        <div class="service-info">
                            <div class="service-name"><?php echo esc($s['name'] ?? 'Unnamed Service'); ?></div>
                            <div class="service-desc"><?php echo esc($s['description'] ?? 'No description provided.'); ?></div>
                        </div>
                        <span class="service-badge service-badge--<?php echo $mod; ?>">
                            <span class="service-badge__dot"></span>
                            <?php echo esc(strtoupper($s['status'] ?? 'UNKNOWN')); ?>
                        </span>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </section>
        <?php endif; ?>

        <!-- ===== Timeline — What Happens Next ===== -->
        <?php if (!empty($data['next_steps'])): ?>
        <section class="timeline-section">
            <div class="glass-card">
                <h2 class="section-title">What Happens Next</h2>
                <div class="timeline">
                    <?php foreach ($data['next_steps'] as $step): ?>
                    <div class="timeline-item">
                        <div class="timeline-item__content">
                            <span class="timeline-item__action"><?php echo esc($step['action'] ?? 'Pending'); ?></span>
                            <span class="timeline-item__eta">ETA: <?php echo esc($step['eta'] ?? 'TBD'); ?></span>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </section>
        <?php endif; ?>

        <!-- ===== Footer ===== -->
        <footer class="page-footer">
            <hr class="footer-divider" />
            <p class="footer-thanks">Thank you for your patience. We'll be back as soon as possible.</p>

            <?php if ($hasContact): ?>
            <div class="footer-contact">
                <?php if (!empty($data['contact_email'])): ?>
                    <a href="mailto:<?php echo esc($data['contact_email']); ?>"><?php echo esc($data['contact_email']); ?></a>
                <?php endif; ?>
                <?php if (!empty($data['contact_url'])): ?>
                    <a href="<?php echo esc($data['contact_url']); ?>" target="_blank" rel="noopener">Status Page ↗</a>
                <?php endif; ?>
            </div>
            <?php endif; ?>

            <div class="footer-meta">
                <span>Last updated: <?php echo date('F j, Y — g:i A T', $lastUpdated); ?></span>
                <span class="footer-meta__dot"></span>
                <span class="auto-refresh-badge">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182M20.984 4.356v4.993" />
                    </svg>
                    Auto-refresh in <span id="refresh-timer"><?php echo $autoRefreshSeconds; ?></span>s
                </span>
            </div>
        </footer>

    </main>

    <script>
    (function() {
        'use strict';

        // ---- Countdown Timer ----
        var cdEl = document.getElementById('countdown');
        if (cdEl) {
            var target = new Date(cdEl.dataset.target).getTime();
            if (!isNaN(target)) {
                function updateCountdown() {
                    var now  = Date.now();
                    var diff = Math.max(0, target - now);
                    var h = Math.floor(diff / 3600000);
                    var m = Math.floor((diff % 3600000) / 60000);
                    var s = Math.floor((diff % 60000) / 1000);
                    document.getElementById('cd-hours').textContent   = String(h).padStart(2, '0');
                    document.getElementById('cd-minutes').textContent = String(m).padStart(2, '0');
                    document.getElementById('cd-seconds').textContent = String(s).padStart(2, '0');
                    if (diff <= 0) { location.reload(); }
                }
                updateCountdown();
                setInterval(updateCountdown, 1000);
            }
        }

        // ---- Auto-refresh countdown ----
        var refreshSeconds = <?php echo $autoRefreshSeconds; ?>;
        var refreshEl = document.getElementById('refresh-timer');
        var remaining = refreshSeconds;

        setInterval(function() {
            remaining--;
            if (refreshEl) refreshEl.textContent = remaining;
            if (remaining <= 0) { location.reload(); }
        }, 1000);

    })();
    </script>

</body>
</html>