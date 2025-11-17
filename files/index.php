<?php
// Simple maintenance page that reads content from services.json
// Put this file and styles.css + services.json in the same folder.

$servicesFile = __DIR__ . '/services.json';
$data = [
    'headline' => "We'll Be Back Shortly",
    'tagline'  => 'Our platform is currently undergoing essential maintenance to enhance your experience.',
    'status_label' => 'SERVICE UNAVAILABLE',
    'services' => [],
    'next_steps' => [],
];

$lastUpdated = time();

if (file_exists($servicesFile)) {
    $json = @file_get_contents($servicesFile);
    $parsed = @json_decode($json, true);
    if (is_array($parsed)) {
        $data = array_merge($data, $parsed);
    }
    $lastUpdated = filemtime($servicesFile);
}

function esc($s) {
    return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function badgeClass($status) {
    switch (strtolower($status)) {
        case 'outage': return 'badge outage';
        case 'degraded': return 'badge degraded';
        case 'operational': return 'badge operational';
        default: return 'badge unknown';
    }
}

date_default_timezone_set('UTC'); // change if needed
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title><?php echo esc($data['headline']); ?> - Maintenance</title>
    <link rel="stylesheet" href="styles.css" />
</head>
<body>
    <main class="wrap">
        <header class="header">
            <div class="status-pill"><?php echo esc($data['status_label']); ?></div>
            <h1 class="headline"><?php echo esc($data['headline']); ?></h1>
            <p class="tagline"><?php echo esc($data['tagline']); ?></p>
        </header>

        <section class="card center-card">
            <h3 class="card-title">Current Status</h3>
            <p class="card-body">
                We sincerely apologize for any inconvenience. Our engineering team is working diligently to restore full service.
            </p>
            <div class="meta">Last Updated: <?php echo date('F j, Y - g:i A T', $lastUpdated); ?></div>
            <div class="cta-row">
                <a class="btn" href="#details">View Detailed Status →</a>
            </div>
        </section>

        <section id="details" class="card">
            <h3 class="section-title">Affected Services</h3>
            <div class="list">
                <?php if (!empty($data['services'])): ?>
                    <?php foreach ($data['services'] as $s): ?>
                        <div class="list-item">
                            <div class="list-left">
                                <div class="service-name"><?php echo esc($s['name'] ?? '[Unnamed service]'); ?></div>
                                <div class="service-desc"><?php echo esc($s['description'] ?? 'No description provided.'); ?></div>
                            </div>
                            <div class="list-right">
                                <span class="<?php echo badgeClass($s['status'] ?? 'unknown'); ?>">
                                    <?php echo esc(strtoupper($s['status'] ?? 'UNKNOWN')); ?>
                                </span>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php else: ?>
                    <p class="muted">No services listed.</p>
                <?php endif; ?>
            </div>

            <h3 class="section-title">What Happens Next</h3>
            <div class="list">
                <?php if (!empty($data['next_steps'])): ?>
                    <?php foreach ($data['next_steps'] as $step): ?>
                        <div class="list-item">
                            <div class="list-left">
                                <div class="service-desc"><?php echo esc($step['action'] ?? '[Action here]'); ?></div>
                            </div>
                            <div class="list-right">
                                <span class="eta">ETA: <?php echo esc($step['eta'] ?? 'TBD'); ?></span>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php else: ?>
                    <p class="muted">No next steps provided.</p>
                <?php endif; ?>
            </div>
        </section>

        <footer class="footer">
            <p class="muted">Thank you for your patience.</p>
        </footer>
    </main>
</body>
</html>