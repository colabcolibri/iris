import type { ServerErrorsMessages } from "@/i18n/domains/server-errors/types";

export const serverErrorsEn = {
  LEGACY_MESSAGE: "{message}",
  VALIDATION_FAILED: "Invalid data. Check the fields and try again.",
  META_NOT_CONNECTED: "Connect your Instagram account in settings.",
  META_TOKEN_EXPIRED: "Instagram token expired. Reconnect your account.",
  META_NO_IG_USER: "Instagram account not configured. Connect in settings.",
  PUBLISH_NOT_CONFIGURED: "Publishing not configured. Check Meta connection.",
  RATE_LIMITED: "Rate limit reached. Try again shortly.",
  MESSAGING_WINDOW_EXPIRED:
    "Meta's 24h messaging window expired. You can only reply within that window after the customer's last message.",
  META_SEND_FAILED: "Meta rejected the send: {message}",
  META_PERMISSION_DENIED:
    "No permission to send messages. Reconnect Instagram and authorize messaging ({message}).",
  META_THREAD_OWNER:
    "This conversation was replied to from the Instagram app and is temporarily locked for API sends. Ask the customer to send a new message to unlock sending.",
  CONTACT_INVALID: "Fill in all form fields correctly.",
  REQUEST_FAILED: "Request failed ({status}).",
  INTERNAL_ERROR: "Internal error. Try again.",
  UNAUTHORIZED: "Session expired. Sign in again.",
  BODY_TOO_LARGE: "Uploaded content is too large.",
} satisfies ServerErrorsMessages;
