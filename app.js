/*!
 * Maintenance Website — page renderer
 * https://github.com/Apoliak7777/maintenance-website
 *
 * Reads the configuration (inlined by index.php, otherwise fetched from
 * services.json), fills in the page and keeps the live parts up to date:
 * "updated … ago", the time left and the automatic refresh.
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Interface strings. Add a language by copying one block; then set
     "lang" in services.json to its key.
     ------------------------------------------------------------------ */
  var STRINGS = {
    en: {
      locale: 'en-GB',
      maintenance: 'Maintenance',
      support: 'Support',
      headline: "We'll be back shortly",
      tagline: 'We are carrying out scheduled maintenance to make the site faster and more reliable.',
      status_label: 'Scheduled maintenance in progress',
      message: 'We apologise for the inconvenience. We are working to have everything running again as soon as possible.',
      updated: 'Updated',
      updated_now: 'Updated just now',
      started: 'Started',
      expected_end: 'Expected to finish',
      progress: 'Completed',
      affected_label: 'Affected services',
      n_of_total: '{n} of {total}',
      time_left: 'about {time} left',
      under_minute: 'less than a minute left',
      any_minute: 'any minute now',
      latest_update: 'Latest update',
      services: 'Service status',
      affected_count: 'Affected: {n} of {total}',
      all_operational: 'All services operational',
      next_steps: 'Maintenance plan',
      step_done: 'Done',
      step_active: 'In progress',
      step_pending: 'Up next',
      status_operational: 'Operational',
      status_degraded: 'Degraded performance',
      status_outage: 'Outage',
      status_maintenance: 'Under maintenance',
      unnamed: 'Unnamed service',
      pending_action: 'Pending',
      email_support: 'Email support',
      call: 'Call',
      contact_url: 'Status page',
      help_title: 'Need help?',
      help_text: 'Our support team is available during the maintenance.',
      thanks: 'Thank you for your patience.',
      next_check: 'This page refreshes automatically in'
    },
    sk: {
      locale: 'sk-SK',
      maintenance: 'Údržba',
      support: 'Podpora',
      headline: 'Čoskoro sme späť',
      tagline: 'Práve prebieha plánovaná údržba, po ktorej bude stránka rýchlejšia a spoľahlivejšia.',
      status_label: 'Prebieha plánovaná údržba',
      message: 'Ospravedlňujeme sa za komplikácie. Pracujeme na tom, aby všetko čo najskôr znova fungovalo.',
      updated: 'Aktualizované',
      updated_now: 'Aktualizované práve teraz',
      started: 'Začiatok',
      expected_end: 'Predpokladaný koniec',
      progress: 'Hotovo',
      affected_label: 'Dotknuté služby',
      n_of_total: '{n} z {total}',
      time_left: 'zostáva asi {time}',
      under_minute: 'zostáva menej ako minúta',
      any_minute: 'už každú chvíľu',
      latest_update: 'Posledná správa',
      services: 'Stav služieb',
      affected_count: 'Obmedzené: {n} z {total}',
      all_operational: 'Všetky služby fungujú',
      next_steps: 'Postup prác',
      step_done: 'Hotovo',
      step_active: 'Prebieha',
      step_pending: 'Na rade',
      status_operational: 'V prevádzke',
      status_degraded: 'Obmedzená prevádzka',
      status_outage: 'Výpadok',
      status_maintenance: 'Údržba',
      unnamed: 'Služba bez názvu',
      pending_action: 'Čaká sa',
      email_support: 'Napísať podpore',
      call: 'Zavolať',
      contact_url: 'Stavová stránka',
      help_title: 'Potrebujete pomoc?',
      help_text: 'Podpora je k dispozícii aj počas údržby.',
      thanks: 'Ďakujeme za trpezlivosť.',
      next_check: 'Stránka sa sama obnoví za'
    }
  };

  var STATUS_KINDS = ['outage', 'degraded', 'maintenance', 'operational'];
  var STEP_STATES = ['done', 'active', 'pending'];
  var SVG_NS = 'http://www.w3.org/2000/svg';

  // White signs drawn on a 16 × 16 coloured disc.
  var SIGNS = {
    operational: ['M4.7 8.3l2.2 2.2 4.4-4.7'],
    degraded: ['M8 4.4v4.3', 'dot:8:11.4'],
    outage: ['M5.6 5.6l4.8 4.8M10.4 5.6l-4.8 4.8'],
    maintenance: ['M8 4.4V8l2.4 1.5'],
    unknown: ['M6.1 6.2a1.9 1.9 0 1 1 2.7 1.7c-.5.3-.8.6-.8 1.1v.3', 'dot:8:11.5']
  };

  var root = document.documentElement;

  /* ---------------------------------------------------------- helpers */

  function byId(id) {
    return document.getElementById(id);
  }

  function slot(name) {
    return document.querySelector('[data-slot="' + name + '"]');
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function svgEl(tag, attrs) {
    var node = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (key) {
      node.setAttribute(key, attrs[key]);
    });
    return node;
  }

  function sign(kind) {
    var svg = svgEl('svg', { viewBox: '0 0 16 16', 'aria-hidden': 'true', focusable: 'false' });
    svg.appendChild(svgEl('circle', { cx: 8, cy: 8, r: 8, 'class': 'sign__disc' }));
    (SIGNS[kind] || SIGNS.unknown).forEach(function (shape) {
      if (shape.indexOf('dot:') === 0) {
        var xy = shape.split(':');
        svg.appendChild(svgEl('circle', { cx: xy[1], cy: xy[2], r: 1.05, 'class': 'sign__dot' }));
      } else {
        svg.appendChild(svgEl('path', { d: shape, 'class': 'sign__mark' }));
      }
    });
    return svg;
  }

  function stepMark(state) {
    if (state === 'done') return sign('operational');
    var svg = svgEl('svg', { viewBox: '0 0 16 16', 'aria-hidden': 'true', focusable: 'false' });
    svg.appendChild(svgEl('circle', { cx: 8, cy: 8, r: 7, 'class': 'step-ring' }));
    if (state === 'active') svg.appendChild(svgEl('circle', { cx: 8, cy: 8, r: 3.6, 'class': 'step-core' }));
    return svg;
  }

  function arrowIcon() {
    var svg = svgEl('svg', { viewBox: '0 0 16 16', 'class': 'line-icon', 'aria-hidden': 'true', focusable: 'false' });
    svg.appendChild(svgEl('path', { d: 'M5 11l6-6M6 5h5v5' }));
    return svg;
  }

  function str(value) {
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' && isFinite(value)) return String(value);
    return '';
  }

  // A missing key falls back to the default; an explicit "" hides the element.
  function textOr(value, fallback) {
    return value === undefined || value === null ? fallback : str(value);
  }

  function list(value) {
    return Array.isArray(value)
      ? value.filter(function (item) { return item && typeof item === 'object'; })
      : [];
  }

  function fill(template, values) {
    return template.replace(/\{(\w+)\}/g, function (match, key) {
      return values[key] !== undefined ? values[key] : match;
    });
  }

  function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function pad2(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function parseDate(value) {
    if (typeof value !== 'string' || !value.trim()) return null;
    var date = new Date(value.trim());
    return isNaN(date.getTime()) ? null : date;
  }

  // Only link schemes that cannot run script.
  function safeUrl(url, schemes) {
    try {
      var parsed = new URL(url, location.href);
      return (schemes || ['http:', 'https:', 'mailto:']).indexOf(parsed.protocol) >= 0 ? parsed.href : '';
    } catch (e) {
      return '';
    }
  }

  function phoneHref(phone) {
    var digits = phone.replace(/[^\d+]/g, '');
    return /^\+?\d{5,}$/.test(digits) ? 'tel:' + digits : '';
  }

  function validTimeZone(zone) {
    if (!zone) return undefined;
    try {
      new Intl.DateTimeFormat('en', { timeZone: zone }).format(0);
      return zone;
    } catch (e) {
      return undefined;
    }
  }

  function refreshSeconds(value) {
    if (value === false) return 0;
    if (value === undefined || value === null || value === '' || value === true) return 300;
    var seconds = Number(value);
    if (!isFinite(seconds)) return 300;
    return seconds <= 0 ? 0 : Math.max(60, Math.round(seconds));
  }

  function formatDate(date, cfg, options) {
    var opts = { timeZone: cfg.timeZone };
    Object.keys(options).forEach(function (key) { opts[key] = options[key]; });
    try {
      return new Intl.DateTimeFormat(cfg.t.locale, opts).format(date);
    } catch (e) {
      return date.toUTCString();
    }
  }

  function formatUnit(value, unit, display, cfg) {
    try {
      return new Intl.NumberFormat(cfg.t.locale, { style: 'unit', unit: unit, unitDisplay: display }).format(value);
    } catch (e) {
      return value + ' ' + unit.charAt(0);
    }
  }

  function formatPercent(value, cfg) {
    try {
      return new Intl.NumberFormat(cfg.t.locale, { style: 'percent' }).format(value / 100);
    } catch (e) {
      return value + ' %';
    }
  }

  // Calendar date (YYYY-MM-DD) of a moment in the configured time zone.
  function dayKey(date, cfg) {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: cfg.timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
    } catch (e) {
      return date.toISOString().slice(0, 10);
    }
  }

  function daysApart(from, to, cfg) {
    var a = dayKey(from, cfg).split('-');
    var b = dayKey(to, cfg).split('-');
    return Math.round((Date.UTC(+b[0], b[1] - 1, +b[2]) - Date.UTC(+a[0], a[1] - 1, +a[2])) / 86400000);
  }

  // "23:30 CET"
  function clockText(date, cfg) {
    return formatDate(date, cfg, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'short' });
  }

  // "Today", "Tomorrow", "Yesterday", otherwise "Saturday 21 November".
  function dayText(date, cfg) {
    var days = daysApart(new Date(), date, cfg);
    if (Math.abs(days) <= 1 && window.Intl && Intl.RelativeTimeFormat) {
      return capitalize(new Intl.RelativeTimeFormat(cfg.t.locale, { numeric: 'auto' }).format(days, 'day'));
    }
    return capitalize(formatDate(date, cfg, { weekday: 'long', day: 'numeric', month: 'long' }));
  }

  function timeLeft(ms, cfg) {
    var minutes = Math.ceil(ms / 60000);
    if (minutes <= 1) return cfg.t.under_minute;
    var d = Math.floor(minutes / 1440);
    var h = Math.floor(minutes % 1440 / 60);
    var m = minutes % 60;
    var parts = [];
    if (d) parts.push(formatUnit(d, 'day', 'long', cfg));
    if (h) parts.push(formatUnit(h, 'hour', 'short', cfg));
    if (m && !d) parts.push(formatUnit(m, 'minute', 'short', cfg));
    return fill(cfg.t.time_left, { time: parts.join(' ') });
  }

  function updatedText(date, cfg) {
    var seconds = Math.round((date.getTime() - Date.now()) / 1000);
    if (seconds > -60) return cfg.t.updated_now;
    if (!window.Intl || !Intl.RelativeTimeFormat) return '';
    var rtf = new Intl.RelativeTimeFormat(cfg.t.locale, { numeric: 'auto' });
    var minutes = Math.round(seconds / 60);
    var hours = Math.round(minutes / 60);
    var text = minutes > -60 ? rtf.format(minutes, 'minute')
      : hours > -24 ? rtf.format(hours, 'hour')
      : rtf.format(Math.round(hours / 24), 'day');
    return cfg.t.updated + ' ' + text;
  }

  function duration(total) {
    var h = Math.floor(total / 3600);
    var m = Math.floor(total % 3600 / 60);
    var s = total % 60;
    return (h ? h + ':' + pad2(m) : String(m)) + ':' + pad2(s);
  }

  // Runs fn on every whole second until it returns false.
  function everySecond(fn) {
    (function loop() {
      if (fn() === false) return;
      setTimeout(loop, 1000 - (Date.now() % 1000) + 10);
    })();
  }

  // Background tabs wait until someone looks at them, so they do not hit a struggling server.
  function reloadWhenVisible() {
    if (!document.hidden) {
      location.reload();
      return;
    }
    document.addEventListener('visibilitychange', function wait() {
      if (document.hidden) return;
      document.removeEventListener('visibilitychange', wait);
      location.reload();
    });
  }

  /* ----------------------------------------------------------- config */

  function normalise(raw, stamp) {
    var data = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    var lang = str(data.lang).toLowerCase().slice(0, 2);
    if (!STRINGS[lang]) lang = 'en';
    var t = STRINGS[lang];

    var progress = Math.round(parseFloat(str(data.progress_percent)) || 0);
    var accent = str(data.accent_color);
    var theme = str(data.theme).toLowerCase();

    var cfg = {
      lang: lang,
      t: t,
      brand: str(data.brand_name),
      logo: str(data.logo_url),
      image: str(data.image_url),
      imageAlt: str(data.image_alt),
      headline: str(data.headline) || t.headline,
      tagline: textOr(data.tagline, t.tagline),
      statusLabel: textOr(data.status_label, t.status_label),
      message: textOr(data.message, t.message),
      started: parseDate(data.started_at),
      countdown: parseDate(data.countdown_target),
      progress: Math.min(100, Math.max(0, progress)),
      refresh: refreshSeconds(data.auto_refresh_seconds),
      phone: str(data.contact_phone),
      email: str(data.contact_email),
      url: str(data.contact_url),
      footerText: str(data.footer_text),
      services: list(data.services),
      steps: list(data.next_steps),
      accent: /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(accent) ? accent : '',
      theme: theme === 'dark' || theme === 'auto' ? theme : 'light',
      timeZone: validTimeZone(str(data.timezone)),
      updated: parseDate(data.updated_at) || stamp || new Date()
    };

    // Demo mode for the public preview (page opened with ?demo): the start, the expected
    // end and the update time move along with the clock, so the preview never looks stale.
    if (/[?&]demo(?:[=&]|$)/.test(location.search)) {
      var now = Date.now();
      var step = 5 * 60000;
      cfg.started = new Date(Math.floor((now - 72 * 60000) / step) * step);
      cfg.countdown = new Date(Math.ceil((now + 95 * 60000) / step) * step);
      cfg.updated = new Date(now - 7 * 60000);
    }
    return cfg;
  }

  /* ----------------------------------------------------------- render */

  function applyTheme(cfg) {
    var theme = cfg.theme;
    if (theme === 'auto') {
      theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    root.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', cfg.accent || '#1d5bd6');
  }

  function translate(t) {
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute('data-i18n');
      if (t[key]) nodes[i].textContent = t[key];
    }
  }

  function renderAlert(cfg) {
    slot('status_label').textContent = cfg.statusLabel || cfg.t.status_label;

    var ago = byId('updated-ago');
    var paint = function () {
      ago.textContent = updatedText(cfg.updated, cfg);
      ago.hidden = !ago.textContent;
    };
    paint();
    setInterval(paint, 30000);
  }

  function renderHeader(cfg, links) {
    var brand = byId('brand');
    var logo = cfg.logo ? safeUrl(cfg.logo, ['http:', 'https:']) : '';
    var name = cfg.brand || location.hostname;
    brand.textContent = '';
    if (logo) {
      var img = el('img');
      img.src = logo;
      img.alt = name;
      brand.appendChild(img);
    } else {
      brand.textContent = name;
    }
    brand.hidden = !logo && !name;

    var contact = byId('header-contact');
    contact.textContent = '';
    if (links.phone || links.mail) {
      contact.appendChild(el('span', 'header-contact__label', cfg.t.support));
      if (links.phone) {
        var phone = el('a', 'is-phone', cfg.phone);
        phone.href = links.phone;
        contact.appendChild(phone);
      }
      if (links.mail) {
        var mail = el('a', '', cfg.email);
        mail.href = links.mail;
        contact.appendChild(mail);
      }
    }
    contact.hidden = !links.phone && !links.mail;
  }

  function button(href, label, primary, external) {
    var link = el('a', primary ? 'btn btn--primary' : 'btn btn--secondary');
    link.href = href;
    link.appendChild(el('span', '', label));
    if (external) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.appendChild(arrowIcon());
    }
    return link;
  }

  function renderHero(cfg, links) {
    slot('headline').textContent = cfg.headline;

    var tagline = slot('tagline');
    tagline.textContent = cfg.tagline;
    tagline.hidden = !cfg.tagline;

    var actions = byId('actions');
    actions.textContent = '';
    if (links.mail) actions.appendChild(button(links.mail, cfg.t.email_support, true, false));
    if (links.page) actions.appendChild(button(links.page, cfg.t.contact_url, !links.mail, true));
    if (!links.mail && !links.page && links.phone) {
      actions.appendChild(button(links.phone, cfg.t.call + ' ' + cfg.phone, true, false));
    }
    actions.hidden = !actions.firstChild;

    var media = byId('hero-media');
    var src = cfg.image ? safeUrl(cfg.image, ['http:', 'https:']) : '';
    if (src) {
      var img = media.querySelector('img') || el('img');
      img.src = src;
      img.alt = cfg.imageAlt;
      img.decoding = 'async';
      if (!img.parentNode) media.appendChild(img);
    }
    media.hidden = !src;
    byId('hero').classList.toggle('hero--media', !!src);
  }

  function fact(label, value, note) {
    var item = el('div', 'fact');
    item.appendChild(el('dt', '', label));
    item.appendChild(el('dd', 'fact__value', value));
    if (note) item.appendChild(note);
    return item;
  }

  function renderFacts(cfg, summary) {
    var t = cfg.t;
    var listNode = byId('facts-list');
    listNode.textContent = '';

    if (cfg.started) {
      listNode.appendChild(fact(t.started, clockText(cfg.started, cfg), el('dd', 'fact__note', dayText(cfg.started, cfg))));
    }

    if (cfg.countdown) {
      var target = cfg.countdown.getTime();
      var day = dayText(cfg.countdown, cfg);
      var note = el('dd', 'fact__note');
      listNode.appendChild(fact(t.expected_end, clockText(cfg.countdown, cfg), note));

      if (target <= Date.now()) {
        // Already over when the page loaded: say so instead of reloading in a loop.
        note.textContent = day + ' · ' + t.any_minute;
      } else {
        everySecond(function () {
          var ms = target - Date.now();
          if (ms <= 0) {
            note.textContent = day + ' · ' + t.any_minute;
            // It ran out while the page was open: check once whether we are back.
            setTimeout(reloadWhenVisible, 2000 + Math.random() * 4000);
            return false;
          }
          note.textContent = day + ' · ' + timeLeft(ms, cfg);
        });
      }
    }

    if (cfg.progress) {
      var bar = el('dd', 'fact__bar');
      var fillNode = el('span');
      bar.setAttribute('role', 'progressbar');
      bar.setAttribute('aria-label', t.progress);
      bar.setAttribute('aria-valuemin', '0');
      bar.setAttribute('aria-valuemax', '100');
      bar.setAttribute('aria-valuenow', String(cfg.progress));
      bar.appendChild(fillNode);
      listNode.appendChild(fact(t.progress, formatPercent(cfg.progress, cfg), bar));
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { fillNode.style.width = cfg.progress + '%'; });
      });
    }

    if (summary.total) {
      listNode.appendChild(fact(t.affected_label, fill(t.n_of_total, { n: summary.affected, total: summary.total })));
    }

    byId('facts').hidden = !listNode.firstChild;
  }

  function renderUpdate(cfg) {
    slot('message').textContent = cfg.message;
    byId('update').hidden = !cfg.message;

    var stamp = byId('updated-at');
    stamp.dateTime = cfg.updated.toISOString();
    stamp.textContent = formatDate(cfg.updated, cfg, {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'short'
    });
    stamp.hidden = false;
  }

  function renderServices(cfg) {
    var t = cfg.t;
    var summary = { affected: 0, total: cfg.services.length };
    if (!summary.total) return summary;

    var rows = byId('service-list');
    rows.textContent = '';

    cfg.services.forEach(function (service) {
      var raw = str(service.status);
      var kind = raw.toLowerCase();
      if (STATUS_KINDS.indexOf(kind) < 0) kind = 'unknown';
      if (kind !== 'operational') summary.affected++;

      var row = el('li', 'row is-' + kind);
      var main = el('div', 'row__main');
      main.appendChild(el('p', 'row__name', str(service.name) || t.unnamed));
      var description = str(service.description);
      if (description) main.appendChild(el('p', 'row__desc', description));

      var state = el('span', 'state');
      var label = kind === 'unknown' ? capitalize(raw) : t['status_' + kind];
      state.appendChild(sign(kind));
      state.appendChild(el('span', '', label || '?'));

      row.appendChild(main);
      row.appendChild(state);
      rows.appendChild(row);
    });

    byId('services-count').textContent = summary.affected
      ? fill(t.affected_count, { n: summary.affected, total: summary.total })
      : t.all_operational;
    byId('services').hidden = false;
    return summary;
  }

  function renderSteps(cfg) {
    var t = cfg.t;
    if (!cfg.steps.length) return;

    // Without any "state", the first step is the current one.
    var explicit = cfg.steps.some(function (step) { return str(step.state); });
    var rows = byId('step-list');
    rows.textContent = '';

    cfg.steps.forEach(function (step, index) {
      var state = explicit ? str(step.state).toLowerCase() : (index === 0 ? 'active' : 'pending');
      if (STEP_STATES.indexOf(state) < 0) state = 'pending';

      var eta = str(step.eta);
      var row = el('li', 'row step is-' + state);
      var body = el('div', 'step__body');
      body.appendChild(el('p', 'step__text', str(step.action) || t.pending_action));
      body.appendChild(el('p', 'state', t['step_' + state] + (eta ? ' · ' + eta : '')));

      row.appendChild(stepMark(state));
      row.appendChild(body);
      rows.appendChild(row);
    });

    byId('steps').hidden = false;
  }

  function renderHelp(cfg, links) {
    var phone = byId('help-phone');
    phone.textContent = '';
    if (links.phone) {
      var call = el('a', '', cfg.phone);
      call.href = links.phone;
      phone.appendChild(call);
    }
    phone.hidden = !links.phone;

    var more = byId('help-links');
    more.textContent = '';
    if (links.mail) {
      var mail = el('a', '', cfg.email);
      mail.href = links.mail;
      more.appendChild(mail);
    }
    if (links.page) {
      var page = el('a', '', cfg.t.contact_url);
      page.href = links.page;
      page.target = '_blank';
      page.rel = 'noopener noreferrer';
      page.appendChild(arrowIcon());
      more.appendChild(page);
    }
    more.hidden = !more.firstChild;

    byId('help').hidden = !links.phone && !links.mail && !links.page;
  }

  function renderFooter(cfg) {
    slot('footer_brand').textContent = cfg.brand || location.hostname;
    var text = slot('footer_text');
    text.textContent = cfg.footerText;
    text.hidden = !cfg.footerText;
  }

  // The first visible section of each column loses its top rule.
  function markFirstSections() {
    ['.content__main', '.content__side'].forEach(function (selector) {
      var first = true;
      var sections = document.querySelectorAll(selector + ' > .section');
      for (var i = 0; i < sections.length; i++) {
        var isFirst = first && !sections[i].hidden;
        sections[i].classList.toggle('is-first', isFirst);
        if (isFirst) first = false;
      }
    });
  }

  function startRefresh(cfg) {
    if (!cfg.refresh) return;

    // Up to 10 % jitter, so open tabs do not all reload in the same second.
    var seconds = cfg.refresh + Math.round(Math.random() * cfg.refresh * 0.1);
    var deadline = Date.now() + seconds * 1000;
    var left = byId('refresh-left');
    byId('refresh').hidden = false;

    everySecond(function () {
      var remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      left.textContent = duration(remaining);
      if (remaining === 0) {
        reloadWhenVisible();
        return false;
      }
    });
  }

  function render(cfg) {
    var t = cfg.t;
    var links = {
      phone: cfg.phone ? phoneHref(cfg.phone) : '',
      mail: cfg.email ? safeUrl('mailto:' + cfg.email, ['mailto:']) : '',
      page: cfg.url ? safeUrl(cfg.url, ['http:', 'https:']) : ''
    };

    root.lang = cfg.lang;
    if (cfg.accent) root.style.setProperty('--accent', cfg.accent);
    applyTheme(cfg);

    document.title = cfg.headline + ' — ' + (cfg.brand || t.maintenance);
    var description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute('content', cfg.tagline || cfg.headline);

    translate(t);
    renderAlert(cfg);
    renderHeader(cfg, links);
    renderHero(cfg, links);
    var summary = renderServices(cfg);
    renderFacts(cfg, summary);
    renderUpdate(cfg);
    renderSteps(cfg);
    renderHelp(cfg, links);
    renderFooter(cfg);
    markFirstSections();
    startRefresh(cfg);
  }

  /* ------------------------------------------------------------- boot */

  function inlineConfig() {
    var node = byId('maintenance-config');
    if (!node) return null;
    try {
      return JSON.parse(node.textContent);
    } catch (e) {
      return {};
    }
  }

  function boot() {
    var inline = inlineConfig();
    if (inline) {
      render(normalise(inline, null));
      return;
    }
    if (!window.fetch) {
      render(normalise({}, null));
      return;
    }

    // Static hosting: read services.json; Last-Modified stands in for "last updated".
    fetch('services.json', { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        var modified = parseDate(response.headers.get('Last-Modified') || '');
        return response.json().then(function (json) {
          return { json: json, modified: modified };
        });
      })
      .then(
        function (result) { render(normalise(result.json, result.modified)); },
        function () { render(normalise({}, null)); }
      );
  }

  boot();
})();
