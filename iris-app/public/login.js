const formEl = document.querySelector("#login-form");
const emailStepEl = document.querySelector("#email-step");
const codeStepEl = document.querySelector("#code-step");
const emailEl = document.querySelector("#login-email");
const codeEl = document.querySelector("#login-code");
const sendCodeBtn = document.querySelector("#send-code-btn");
const errorEl = document.querySelector("#login-error");

let currentEmail = "";

function showError(message) {
  errorEl.textContent = message;
  errorEl.hidden = !message;
}

async function requestCode() {
  showError("");
  sendCodeBtn.disabled = true;

  try {
    const response = await fetch("/api/auth/request-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: emailEl.value.trim() }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error ?? "Falha ao enviar código.");
    }

    currentEmail = emailEl.value.trim();
    codeStepEl.hidden = false;
    codeEl.focus();
  } catch (error) {
    showError(error instanceof Error ? error.message : "Falha ao enviar código.");
  } finally {
    sendCodeBtn.disabled = false;
  }
}

sendCodeBtn.addEventListener("click", () => {
  void requestCode();
});

formEl.addEventListener("submit", (event) => {
  event.preventDefault();
  showError("");

  void fetch("/api/auth/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      email: currentEmail || emailEl.value.trim(),
      code: codeEl.value.trim(),
    }),
  })
    .then(async (response) => {
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = payload.error ?? "Código inválido.";
        if (response.status === 429) {
          throw new Error(message);
        }
        throw new Error(message);
      }
      window.location.href = "/";
    })
    .catch((error) => {
      showError(error instanceof Error ? error.message : "Falha ao entrar.");
    });
});
