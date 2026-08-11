/**
 * Iris transactional email layout — table + inline CSS for client compatibility.
 * Colors from docs/design/DESIGN-rules.md / iris-design-tokens.css.
 */

const IRIS = {
  primary: "#522587",
  primaryFocus: "#6b4a96",
  onPrimary: "#ffffff",
  canvas: "#ffffff",
  parchment: "#f4f2ee",
  pearl: "#ebe8e2",
  ink: "#1a1814",
  inkSoft: "#4a443c",
  inkMuted: "#6f6860",
  hairline: "#d8d2c8",
  divider: "#eceae4",
  fontSans: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  fontSerif: "Georgia, 'Times New Roman', serif",
  fontMono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
} as const;

export type IrisEmailLayoutInput = {
  /** Visible title inside the card (optional). */
  heading?: string;
  /** Hidden preview text in inbox list. */
  preheader?: string;
  /** Inner HTML already escaped / built with helpers below. */
  bodyHtml: string;
  /** Footer line under the card. */
  footerNote?: string;
};

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Convert plain text with newlines into safe HTML paragraphs. */
export function emailParagraphs(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = escapeHtml(block).replaceAll("\n", "<br />");
      return `<p style="margin:0 0 16px;font-family:${IRIS.fontSans};font-size:16px;line-height:1.55;color:${IRIS.ink};">${lines}</p>`;
    })
    .join("");
}

export function emailMuted(text: string): string {
  return `<p style="margin:0 0 16px;font-family:${IRIS.fontSans};font-size:14px;line-height:1.5;color:${IRIS.inkMuted};">${escapeHtml(text)}</p>`;
}

/** Large OTP / one-time code block. */
export function emailCodeBlock(code: string): string {
  const safe = escapeHtml(code);
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0 24px;">
  <tr>
    <td style="background-color:${IRIS.pearl};border:1px solid ${IRIS.hairline};border-left:4px solid ${IRIS.primary};border-radius:11px;padding:20px 24px;text-align:center;">
      <span style="font-family:${IRIS.fontMono};font-size:32px;font-weight:600;letter-spacing:0.28em;color:${IRIS.primary};line-height:1.2;">${safe}</span>
    </td>
  </tr>
</table>`.trim();
}

export function emailMetaList(
  rows: ReadonlyArray<{ label: string; value: string }>,
): string {
  const items = rows
    .map(
      (row) => `
<tr>
  <td style="padding:10px 0;border-bottom:1px solid ${IRIS.divider};width:120px;vertical-align:top;font-family:${IRIS.fontSans};font-size:13px;font-weight:600;letter-spacing:0.02em;text-transform:uppercase;color:${IRIS.inkMuted};">${escapeHtml(row.label)}</td>
  <td style="padding:10px 0;border-bottom:1px solid ${IRIS.divider};vertical-align:top;font-family:${IRIS.fontSans};font-size:15px;line-height:1.45;color:${IRIS.ink};">${escapeHtml(row.value)}</td>
</tr>`.trim(),
    )
    .join("");

  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;">
  ${items}
</table>`.trim();
}

export function emailQuote(text: string): string {
  const lines = escapeHtml(text).replaceAll("\n", "<br />");
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 8px;">
  <tr>
    <td style="background-color:${IRIS.parchment};border:1px solid ${IRIS.hairline};border-radius:11px;padding:16px 18px;font-family:${IRIS.fontSans};font-size:15px;line-height:1.55;color:${IRIS.inkSoft};">${lines}</td>
  </tr>
</table>`.trim();
}

/**
 * Standard Iris shell for every transactional email.
 * Always pair with a plain-text `text` body for clients that prefer it.
 */
export function renderIrisEmailHtml(input: IrisEmailLayoutInput): string {
  const preheader = input.preheader?.trim()
    ? escapeHtml(input.preheader.trim())
    : "";
  const heading = input.heading?.trim()
    ? `<h1 style="margin:0 0 20px;font-family:${IRIS.fontSerif};font-size:26px;font-weight:600;line-height:1.2;letter-spacing:-0.02em;color:${IRIS.ink};">${escapeHtml(input.heading.trim())}</h1>`
    : "";
  const footerNote =
    input.footerNote?.trim() ||
    "Iris — respostas a comentários no Instagram com o seu tom.";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Iris</title>
</head>
<body style="margin:0;padding:0;background-color:${IRIS.parchment};">
  ${
    preheader
      ? `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${preheader}</div>`
      : ""
  }
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${IRIS.parchment};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background-color:${IRIS.canvas};border:1px solid ${IRIS.hairline};border-radius:18px;overflow:hidden;">
          <tr>
            <td style="height:4px;background-color:${IRIS.primary};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;">
              <p style="margin:0;font-family:${IRIS.fontSerif};font-size:22px;font-weight:600;letter-spacing:-0.02em;color:${IRIS.primary};">Iris</p>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 32px 32px;">
              ${heading}
              ${input.bodyHtml}
            </td>
          </tr>
        </table>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;">
          <tr>
            <td style="padding:20px 8px 0;text-align:center;font-family:${IRIS.fontSans};font-size:12px;line-height:1.5;color:${IRIS.inkMuted};">
              ${escapeHtml(footerNote)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export { IRIS as irisEmailTokens };
