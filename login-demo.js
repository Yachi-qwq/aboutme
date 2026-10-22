const panel = document.querySelector("#login-demo-panel");
const form = document.querySelector("#login-demo-form");
const usernameInput = document.querySelector("#login-demo-username");
const passwordInput = document.querySelector("#login-demo-password");
const confirmationInput = document.querySelector("#login-demo-confirm");
const confirmationField = document.querySelector("#login-demo-confirm-field");
const codeOutput = document.querySelector("#login-demo-code code");
const statusOutput = document.querySelector("#login-demo-status");
const hashOutput = document.querySelector("#login-demo-hash");
const saltOutput = document.querySelector("#login-demo-salt");
const createTab = document.querySelector("#login-demo-create-tab");
const loginTab = document.querySelector("#login-demo-login-tab");
const submitButton = document.querySelector("#login-demo-submit");
const steps = document.querySelector("#login-demo-steps");
const closeButton = document.querySelector("#close-login-demo");
const terminalInput = document.querySelector("#command-input");

let mode = "create";
let account;
let operationId = 0;
let sourcePromise;

function setStep(step) {
  for (const item of steps.children) {
    item.dataset.active = String(item.dataset.step === step);
  }
}

function setStatus(message, state = "") {
  statusOutput.textContent = message;
  statusOutput.dataset.state = state;
}

function toHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function setMode(nextMode) {
  operationId += 1;
  mode = nextMode;
  const createMode = mode === "create";
  confirmationField.hidden = !createMode;
  confirmationInput.required = createMode;
  confirmationInput.value = "";
  passwordInput.value = "";
  createTab.setAttribute("aria-pressed", String(createMode));
  loginTab.setAttribute("aria-pressed", String(!createMode));
  submitButton.disabled = false;
  passwordInput.autocomplete = createMode ? "new-password" : "current-password";
  submitButton.textContent = createMode ? "Demo-Konto erstellen" : "Demo-Login";
  setStatus(
    createMode
      ? "Erstelle ein Konto nur für diese Demo."
      : account
        ? "Melde dich mit dem eben erstellten Demo-Konto an."
        : "Erstelle zuerst in diesem Seitenaufruf ein Demo-Konto."
  );
  setStep("input");
}

function forgetAccount() {
  if (!account) return;
  account.salt.fill(0);
  account.verifier.fill(0);
  account = undefined;
}

function clearDemo() {
  operationId += 1;
  forgetAccount();
  form.reset();
  hashOutput.textContent = "Noch kein Hash berechnet.";
  saltOutput.textContent = "Wird zufällig erzeugt.";
}

async function derivePassword(password, salt) {
  const passwordBytes = new TextEncoder().encode(password);
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      passwordBytes,
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations: 600000, hash: "SHA-256" },
      key,
      256
    );
    return new Uint8Array(bits);
  } finally {
    passwordBytes.fill(0);
  }
}

function matchesVerifier(candidate, verifier) {
  if (candidate.length !== verifier.length) return false;
  let difference = 0;
  for (let index = 0; index < candidate.length; index += 1) {
    difference |= candidate[index] ^ verifier[index];
  }
  return difference === 0;
}

async function showSourceFile() {
  if (!sourcePromise) {
    sourcePromise = fetch(import.meta.url).then(async (response) => {
      if (!response.ok) {
        throw new Error(`login-demo.js konnte nicht geladen werden (${response.status}).`);
      }
      return response.text();
    }).catch((error) => {
      sourcePromise = undefined;
      throw error;
    });
  }

  codeOutput.textContent = await sourcePromise;
}

createTab.addEventListener("click", () => setMode("create"));
loginTab.addEventListener("click", () => setMode("login"));
form.addEventListener("input", () => setStep("input"));
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const currentOperation = ++operationId;
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!/^[a-zA-Z0-9_-]{3,24}$/.test(username)) {
    setStatus("Benutzername: 3–24 Zeichen, nur Buchstaben, Zahlen, _ und -.", "error");
    setStep("input");
    return;
  }
  if (password.length < 6 || password.length > 128) {
    setStatus("Das Demo-Passwort muss 6–128 Zeichen lang sein.", "error");
    setStep("input");
    return;
  }
  if (mode === "create" && password !== confirmationInput.value) {
    setStatus("Die Passwörter stimmen nicht überein.", "error");
    setStep("input");
    return;
  }

  submitButton.disabled = true;
  try {
    if (mode === "create") {
      setStep("salt");
      setStatus("Erzeuge einen zufälligen Salt im Browser …");
      const salt = crypto.getRandomValues(new Uint8Array(16));
      saltOutput.textContent = toHex(salt);

      setStep("derive");
      setStatus("Berechne den PBKDF2-Prüfwert lokal …");
      const verifier = await derivePassword(password, salt);
      if (currentOperation !== operationId) {
        salt.fill(0);
        verifier.fill(0);
        return;
      }

      setStep("store");
      forgetAccount();
      account = { username, salt, verifier };
      hashOutput.textContent = toHex(verifier);
      setStatus(
        "Demo-Konto erstellt. Salt und Hash bleiben vorübergehend im Arbeitsspeicher.",
        "success"
      );
    } else {
      if (!account) {
        setStatus("Es gibt noch kein Demo-Konto. Erstelle zuerst eines.", "error");
        setStep("input");
        return;
      }

      if (username !== account.username) {
        setStatus("Login fehlgeschlagen: Benutzername oder Passwort falsch.", "error");
        setStep("verify");
        return;
      }

      setStep("derive");
      setStatus("Berechne den Login-Prüfwert lokal …");
      const candidate = await derivePassword(password, account.salt);
      if (currentOperation !== operationId) {
        candidate.fill(0);
        return;
      }

      setStep("verify");
      saltOutput.textContent = toHex(account.salt);
      hashOutput.textContent = toHex(candidate);
      const authenticated = matchesVerifier(candidate, account.verifier);
      candidate.fill(0);
      setStatus(
        authenticated
          ? "Demo-Login erfolgreich. Es wurde keine Verbindung zu einem Server hergestellt."
          : "Login fehlgeschlagen: Benutzername oder Passwort falsch.",
        authenticated ? "success" : "error"
      );
    }
  } catch (error) {
    setStatus(
      `Demo konnte nicht ausgeführt werden: ${error.message || "Web Crypto ist nicht verfügbar."}`,
      "error"
    );
    console.error("Local login demonstration failed.", error);
  } finally {
    if (currentOperation === operationId) {
      passwordInput.value = "";
      confirmationInput.value = "";
      submitButton.disabled = false;
    }
  }
});

closeButton.addEventListener("click", () => {
  clearDemo();
  panel.hidden = true;
  setMode("create");
  terminalInput.focus();
});

window.addEventListener("pagehide", clearDemo);

export async function openLoginDemo() {
  panel.hidden = false;
  setMode("create");
  usernameInput.focus();
  try {
    await showSourceFile();
  } catch (error) {
    codeOutput.textContent = error.message;
    setStatus(`Die Quelldatei konnte nicht angezeigt werden: ${error.message}`, "error");
    console.error("Login demo source could not be displayed.", error);
  }
}
