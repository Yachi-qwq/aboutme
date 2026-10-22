import { openLoginDemo } from "./login-demo.js";

const form = document.querySelector("#terminal-form");
const input = document.querySelector("#command-input");
const output = document.querySelector("#terminal-output");
const suggestions = document.querySelector("#command-suggestions");
const cryptoPanel = document.querySelector("#crypto-panel");
const cryptoInput = document.querySelector("#crypto-input");
const cryptoOutput = document.querySelector("#crypto-output");
const cryptoKeyContainer = document.querySelector("#crypto-key-container");
const cryptoKey = document.querySelector("#crypto-key");
const cryptoKeyLabel = document.querySelector("#crypto-key-label");
const cryptoXorKeyContainer = document.querySelector("#crypto-xor-key-container");
const cryptoXorKey = document.querySelector("#crypto-xor-key");
const cryptoTextInputContainer = document.querySelector("#crypto-text-input-container");
const cryptoInputLabel = document.querySelector("#crypto-input-label");
const cryptoMetrics = document.querySelector("#crypto-metrics");
const cryptoDetails = document.querySelector("#crypto-details");
const cryptoCode = document.querySelector("#crypto-code code");
const cryptoAlgorithm = document.querySelector("#crypto-algorithm");
const cryptoDescription = document.querySelector("#crypto-description");
const cryptoStatus = document.querySelector("#crypto-status");
const closeCrypto = document.querySelector("#close-crypto");
const pageFooter = document.querySelector("#page-footer");
const footerAttribution = document.querySelector(".footer-attribution");
const watPopup = document.querySelector("#wat-popup");
const watSource = document.querySelector("#wat-source");

let cryptoTimer;
let cryptoRequestId = 0;
let pythonRuntimePromise;
let cryptographyPackagePromise;
let watSourcePromise;

const pyodideBaseUrl = "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/";

async function showWatPopup() {
  watPopup.hidden = false;
  pageFooter.setAttribute("aria-expanded", "true");

  if (!watSourcePromise) {
    watSourcePromise = fetch(new URL("justflex.wat", document.baseURI))
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Could not load justflex.wat (${response.status}).`);
        }
        return response.text();
      })
      .catch((error) => {
        watSourcePromise = undefined;
        throw error;
      });
  }

  try {
    watSource.textContent = await watSourcePromise;
  } catch (error) {
    watSource.textContent = `Could not load the WebAssembly source: ${error.message}`;
    console.error("WebAssembly source loading failed.", error);
  }
}

function hideWatPopup() {
  watPopup.hidden = true;
  pageFooter.setAttribute("aria-expanded", "false");
}

const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)");
if (supportsHover.matches) {
  footerAttribution.addEventListener("pointerenter", showWatPopup);
  footerAttribution.addEventListener("pointerleave", hideWatPopup);
}

pageFooter.addEventListener("click", () => {
  if (watPopup.hidden) {
    showWatPopup();
  } else {
    hideWatPopup();
  }
});

document.addEventListener("pointerdown", (event) => {
  if (!event.target.closest(".footer-attribution")) {
    hideWatPopup();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") hideWatPopup();
});

const pythonFiles = {
  caesar: "crypto/cesar.py",
  sha256: "crypto/sha256.py",
  "rsa-signature": "crypto/rsa_signature.py",
  "one-time-pad": "crypto/one_time_pad.py",
  xor: "crypto/XOR.py",
  "diffie-hellman": "crypto/diffie_hellman.py"
};

const cryptoDescriptions = {
  caesar:
    "A Caesar cipher shifts each ASCII letter by a fixed number of places. It is easy to understand, but it is not secure encryption.",
  sha256:
    "SHA-256 creates a one-way fingerprint of the input. It is a hash, not encryption, so it cannot be decrypted back into the original text.",
  "rsa-signature":
    "RSA-PSS signs the input with a temporary private key. The cryptography package supplies audited RSA primitives; this file demonstrates key setup, signing, and verification. A signature is not encryption.",
  "one-time-pad":
    "A one-time pad XORs each UTF-8 message byte with an equally long, cryptographically random key. The key must remain secret and never be reused. This demo reveals its key and is for learning only; an LCG is predictable and must not be used for a real OTP.",
  xor:
    "Repeating-key XOR combines UTF-8 bytes with a repeating key using XOR. It demonstrates bitwise operations, but key reuse exposes patterns and is not secure encryption.",
  "diffie-hellman":
    "Diffie-Hellman lets two parties derive the same shared value over a public channel. This demo uses the RFC 3526 2048-bit group; it does not encrypt or authenticate messages, and the exchange is unauthenticated."
};

const pythonSourceCache = new Map();

const commands = {
  help: () =>
    `Available commands:
  help             Show this list
  about            Learn about Yachi
  site-stats       Show aggregated website views
  browser-info     Show browser-visible data; add "location" for opt-in GPS
  crypto-demo      Open the encryption demo
  login-demo       Open an in-memory login demonstration
  projects         Show project information
  clear / cls      Clear the terminal`,
  about: () =>
    "I'm Yachi, a hobby developer from Austria and a trained electrician specializing in plant and operations technology. I'm interested in encryption, algorithms, backend development, server structures, and mobile app development. Fun fact: I'm also a certified paramedic.",
  "site-stats": () => getSiteStats(),
  "crypto-demo": () => {
    cryptoPanel.hidden = false;
    cryptoInput.focus();
    return "Encryption demo opened below. Choose an operation and enter text.";
  },
  "login-demo": () => {
    void openLoginDemo();
    return "Local login demonstration opened. Do not enter real credentials.";
  },
  "browser-info": () => getBrowserInfo(),
  projects: () => 
    {
    writeLine("Check out some of my GitHub projects :)");
    writeProjectLink(
      "Live-Camera-Recognition",
      "https://github.com/Yachi-qwq/Live-Camera-Recognition"
    );
    writeProjectLink("Lap-App", "https://github.com/Yachi-qwq/Lap-App");
  }
};

async function getBrowserInfo() {
  const userAgent = navigator.userAgent || "Not provided by this browser";
  const languages = navigator.languages?.join(", ") || navigator.language || "Not provided";
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Not available";
  const screenInfo = window.screen
    ? `${screen.width} × ${screen.height} CSS px (about ${Math.round(screen.width * (window.devicePixelRatio || 1))} × ${Math.round(screen.height * (window.devicePixelRatio || 1))} device px), ${screen.colorDepth}-bit color`
    : "Not available";
  const viewportInfo = `${window.innerWidth} × ${window.innerHeight} CSS px`;
  const pixelRatio = window.devicePixelRatio || "not reported";
  const orientation = window.screen?.orientation?.type || "not reported";
  const touchPoints = navigator.maxTouchPoints ?? 0;
  const cpuCores = navigator.hardwareConcurrency
    ? `about ${navigator.hardwareConcurrency} logical cores`
    : "not reported";
  const memory = navigator.deviceMemory
    ? `about ${navigator.deviceMemory} GB (rounded browser estimate)`
    : "not exposed by this browser";
  const deviceType = navigator.userAgentData
    ? navigator.userAgentData.mobile ? "mobile device" : "non-mobile device"
    : /Mobi|Android|iPhone|iPad|Tablet/i.test(userAgent)
      ? "mobile / tablet (inferred from User-Agent)"
      : "not reported";
  let browserBrands = navigator.userAgentData?.brands
    ?.map(({ brand, version }) => `${brand} ${version}`)
    .join(", ") || "not separately exposed";
  let deviceModel = navigator.userAgentData?.model || "not exposed";
  let platformDetails = navigator.userAgentData
    ? `${navigator.userAgentData.platform}${navigator.userAgentData.platformVersion ? ` ${navigator.userAgentData.platformVersion}` : ""}`
    : navigator.platform || "not reported";
  let cpuArchitecture = "not exposed";
  let cpuBitness = "not exposed";

  if (navigator.userAgentData?.getHighEntropyValues) {
    try {
      const details = await navigator.userAgentData.getHighEntropyValues([
        "architecture",
        "bitness",
        "fullVersionList",
        "model",
        "platformVersion"
      ]);
      browserBrands = details.fullVersionList
        ?.map(({ brand, version }) => `${brand} ${version}`)
        .join(", ") || browserBrands;
      deviceModel = details.model || deviceModel;
      platformDetails = [
        navigator.userAgentData.platform,
        details.platformVersion
      ].filter(Boolean).join(" ") || platformDetails;
      cpuArchitecture = details.architecture || cpuArchitecture;
      cpuBitness = details.bitness ? `${details.bitness}-bit` : cpuBitness;
    } catch (error) {
      deviceModel = `not disclosed (${error.message})`;
    }
  }

  let localStorageStatus = "unavailable";

  try {
    const testKey = `browser-info-test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    localStorageStatus = "available";
  } catch {
    localStorageStatus = "blocked or unavailable";
  }

  let adBlockerStatus = "not tested";
  const adProbe = document.createElement("div");
  adProbe.className = "adsbox";
  adProbe.setAttribute("aria-hidden", "true");
  Object.assign(adProbe.style, {
    position: "absolute",
    left: "-10000px",
    top: "-10000px",
    width: "10px",
    height: "10px"
  });
  document.body.append(adProbe);
  adBlockerStatus = adProbe.offsetHeight === 0
    ? "possibly detected (heuristic)"
    : "not detected";
  adProbe.remove();

  let gpuInfo = "not exposed";
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl") || canvas.getContext("webgl2");
  if (gl) {
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : gl.getParameter(gl.RENDERER);
    gpuInfo = renderer || "browser did not provide a renderer";
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }

  return `╭─ BROWSER ──────────────────────────────────────
│ Browser:      ${browserBrands}
│ User-Agent:   ${userAgent}
│ Operating system: ${platformDetails}
│ Device:       ${deviceType}${deviceModel !== "not exposed" ? ` — ${deviceModel}` : ""}
│ Language(s):  ${languages}
│ Time zone:    ${timeZone}
│ Cookies:      ${navigator.cookieEnabled ? "enabled" : "disabled"}
│ LocalStorage: ${localStorageStatus}
│ Ad blocker:   ${adBlockerStatus}
│
├─ SCREEN & INPUT ────────────────────────────────
│ Display:      ${screenInfo}
│ Viewport:     ${viewportInfo}
│ Pixel ratio:  ${pixelRatio}
│ Orientation:  ${orientation}
│ Touch points: ${touchPoints}
│
├─ HARDWARE (browser estimates) ──────────────────
│ CPU:          ${cpuCores}
│ Architecture: ${cpuArchitecture}${cpuBitness !== "not exposed" ? `, ${cpuBitness}` : ""}
│ Memory:       ${memory}
│ GPU:          ${gpuInfo}
│
├─ NETWORK & LOCATION ───────────────────────────
│ IP / GeoIP:   not readable by page JavaScript. The host may receive your IP; GeoIP is an estimate.
│ Exact GPS:    not requested. Run "browser-info location" for an optional, one-time browser prompt.
╰─────────────────────────────────────────────────
All values stay on this page. Browsers may hide, round, or alter hardware details;`;
}

async function getSiteStats() {
  const response = await fetch(new URL("logs/site-stats.json", document.baseURI), {
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error(`Statistics file unavailable (${response.status}).`);
  }

  const stats = await response.json();
  if (
    stats.status !== "ready" ||
    !stats.daily_views ||
    !stats.monthly_views ||
    !stats.yearly_views ||
    !Number.isSafeInteger(stats.total_views)
  ) {
    return [
      "╭─ SITE STATISTICS ──────────────────────────────",
      "│ Aggregated view data is not available yet.",
      "│ Configure GoatCounter and run the Pages workflow.",
      "╰────────────────────────────────────────────────",
      "Statistics are stored as daily totals; no IP addresses or visitor-level logs are published."
    ].join("\n");
  }

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const currentMonth = today.slice(0, 7);
  const currentYear = today.slice(0, 4);
  const recentDays = Object.entries(stats.daily_views)
    .sort(([left], [right]) => right.localeCompare(left))
    .slice(0, 7)
    .reverse();
  const recentMonths = Object.entries(stats.monthly_views)
    .sort(([left], [right]) => right.localeCompare(left))
    .slice(0, 6)
    .reverse();
  const recentYears = Object.entries(stats.yearly_views)
    .sort(([left], [right]) => right.localeCompare(left))
    .slice(0, 5)
    .reverse();
  const listLines = (entries) => entries.length
    ? entries.map(([period, views]) => `│ ${period.padEnd(12)} ${views} views`)
    : ["│ No recorded views yet."];

  return [
    "╭─ GLOBAL SITE STATISTICS (UTC) ─────────────────",
    `│ Today:        ${stats.daily_views[today] ?? 0} views`,
    `│ This month:   ${stats.monthly_views[currentMonth] ?? 0} views`,
    `│ This year:    ${stats.yearly_views[currentYear] ?? 0} views`,
    `│ All time:     ${stats.total_views} views`,
    "├─ LAST 7 DAYS ─────────────────────────────────",
    ...listLines(recentDays),
    "├─ RECENT MONTHS ────────────────────────────────",
    ...listLines(recentMonths),
    "├─ RECENT YEARS ─────────────────────────────────",
    ...listLines(recentYears),
    "╰────────────────────────────────────────────────",
    `Updated: ${stats.generated_at || "not available"}`,
    "Aggregated counts only; the project JSON contains no IP addresses or individual visit records."
  ].join("\n");
}

function requestPreciseLocation() {
  if (!navigator.geolocation) {
    writeLine("Geolocation is not available in this browser.");
    return;
  }

  if (!window.isSecureContext) {
    writeLine("Location access requires a secure context (HTTPS or localhost).");
    return;
  }

  writeLine("Requesting your browser's permission for a one-time location reading...");
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      writeLine(
        `Location (not stored or sent): ${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)} (accuracy ±${Math.round(coords.accuracy)} m)`
      );
    },
    (error) => {
      if (error.code === 1) {
        writeLine("Location permission was denied.");
      } else if (error.code === 2) {
        writeLine("Your device could not determine a location.");
      } else if (error.code === 3) {
        writeLine("The location request timed out.");
      } else {
        writeLine(`Could not get location: ${error.message}`);
      }
    },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
  );
}

function writeLine(text) {
  const line = document.createElement("pre");
  line.textContent = text;
  output.append(line);
}

function writeCommand(command) {
  const line = document.createElement("pre");
  line.className = "terminal-command";
  const prompt = document.createElement("strong");
  prompt.textContent = "yachi@web:~$ ";
  line.append(prompt, document.createTextNode(command));
  output.append(line);
}

function writeProjectLink(name, url) {
  const line = document.createElement("pre");
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = `### [${name}]`;
  line.append(link);
  output.append(line);
}

function getSuggestion(value) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const command = trimmed.toLowerCase();
  return Object.keys(commands).find(
    (name) => name.startsWith(command) && name !== command
  ) ?? null;
}

function updateSuggestions() {
  suggestions.replaceChildren();
  const suggestion = getSuggestion(input.value);
  suggestions.hidden = !suggestion;
  if (!suggestion) return;

  const button = document.createElement("button");
  button.type = "button";
  button.role = "option";
  button.textContent = suggestion;
  button.addEventListener("click", () => {
    input.value = suggestion;
    suggestions.hidden = true;
    input.focus();
  });
  suggestions.append(button);
}

input.addEventListener("input", updateSuggestions);

input.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  const suggestion = getSuggestion(input.value);
  if (!suggestion) return;

  event.preventDefault();
  input.value = suggestion;
  suggestions.hidden = true;
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const submittedValue = input.value;
  const rawCommand = submittedValue.trim();
  if (!rawCommand) return;

  const normalizedCommand = rawCommand.toLowerCase();
  if (normalizedCommand === "clear" || normalizedCommand === "cls") {
    output.replaceChildren();
    input.value = "";
    suggestions.hidden = true;
    return;
  }

  const command = Object.keys(commands)
    .sort((a, b) => b.length - a.length)
    .find((name) =>
      normalizedCommand === name || normalizedCommand.startsWith(`${name} `)
    );
  const [name] = rawCommand.split(/\s+/);

  writeCommand(rawCommand);
  if (command === "browser-info" && normalizedCommand === "browser-info location") {
    requestPreciseLocation();
  } else if (command === "browser-info") {
    commands[command]()
      .then(writeLine)
      .catch((error) => {
        writeLine(`Could not read browser information: ${error.message}`);
        console.error("Browser information collection failed.", error);
      });
  } else if (command === "projects") {
    commands[command]();
  } else if (command === "site-stats") {
    commands[command]()
      .then(writeLine)
      .catch((error) => {
        writeLine(`Could not load site statistics: ${error.message}`);
        console.error("Aggregated site statistics could not be loaded.", error);
      });
  } else if (command) {
    writeLine(commands[command]());
  } else {
    writeLine(`Command not found: ${name}. Type "help" to see available commands.`);
  }

  input.value = "";
  suggestions.hidden = true;
});

function updateCryptoDescription() {
  const algorithm = cryptoAlgorithm.value;
  cryptoDescription.textContent =
    cryptoDescriptions[algorithm] ?? "Select an operation to see its explanation.";
  const isDiffieHellman = algorithm === "diffie-hellman";
  const isXor = algorithm === "xor";
  const isOneTimePad = algorithm === "one-time-pad";
  cryptoTextInputContainer.hidden = isDiffieHellman;
  cryptoXorKeyContainer.hidden = !isXor;
  cryptoKeyContainer.hidden = !isOneTimePad;
  cryptoInputLabel.textContent = isXor ? "Text to XOR" : "Text to process";
  cryptoKeyLabel.textContent = "One-time pad key (Base64)";
  if (isDiffieHellman) {
    cryptoStatus.textContent = "Ready to generate ephemeral keys and run the exchange.";
  }
}

cryptoInput.addEventListener("input", () => {
  scheduleCryptoRequest();
});

cryptoXorKey.addEventListener("input", scheduleCryptoRequest);

cryptoAlgorithm.addEventListener("change", () => {
  updateCryptoDescription();
  scheduleCryptoRequest();
});

updateCryptoDescription();

closeCrypto.addEventListener("click", () => {
  window.clearTimeout(cryptoTimer);
  cryptoRequestId += 1;
  cryptoPanel.hidden = true;
  input.focus();
});

function scheduleCryptoRequest() {
  window.clearTimeout(cryptoTimer);
  const requestId = ++cryptoRequestId;
  const text = cryptoInput.value;

  if (!text) {
    if (cryptoAlgorithm.value === "diffie-hellman") {
      cryptoOutput.textContent = "Computing key exchange...";
      cryptoMetrics.textContent = "";
      cryptoDetails.textContent = "";
      cryptoCode.textContent = `Loading ${pythonFiles[cryptoAlgorithm.value]}...`;
      cryptoStatus.textContent = `Loading ${pythonFiles[cryptoAlgorithm.value]} and running it in browser Python...`;
      cryptoTimer = window.setTimeout(() => {
        runPythonProgram("", cryptoAlgorithm.value, cryptoXorKey.value, requestId);
      }, 300);
      return;
    }

    cryptoOutput.textContent = "";
    cryptoKey.textContent = "";
    cryptoMetrics.textContent = "";
    cryptoDetails.textContent = "";
    cryptoKeyContainer.hidden = cryptoAlgorithm.value !== "one-time-pad";
    cryptoStatus.textContent = "Waiting for input...";
    cryptoCode.textContent = "Waiting for input...";
    return;
  }

  if (cryptoAlgorithm.value === "xor" && !cryptoXorKey.value) {
    cryptoOutput.textContent = "";
    cryptoMetrics.textContent = "";
    cryptoDetails.textContent = "";
    cryptoStatus.textContent = "Enter a non-empty XOR key to run this demonstration.";
    cryptoCode.textContent = "Enter a key to run crypto/XOR.py.";
    return;
  }

  cryptoOutput.textContent = "Processing...";
  cryptoMetrics.textContent = "";
  cryptoDetails.textContent = "";
  cryptoKey.textContent = "";
  cryptoKeyContainer.hidden = cryptoAlgorithm.value !== "one-time-pad";
  const algorithm = cryptoAlgorithm.value;
  const xorKey = cryptoXorKey.value;
  cryptoStatus.textContent = `Loading ${pythonFiles[algorithm]} and running it in browser Python...`;
  cryptoCode.textContent = `Loading ${pythonFiles[algorithm]}...`;
  cryptoTimer = window.setTimeout(() => {
    runPythonProgram(text, algorithm, xorKey, requestId);
  }, 300);
}

async function getPythonRuntime() {
  if (!pythonRuntimePromise) {
    pythonRuntimePromise = (async () => {
      const { loadPyodide } = await import(`${pyodideBaseUrl}pyodide.mjs`);
      return loadPyodide({ indexURL: pyodideBaseUrl });
    })().catch((error) => {
      pythonRuntimePromise = undefined;
      throw error;
    });
  }

  return pythonRuntimePromise;
}

async function loadPythonSource(algorithm) {
  const filePath = pythonFiles[algorithm];
  if (!filePath) {
    throw new Error("The selected Python file is not configured.");
  }

  if (!pythonSourceCache.has(algorithm)) {
    const fileUrl = new URL(filePath, document.baseURI);
    const sourcePromise = fetch(fileUrl).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Could not load ${filePath} (${response.status}).`);
      }
      return response.text();
    });
    pythonSourceCache.set(algorithm, sourcePromise);
  }

  try {
    return await pythonSourceCache.get(algorithm);
  } catch (error) {
    pythonSourceCache.delete(algorithm);
    throw error;
  }
}

async function runPythonProgram(text, algorithm, xorKey, requestId) {
  try {
    const runArguments = algorithm === "diffie-hellman"
      ? ""
      : algorithm === "xor"
        ? `${JSON.stringify(text)}, ${JSON.stringify(xorKey)}`
        : JSON.stringify(text);
    const sourcePromise = loadPythonSource(algorithm);
    const runtimePromise = getPythonRuntime();
    const source = await sourcePromise;
    const program =
      `${source}\n\nimport json\n\n` +
      `json.dumps(run(${runArguments}))`;
    if (requestId === cryptoRequestId) {
      cryptoCode.textContent = program;
    }
    const runtime = await runtimePromise;
    if (requestId !== cryptoRequestId) return;

    if (algorithm === "rsa-signature") {
      if (!cryptographyPackagePromise) {
        cryptographyPackagePromise = runtime.loadPackage("cryptography").catch((error) => {
          cryptographyPackagePromise = undefined;
          throw error;
        });
      }
      await cryptographyPackagePromise;
      if (requestId !== cryptoRequestId) return;
    }

    const resultJson = await runtime.runPythonAsync(program);
    if (requestId !== cryptoRequestId) return;

    const result = JSON.parse(resultJson);
    cryptoOutput.textContent = result.output;
    cryptoMetrics.textContent =
      `${result.algorithm} | Execution time: ${result.execution_time_ms}`;
    cryptoDetails.textContent = result.details.join("\n");
    cryptoKey.textContent = result.key ?? "";
    cryptoKeyContainer.hidden = algorithm !== "one-time-pad";
    cryptoStatus.textContent = result.note;
  } catch (error) {
    if (requestId !== cryptoRequestId) return;

    cryptoOutput.textContent = "";
    cryptoKey.textContent = "";
    cryptoMetrics.textContent = "";
    cryptoDetails.textContent = "";
    cryptoStatus.textContent = `Could not run Python in your browser: ${error.message}`;
  }
}
