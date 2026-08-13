import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emailCodeBlock,
  emailMetaList,
  emailParagraphs,
  emailQuote,
  escapeHtml,
  renderIrisEmailHtml,
} from "./email-html.ts";
import { buildAdminLoginEmailContent } from "../auth/admin-login-email.ts";
import { buildContactFormEmailContent } from "../contact/contact-form-email.ts";

test("escapeHtml escapes markup characters", () => {
  assert.equal(escapeHtml(`a <b> & "c" 'd'`), "a &lt;b&gt; &amp; &quot;c&quot; &#39;d&#39;");
});

test("renderIrisEmailHtml wraps body with Iris shell", () => {
  const html = renderIrisEmailHtml({
    heading: "Olá",
    preheader: "Pré-visualização",
    bodyHtml: emailParagraphs("Corpo do email."),
  });

  assert.match(html, /<!DOCTYPE html>/);
  assert.match(html, />Iris</);
  assert.match(html, /#522587/);
  assert.match(html, /#f4f2ee/);
  assert.match(html, /Olá/);
  assert.match(html, /Pré-visualização/);
  assert.match(html, /Corpo do email\./);
  assert.doesNotMatch(html, /<script/i);
});

test("email helpers escape untrusted content", () => {
  assert.match(emailParagraphs("<script>x</script>"), /&lt;script&gt;/);
  assert.match(emailCodeBlock("<b>123456</b>"), /&lt;b&gt;123456&lt;\/b&gt;/);
  assert.match(emailQuote("a & b"), /a &amp; b/);
  assert.match(
    emailMetaList([{ label: "Nome", value: "<img>" }]),
    /&lt;img&gt;/,
  );
});

test("buildAdminLoginEmailContent returns html and text in English", () => {
  const content = buildAdminLoginEmailContent({
    code: "482917",
    ttlMinutes: 10,
    locale: "en",
  });
  assert.equal(content.subject, "Your sign-in code — Iris");
  assert.match(content.text, /482917/);
  assert.match(content.html, /482917/);
  assert.match(content.html, /expires in 10 minutes/);
  assert.match(content.html, /lang="en-US"/);
});

test("buildAdminLoginEmailContent returns html and text", () => {
  const content = buildAdminLoginEmailContent({ code: "482917", ttlMinutes: 10 });
  assert.equal(content.subject, "Seu código de acesso — Iris");
  assert.match(content.text, /482917/);
  assert.match(content.html, /482917/);
  assert.match(content.html, /expira em 10 minutos/);
  assert.match(content.html, /lang="pt-BR"/);
});

test("buildContactFormEmailContent returns html and text", () => {
  const content = buildContactFormEmailContent({
    name: "Ana <Silva>",
    email: "ana@example.com",
    subject: "Interesse",
    message: "Quero saber mais\nsobre o Iris.",
    pageUrl: "https://example.com/#contato",
  });

  assert.match(content.subject, /Interesse/);
  assert.match(content.text, /Ana <Silva>/);
  assert.match(content.html, /Ana &lt;Silva&gt;/);
  assert.match(content.html, /Quero saber mais/);
  assert.match(content.html, /https:\/\/example\.com\/#contato/);
});
