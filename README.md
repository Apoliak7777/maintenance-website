<div align="center">

[![Slovencina](https://img.shields.io/badge/SK-Sloven%C4%8Dina-2ea043?style=for-the-badge)](README.md) [![English](https://img.shields.io/badge/EN-English-30363d?style=for-the-badge)](README.en.md)

</div>

<div align="center">

# 🚧 Maintenance Website

**Elegantná jednostránková maintenance / status stránka v čistom PHP - nasadíte ju za minútu a spravujete jediným JSON súborom.**

![PHP](https://img.shields.io/badge/PHP-7.0%2B-777BB4?style=flat-square&logo=php&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-vanilla-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![JSON](https://img.shields.io/badge/Config-JSON-000000?style=flat-square&logo=json&logoColor=white)
![License](https://img.shields.io/badge/License-GPL--3.0-blue?style=flat-square)

</div>

---

## 📑 Obsah

- [🔍 Prehľad](#-prehľad)
- [✨ Funkcie](#-funkcie)
- [🚀 Rýchly štart](#-rýchly-štart)
- [📂 Štruktúra projektu](#-štruktúra-projektu)
- [⚙️ Konfigurácia](#️-konfigurácia)
- [🌐 HTTP hlavičky](#-http-hlavičky)
- [🎨 Dizajn a technológie](#-dizajn-a-technológie)
- [⚠️ Známe obmedzenia](#️-známe-obmedzenia)
- [📄 Licencia](#-licencia)

---

## 🔍 Prehľad

Maintenance Website je jediný PHP súbor, ktorý vykreslí tmavú „glassmorphism" stránku počas výpadku alebo plánovanej odstávky. Zobrazí nadpis, status pill, voliteľný odpočet, progress bar, zoznam dotknutých služieb s farebnými badge-mi, časovú os ďalších krokov a pätičku s kontaktmi a automatickým obnovením stránky.

Kľúčový rozdiel oproti obyčajnej HTML stránke je v tom, že odpovedá kódom **HTTP 503 Service Unavailable** s hlavičkou `Retry-After`, takže vyhľadávače aj monitoring nástroje ju vyhodnotia ako skutočný výpadok, nie ako novú stránku vášho webu.

Bez frameworku, bez databázy, bez build kroku a bez admin rozhrania - celý obsah sa mení editáciou súboru `services.json`, ktorý sa načítava pri každom requeste.

---

## ✨ Funkcie

- 🛑 **Korektný 503 status** - odpoveď `503` + `Retry-After: 3600` + `Cache-Control: no-cache, no-store, must-revalidate` a `<meta name="robots" content="noindex, nofollow">`.
- 🗂️ **Konfigurácia cez JSON** - všetok obsah pochádza zo `services.json`, ktorý sa cez `array_merge` mieša nad PHP defaulty; chýbajúci alebo poškodený súbor stránku nezhodí.
- 🚦 **Stavy služieb** - štyri varianty badge-u: `outage` (červená), `degraded` (jantárová), `operational` (zelená) a šedý fallback `unknown` pre neznámy reťazec.
- 📊 **Voliteľný progress bar** - `progress_percent` sa oreže do rozsahu 0-100; hodnota `0` bar skryje a vykreslí zjednodušenú status kartu.
- ⏱️ **Odpočet do obnovenia** - JS countdown (hodiny / minúty / sekundy) podľa `countdown_target`; pri prázdnej hodnote sa blok vôbec nevykreslí.
- 🔄 **Automatické obnovenie** - pätička odpočítava sekundy do `location.reload()`, serverovo s minimom 60 sekúnd (`max(60, ...)`).
- 🧭 **Timeline „What Happens Next"** - kroky zo `next_steps`, každý s popisom akcie a ETA pill-om.
- ✉️ **Kontaktný blok** - `mailto:` odkaz a externý odkaz na status page; ak nie sú vyplnené, pätička ich vynechá.
- 🛡️ **Escapovanie výstupu** - všetok dynamický obsah prechádza cez `esc()` s `htmlspecialchars(ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')`.
- 🕒 **Reálny čas poslednej zmeny** - „Last updated" sa berie z `filemtime()` súboru `services.json`, časové pásmo je pevne UTC.
- 💎 **Premium dizajn** - CSS custom properties, tri animované rozostrené orby, mriežkový overlay, gradientový text, shimmer na progress bare a rotujúci conic-gradient prstenec okolo ikony.
- 📱 **Responzívny layout** - breakpoint na 640px preskladá riadky služieb, timeline aj pätičku pod seba; breakpoint na 380px už len zmenší nadpis a bloky odpočtu.

---

## 🚀 Rýchly štart

Projekt nemá package manager, závislosti ani build krok. Stačí PHP interpreter (bez databázy, bez rozšírení nad rámec jadra).

### Lokálny náhľad

```bash
cd files
php -S 127.0.0.1:8000
```

Otvorte `http://127.0.0.1:8000/`.

Overenie hlavičiek:

```bash
curl -i http://127.0.0.1:8000/
```

> [!NOTE]
> Vstavaný PHP server vráti `HTTP/1.1 503 Service Unavailable` - to je zámer, nie chyba. Prehliadač telo stránky napriek tomu vykreslí normálne.

### Nasadenie na server

1. Skopírujte `index.php`, `services.json` a `styles.css` do document rootu, ktorý vie spúšťať PHP (Apache + PHP-FPM, nginx + PHP-FPM, LiteSpeed, bežný shared hosting).
2. Pridajte vlastné rewrite / redirect pravidlo, ktoré počas odstávky nasmeruje všetku prevádzku na tento `index.php`.
3. Upravte `services.json` a načítajte stránku znova - reštart ani mazanie cache nie je potrebné.

> [!IMPORTANT]
> Repozitár neobsahuje `.htaccess`, nginx snippet ani deploy skript. Samotné nakopírovanie súborov web do maintenance režimu neprepne - presmerovanie prevádzky si musíte napísať sami.

---

## 📂 Štruktúra projektu

```text
maintenance-website/
├── index.php               # PHP verzia (274 riadkov): defaulty, načítanie JSON,
│                           # esc()/badgeModifier(), 503 hlavičky, HTML šablóna, inline JS
├── index.html              # statická verzia: rovnaká stránka, JSON sa načíta v prehliadači
├── services.json           # jediný konfiguračný súbor, číta ho PHP aj statická verzia
├── styles.css              # 720 riadkov témy: tokeny, pozadie, karty, badge, 6x @keyframes
├── LICENSE                 # plný text GNU GPL-3.0
├── README.md               # tento súbor
└── README.en.md            # anglická verzia
```

> [!TIP]
> Sú tu **dva vstupné body, ktoré vykresľujú tú istú stránku**. `index.php` renderuje na
> serveri a posiela hlavičky `503` + `Retry-After` - to je verzia pre skutočnú odstávku.
> `index.html` je statická verzia: `services.json` si načíta v prehliadači cez `fetch`,
> takže funguje aj na hostingu bez PHP (GitHub Pages). Statická verzia **nevie** poslať
> stavový kód `503`. `styles.css` je linkovaný relatívne, takže musí zostať vedľa nich.

---

## ⚙️ Konfigurácia

Všetko sa nastavuje v `services.json`.

| Kľúč                   | Typ    | Efekt                                                                                                          |
| ---------------------- | ------ | -------------------------------------------------------------------------------------------------------------- |
| `headline`             | string | Text `<h1>`, `<title>` aj `og:title`                                                                            |
| `tagline`              | string | Podnadpis, meta description a `og:description`                                                                  |
| `status_label`         | string | Text v pulzujúcom červenom pill-e                                                                               |
| `countdown_target`     | string | Dátum parsovateľný cez JS `new Date()` (napr. `2026-07-20T18:00:00Z`); prázdna hodnota odpočet skryje            |
| `progress_percent`     | int    | Pretypuje sa na int a oreže do 0-100; `0` skryje progress bar                                                    |
| `auto_refresh_seconds` | int    | Interval automatického reloadu, serverovo minimálne 60                                                          |
| `contact_email`        | string | Vykreslí sa ako `mailto:` odkaz                                                                                 |
| `contact_url`          | string | Odkaz „Status Page" s `target="_blank" rel="noopener"`                                                          |
| `services[]`           | array  | Objekty `{name, description, status}`                                                                           |
| `next_steps[]`         | array  | Objekty `{action, eta}`                                                                                         |

### Stavy služieb

Text badge-u je vždy hodnota `status` prevedená na veľké písmená - PHP ju posiela cez `strtoupper()` a CSS na `.service-badge` navyše aplikuje `text-transform: uppercase`. Farbu určuje funkcia `badgeModifier()`, ktorá porovnáva `strtolower($status)`.

| Hodnota `status` | Badge                                                | Farba                        |
| ---------------- | ---------------------------------------------------- | ---------------------------- |
| `outage`         | OUTAGE                                               | červená                      |
| `degraded`       | DEGRADED                                             | jantárová                    |
| `operational`    | OPERATIONAL                                          | zelená                       |
| čokoľvek iné     | hodnota prevedená na veľké písmená (`planned` → PLANNED) | šedá (fallback `unknown`) |

Chýbajúce hodnoty majú fallbacky: `name` → `Unnamed Service`, `description` → `No description provided.`, `status` → `UNKNOWN`, `action` → `Pending`, `eta` → `TBD`.

### Ukážkový `services.json`

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

### Čo sa cez JSON nastaviť nedá

| Vec                                      | Kde sa mení                                        |
| ---------------------------------------- | -------------------------------------------------- |
| Časové pásmo (natvrdo UTC)               | `date_default_timezone_set('UTC')` v `index.php`   |
| Hodnota `Retry-After: 3600`              | `header(...)` v `index.php`                        |
| Ospravedlňujúci odstavec a text pätičky  | literály v HTML šablóne `index.php`                |
| Farebná schéma a celý vzhľad             | CSS custom properties v `styles.css`               |

---

## 🌐 HTTP hlavičky

| Hlavička         | Hodnota                                | Prečo                                                                       |
| ---------------- | -------------------------------------- | --------------------------------------------------------------------------- |
| Status           | `503 Service Unavailable`              | Crawler ani monitoring stránku nevyhodnotí ako platný obsah                 |
| `Retry-After`    | `3600`                                 | Odporúčaný interval ďalšieho pokusu v sekundách                             |
| `Cache-Control`  | `no-cache, no-store, must-revalidate`   | Zabráni tomu, aby maintenance stránka zostala v cache po obnove služby      |
| `<meta robots>`  | `noindex, nofollow`                    | Poistka proti indexácii                                                     |

---

## 🎨 Dizajn a technológie

| Vrstva     | Riešenie                                                                              |
| ---------- | -------------------------------------------------------------------------------------- |
| Backend    | PHP bez frameworku; nepoužíva žiadnu syntax novšiu ako PHP 7.0 (kvôli operátoru `??`)  |
| Šablóna    | Server-rendered HTML5 priamo v `index.php`                                             |
| Štýly      | Vanilla CSS, 720 riadkov, 6 `@keyframes`, 2 media queries, žiadny preprocesor           |
| Skripty    | Inline vanilla JS v IIFE, žiadne knižnice                                              |
| Dáta       | JSON súbor, žiadna databáza                                                            |
| Typografia | Inter z Google Fonts, fallback `system-ui` / Segoe UI / Roboto                          |
| Ikony      | Inline Heroicons SVG cesty                                                             |

Žiadny `composer.json`, `package.json`, lockfile ani `vendor/` adresár - jediná externá sieťová závislosť je stylesheet Google Fonts. Bez internetu stránka funguje ďalej so systémovým fontom.

---

## ⚠️ Známe obmedzenia

> [!WARNING]
> **`services.json` je verejne čitateľný.** Leží vedľa `index.php` v document roote a webserver ho servíruje ako statický súbor na `/services.json` (HTTP 200). Nedávajte doň interné názvy systémov, detaily incidentu ani firemné e-maily, alebo cestu zablokujte na úrovni webservera.

> [!CAUTION]
> **Reload loop pri prešlom odpočte.** `updateCountdown()` sa spúšťa hneď po načítaní a pri `diff <= 0` volá `location.reload()`. Ak `countdown_target` ukazuje do minulosti a zostane vyplnený, každé načítanie okamžite vyvolá ďalšie - nekonečné obnovovanie pre všetkých návštevníkov, kým hodnotu nezmeníte alebo nevymažete.

- 🔀 **Bez routovacieho pravidla to nefunguje** - repozitár neobsahuje `.htaccess`, nginx konfiguráciu ani deploy skript.
- 🔗 **`contact_url` sa nevaliduje na schému** - je HTML-escapované, ale hodnota `javascript:` alebo `data:` sa stane klikateľným odkazom. `services.json` preto považujte za dôveryhodný vstup a nikdy ho nenechajte editovať cez upload formulár.
- 🕐 **Timestamp sa viaže na mtime súboru** - deploy metóda, ktorá súbor prepíše (git checkout, rsync, rebuild kontajnera), posunie „Last updated" aj keď sa na incidente nič nezmenilo. Časy sú vždy v UTC.
- 📈 **Auto-refresh generuje vlastnú záťaž** - `auto_refresh_seconds` má dolnú hranicu 60, ale žiadny strop. Počas reálneho výpadku každý otvorený prehliadač v tomto intervale búši na už tak preťažený origin.
- 🎨 **Iba prvé tri body timeline majú vlastnú farbu** - CSS pravidlá sú `nth-child(2)` a `nth-child(3)`; štvrtý a ďalší krok dostane predvolený fialový bod.
- 🧊 **Dizajn stojí na `backdrop-filter` a `mask-composite`** - v prehliadačoch bez ich podpory sa sklenené karty vykreslia ako ploché priesvitné panely a prstenec okolo ikony ako plný disk. Obsah zostáva čitateľný.
- 🧪 **Žiadne testy, linting, CI ani logovanie** - chyby čítania JSON sú potlačené cez `@` a tichý fallback na defaulty, takže poškodený `services.json` sa prejaví len generickou stránkou bez akéhokoľvek upozornenia.

---

## 📄 Licencia

Projekt obsahuje súbor `LICENSE` s úplným textom **GNU General Public License v3 (29. jún 2007)**.

GPL-3.0 je copyleft licencia - ak distribuujete upravenú verziu, musíte ju uvoľniť opäť pod GPL-3.0. Text licencie je nezmenená FSF šablóna a nemá vyplneného držiteľa autorských práv ani rok; žiadny zdrojový súbor nenesie GPL hlavičku.

---

<div align="center">

Vytvoril **Alex Poliak** - [GitHub](https://github.com/Apoliak7777) - [alexpoliak21@gmail.com](mailto:alexpoliak21@gmail.com)

</div>
