#!/usr/bin/env node
/**
 * Sync all doc sources into Starlight content (PT root locale).
 * Run from repo root: node iris-app/docs-site/scripts/sync-docs-content.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const contentRoot = path.join(__dirname, "../src/content/docs");

/** @param {string} srcDir repo-relative e.g. docs/meta */
function syncFolder(srcDir, outSubdir, linkMap = {}) {
  const metaDir = path.join(repoRoot, srcDir);
  const outDir = path.join(contentRoot, outSubdir);

  function fixLinks(body) {
    let next = body;
    for (const [file, target] of Object.entries(linkMap)) {
      next = next.replaceAll(`](${file})`, `](${target})`);
    }
    // cross-folder links from source (../configuracao/, ../uso/)
    next = next.replaceAll("](../configuracao/", "](../configuracao/");
    next = next.replaceAll("](../uso/", "](../uso/");
    next = next.replaceAll("](../dev/", "](../dev/");
    return next;
  }

  function extractTitle(markdown) {
    const match = markdown.match(/^#\s+(.+)$/m);
    return match ? match[1].trim() : "Untitled";
  }

  function stripTitle(markdown) {
    return markdown.replace(/^#\s+.+\n+/, "");
  }

  function toFrontmatter(title, description) {
    const desc = description.replace(/"/g, '\\"');
    return `---\ntitle: "${title.replace(/"/g, '\\"')}"\ndescription: "${desc}"\ntableOfContents:\n  minHeadingLevel: 2\n  maxHeadingLevel: 3\n---\n\n`;
  }

  function processFile(filename) {
    const raw = fs.readFileSync(path.join(metaDir, filename), "utf8");
    const title = extractTitle(raw);
    const body = fixLinks(stripTitle(raw));
    const description =
      filename === "README.md"
        ? title.replace(/^[^:]+:\s*/, "")
        : title.replace(/^\d+\s*—\s*/, "");
    const outName = filename === "README.md" ? "index.md" : filename;
    fs.writeFileSync(
      path.join(outDir, outName),
      toFrontmatter(title, description) + body.trim() + "\n",
    );
  }

  fs.mkdirSync(outDir, { recursive: true });
  for (const file of fs.readdirSync(metaDir)) {
    if (!file.endsWith(".md")) continue;
    if (outSubdir === "configuracao" && file === "referencia-tecnica.md") continue;
    processFile(file);
  }
  console.log(`Synced ${fs.readdirSync(outDir).length} files → ${outDir}`);
}

const configuracaoLinks = {
  "README.md": "./",
  "01-conta-instagram.md": "./01-conta-instagram/",
  "02-criar-app-meta.md": "./02-criar-app-meta/",
  "03-variaveis-de-ambiente.md": "./03-variaveis-de-ambiente/",
  "04-webhooks.md": "./04-webhooks/",
  "05-conectar-instagram-admin.md": "./05-conectar-instagram-admin/",
  "06-mensagens-receptor-primario.md": "./06-mensagens-receptor-primario/",
  "07-page-access-token.md": "./07-page-access-token/",
  "08-app-review.md": "./08-app-review/",
  "troubleshooting.md": "./troubleshooting/",
};

const usoLinks = {
  "README.md": "./",
  "01-primeiro-acesso.md": "./01-primeiro-acesso/",
  "02-calendario-e-postagens.md": "./02-calendario-e-postagens/",
  "03-comentarios.md": "./03-comentarios/",
  "04-mensagens.md": "./04-mensagens/",
  "05-produtos-e-lojas.md": "./05-produtos-e-lojas/",
  "06-configuracoes-e-agentes.md": "./06-configuracoes-e-agentes/",
  "07-webhooks-e-monitoramento.md": "./07-webhooks-e-monitoramento/",
  "troubleshooting.md": "./troubleshooting/",
};

syncFolder("docs/inicio", "inicio", { "README.md": "./" });
syncFolder("docs/uso", "uso", usoLinks);
syncFolder("docs/meta", "configuracao", configuracaoLinks);

// referencia-tecnica → dev/ (developer appendix)
const refSrc = path.join(repoRoot, "docs/meta/referencia-tecnica.md");
const devDir = path.join(contentRoot, "dev");
fs.mkdirSync(devDir, { recursive: true });
const refRaw = fs.readFileSync(refSrc, "utf8");
const refTitle = refRaw.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "Referência técnica";
const refBody = refRaw
  .replace(/^#\s+.+\n+/, "")
  .replaceAll("](README.md)", "](../configuracao/)")
  .replaceAll("](troubleshooting.md)", "](../configuracao/troubleshooting/)");
fs.writeFileSync(
  path.join(devDir, "referencia-tecnica.md"),
  `---\ntitle: "${refTitle.replace(/"/g, '\\"')}"\ndescription: "Fluxos de API e integração Meta para desenvolvedores."\ntableOfContents:\n  minHeadingLevel: 2\n  maxHeadingLevel: 3\n---\n\n${refBody.trim()}\n`,
);
console.log(`Synced dev/referencia-tecnica.md`);

// remove legacy meta/ content folders
for (const legacy of [
  path.join(contentRoot, "meta"),
  path.join(contentRoot, "en/meta"),
]) {
  if (fs.existsSync(legacy)) {
    fs.rmSync(legacy, { recursive: true, force: true });
    console.log(`Removed legacy ${path.relative(contentRoot, legacy)}/`);
  }
}
