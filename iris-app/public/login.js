const formEl = document.querySelector("#login-form");
const emailStepEl = document.querySelector("#email-step");
const codeStepEl = document.querySelector("#code-step");
const progressEmail = document.querySelector("#progress-email");
const progressCode = document.querySelector("#progress-code");
const emailEl = document.querySelector("#login-email");
const codeEl = document.querySelector("#login-code");
const sendCodeBtn = document.querySelector("#send-code-btn");
const confirmCodeBtn = document.querySelector("#confirm-code-btn");
const resendCodeBtn = document.querySelector("#resend-code-btn");
const changeEmailBtn = document.querySelector("#change-email-btn");
const feedbackEl = document.querySelector("#login-feedback");
const codeSentEmailEl = document.querySelector("#code-sent-email");

let currentEmail = "";
let feedbackTimer = null;

function setFeedback(message, type = "error") {
  if (feedbackTimer) {
    clearTimeout(feedbackTimer);
    feedbackTimer = null;
  }

  if (!message) {
    feedbackEl.hidden = true;
    feedbackEl.textContent = "";
    feedbackEl.className = "login-feedback";
    return;
  }

  feedbackEl.hidden = false;
  feedbackEl.textContent = message;
  feedbackEl.className = `login-feedback is-${type}`;
  feedbackEl.setAttribute("role", type === "error" ? "alert" : "status");

  if (type !== "error") {
    feedbackTimer = setTimeout(() => setFeedback(""), 4000);
  }
}

function setLoading(button, loading, idleLabel, loadingLabel) {
  button.disabled = loading;
  button.textContent = loading ? loadingLabel : idleLabel;
  button.setAttribute("aria-busy", loading ? "true" : "false");
}

function goToEmailStep() {
  emailStepEl.hidden = false;
  codeStepEl.hidden = true;
  progressEmail.classList.add("is-active");
  progressCode.classList.remove("is-active");
  codeEl.value = "";
  setFeedback("");
  emailEl.focus();
}

function goToCodeStep(email) {
  currentEmail = email;
  emailStepEl.hidden = true;
  codeStepEl.hidden = false;
  progressEmail.classList.remove("is-active");
  progressCode.classList.add("is-active");
  codeSentEmailEl.textContent = email;
  setFeedback("");
  codeEl.focus();
}

async function requestCode({ resend = false } = {}) {
  const email = currentEmail || emailEl.value.trim();
  if (!email) {
    setFeedback("Informe um email válido.");
    emailEl.focus();
    return;
  }

  const button = resend ? resendCodeBtn : sendCodeBtn;
  const idleLabel = resend ? "Reenviar código" : "Continuar";
  const loadingLabel = resend ? "Reenviando…" : "Enviando…";

  setFeedback("");
  setLoading(button, true, idleLabel, loadingLabel);

  try {
    const response = await fetch("/api/auth/request-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error ?? "Não foi possível enviar o código.");
    }

    goToCodeStep(email);

    if (resend) {
      setFeedback("Código reenviado.", "success");
    }
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : "Não foi possível enviar o código.");
  } finally {
    setLoading(button, false, idleLabel, loadingLabel);
  }
}

sendCodeBtn.addEventListener("click", () => {
  void requestCode();
});

resendCodeBtn.addEventListener("click", () => {
  void requestCode({ resend: true });
});

changeEmailBtn.addEventListener("click", () => {
  goToEmailStep();
});

formEl.addEventListener("submit", (event) => {
  event.preventDefault();
  setFeedback("");

  const email = currentEmail || emailEl.value.trim();
  const code = codeEl.value.trim();

  if (!/^\d{6}$/.test(code)) {
    setFeedback("Digite os 6 dígitos do código.");
    codeEl.focus();
    return;
  }

  setLoading(confirmCodeBtn, true, "Entrar", "Verificando…");

  void fetch("/api/auth/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, code }),
  })
    .then(async (response) => {
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error ?? "Código inválido ou expirado.");
      }
      window.location.href = "/";
    })
    .catch((error) => {
      setFeedback(error instanceof Error ? error.message : "Falha ao entrar.");
      setLoading(confirmCodeBtn, false, "Entrar", "Verificando…");
    });
});

emailEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !codeStepEl.hidden) {
    return;
  }
  if (event.key === "Enter" && !emailStepEl.hidden) {
    event.preventDefault();
    void requestCode();
  }
});
