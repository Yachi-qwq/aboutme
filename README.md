# Yachi — Retro Web Terminal

A personal portfolio presented as a retro-style terminal. The site combines a
static HTML/CSS interface, an interactive JavaScript command line, browser
information tools, and educational Python cryptography demonstrations that run
in the browser.

**Live site:** [Yachi Web Terminal](https://yachi-qwq.github.io/)

> The site is a learning and portfolio project. Its cryptography and login
> examples are demonstrations only, not production security tools.

## Contents

- [Features](#features)
- [Terminal commands](#terminal-commands)
- [Cryptography demonstrations](#cryptography-demonstrations)
- [Local login demonstration](#local-login-demonstration)
- [Site statistics and privacy](#site-statistics-and-privacy)
- [Technology and architecture](#technology-and-architecture)
- [Run locally](#run-locally)
- [Deploy to GitHub Pages](#deploy-to-github-pages)
- [Repository layout](#repository-layout)
- [Limitations and security notes](#limitations-and-security-notes)

## Features

- Responsive, green-on-black terminal-inspired portfolio.
- Interactive command input with command suggestions, bold prompts, and
  `clear` / `cls` support.
- Short biography, skills overview, GitHub language-statistics image, and
  direct project links:
  - [Live-Camera-Recognition](https://github.com/Yachi-qwq/Live-Camera-Recognition)
  - [Lap-App](https://github.com/Yachi-qwq/Lap-App)
- Browser information display for values exposed by the current browser,
  including user agent, platform, language, time zone, screen size, selected
  hardware estimates, and WebGL renderer when available.
- Optional one-time location request through the browser's permission prompt.
- In-page cryptography playground with Python source and step-by-step results.
- In-memory login simulation that demonstrates password hashing without
  creating a real account or contacting a server.
- GoatCounter page-view tracking and an aggregated statistics display in the
  terminal.
- Footer interaction that reveals the `justflex.wat` source.

## Terminal commands

Enter `help` in the terminal to see the available commands.

| Command | Description |
| --- | --- |
| `help` | List available commands. |
| `about` | Display a short biography. |
| `projects` | Show links to selected GitHub projects. |
| `browser-info` | Display information the browser makes available to this page. |
| `browser-info location` | Ask the browser for a one-time device location. |
| `crypto-demo` | Open the cryptography playground. |
| `login-demo` | Open the local-only login and password-hashing simulation. |
| `site-stats` | Display globally aggregated GoatCounter page-view counts. |
| `clear` / `cls` | Clear the terminal output. |

The location command requires HTTPS or localhost and an explicit browser
permission grant. The coordinates are printed in the terminal only; this
command does not send or save them.

`browser-info` also does not save its results. Browser APIs may hide, reduce,
or change details such as device model, CPU architecture, memory, and GPU
renderer. A detected ad blocker is only a heuristic, not a definitive test.

## Cryptography demonstrations

Open the playground with `crypto-demo`, choose an operation, and enter sample
input. The output includes an explanation, execution timing, and the relevant
Python source. Do not enter sensitive data: the operations run in your browser,
but the examples are educational and some deliberately display keys or
intermediate values.

| Demo | Implementation | Important caveat |
| --- | --- | --- |
| Caesar cipher | Fixed shift of three for ASCII letters. | Easily broken; not secure encryption. |
| SHA-256 | Educational implementation using 32-bit operations and compression rounds. | A hash is one-way, not encryption; use a vetted library in real applications. |
| RSA signature | RSA-2048 with PSS padding and SHA-256 using the `cryptography` package. | Creates and verifies a signature; it does not encrypt. The temporary private key is discarded. |
| One-time pad | UTF-8 bytes XORed with a same-length key from Python's `secrets` module. | The demo reveals the key. A real pad must be secret, truly random, equal in length to the message, and never reused. |
| Repeating-key XOR | UTF-8 bytes XORed with a repeating user-provided key. | Repeated patterns leak information; not secure encryption. |
| Diffie–Hellman | Ephemeral values using RFC 3526 2048-bit MODP group 14. | Establishes a shared value but does not authenticate peers; vulnerable to man-in-the-middle attacks without authentication. |

The browser downloads the Pyodide runtime from jsDelivr on first use. The RSA
demo also downloads the Pyodide `cryptography` package when selected. The
application loads the selected Python source from the `crypto/` directory and
executes it locally in the browser.

## Local login demonstration

Run `login-demo` to open the account-creation and login UI. It generates a
random salt and derives a 256-bit PBKDF2-HMAC-SHA-256 verifier with 600,000
iterations using the Web Crypto API. The UI displays the salt and verifier as
hexadecimal and shows the implementation from `login-demo.js`.

This is **not authentication**:

- No server is contacted and no account exists outside the current page.
- Demo passwords must be 6–128 characters long.
- The demo account and verifier are held in memory and cleared when the panel
  is closed or the page is unloaded.
- The displayed hash is intentionally visible as a teaching aid.
- Never enter a real username or password.

## Site statistics and privacy

The `site-stats` command reads `logs/site-stats.json` and displays total views,
views for the current UTC day/month/year, recent daily counts, recent monthly
counts, and yearly counts.

### How the statistics are produced

1. The GoatCounter tracker in `index.html` sends page-view counts to the
   configured GoatCounter site (`yachi.goatcounter.com`).
2. The scheduled GitHub Actions workflow runs `logs/update_stats.py` daily at
   **03:17 UTC**. It requests aggregated daily statistics from GoatCounter's
   API; the API token is supplied to the workflow as a secret.
3. Python derives monthly and yearly totals from those daily counts and writes
   the aggregate-only JSON file `logs/site-stats.json`.
4. GitHub Actions commits an updated JSON file when its contents change and
   deploys the site. You can also run the workflow manually to refresh it.

The JSON published with the site contains only date buckets and counts. It
omits dates with zero views and does not contain IP addresses, usernames, or
individual visit records.
GoatCounter states that it does not store IP addresses, but processes them
temporarily in memory to distinguish repeat visits. Depending on the site's
GoatCounter privacy settings, GoatCounter may collect additional aggregate
dimensions such as browser, operating system, location, language, screen size,
or referrer. Disable those options in GoatCounter if only view totals are
desired, and review its current [privacy policy](https://www.goatcounter.com/help/privacy).

GoatCounter may deduplicate repeat visits, so its counts need not equal raw
page reloads. The published JSON is public because it is served with the
static site. It is refreshed daily rather than in real time.


## Technology and architecture

- **HTML** provides the page content, terminal, demos, and accessible form
  controls.
- **CSS** implements the retro palette, responsive layouts, and demo panels.
- **JavaScript modules** (`script.js` and `login-demo.js`) implement the
  command parser, browser API access, Pyodide integration, and login
  simulation.
- **Python** provides the cryptography examples under `crypto/` and the
  statistics aggregation script under `logs/`.
- **Pyodide** executes the cryptography examples in WebAssembly in the browser.
- **Web Crypto API** implements PBKDF2 in the local login simulation.
- **GoatCounter** collects site page views and provides aggregate statistics.
- **GitHub Actions** runs the statistics updater and publishes the static
  website to GitHub Pages.

There is no application server, user database, PHP service, or Firebase
integration. GitHub Pages serves static files only; the statistics updater
runs as a scheduled GitHub Actions job, not on the website host.

## Run locally

Use a local HTTP server rather than opening `index.html` directly. JavaScript
modules, `fetch()`, and browser cryptography features work more consistently
over HTTP, and geolocation requires HTTPS or localhost.

With Python installed, run this from the repository root:

```powershell
python -m http.server 8000
```

Then open <http://localhost:8000/>. No Node.js package installation is needed.
The optional Pyodide runtime and RSA dependency are downloaded on demand.

To test the statistics aggregation independently, the `aggregate_daily_stats`
function in `logs/update_stats.py` accepts GoatCounter daily records and
returns daily, monthly, yearly, and all-time totals. Running the updater
against the live service requires the `GOATCOUNTER_CODE` and
`GOATCOUNTER_API_TOKEN` environment variables; do not commit the token. The
API token is sent using HTTP Basic authentication (empty username, token as
password).

## Repository layout

```text
.
├── .github/
│   └── workflows/
│       └── pages.yml          # Build, update statistics, and deploy Pages
├── crypto/                    # Python cryptography demonstrations
│   ├── cesar.py
│   ├── sha256.py
│   ├── rsa_signature.py
│   ├── one_time_pad.py
│   ├── XOR.py
│   └── diffie_hellman.py
├── logs/
│   ├── site-stats.json        # Public aggregate-only statistics
│   └── update_stats.py        # GoatCounter API client and aggregation
├── index.html                 # Main page and demo markup
├── script.js                 # Terminal and application behavior
├── login-demo.js             # In-memory login/PBKDF2 demonstration
├── styles.css                # Responsive retro terminal styles
├── justflex.wat              # Footer source shown by the footer interaction
└── README.md
```

## Limitations and security notes

- **No real login:** `login-demo` is purely educational and offers no account
  security or server-side identity.
- **No contact backend:** The static site has no private message submission
  service.
- **No global browser-information collection by the terminal:** `browser-info`
  reads values locally for display. The optional location command requires
  permission and does not submit the coordinates.
- **Third-party browser requests:** GoatCounter receives the configured page
  view requests. Pyodide and the RSA dependency are fetched from their CDNs
  when the corresponding cryptography demo is used. The GitHub language
  statistics image is also loaded from an external service.
- **Educational cryptography only:** The examples intentionally expose
  intermediate values and must not be used to protect real data.
- **Statistics are not an audit log:** The terminal shows aggregated
  GoatCounter counts, not verified per-user activity or exact raw requests.
- **Keep secrets server-side:** The GoatCounter API token is used only by
  GitHub Actions and must never be bundled into the public Pages artifact.

For questions or project feedback, open an issue in the
[GitHub repository](https://github.com/Yachi-qwq/Yachi-qwq).
