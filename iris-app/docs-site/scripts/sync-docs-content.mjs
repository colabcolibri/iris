#!/usr/bin/env node
/**
 * Sync public user guide only (inicio + uso) into Starlight.
 * Internal install docs stay in docs/configuracao/ — not published.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveDocsRootFromImportMeta } from "./resolve-docs-root.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsRoot = resolveDocsRootFromImportMeta(import.meta.url);
const contentRoot = path.join(__dirname, "../src/content/docs");

const PUBLIC_SECTIONS = ["inicio", "uso"];

function slugFromFilename(filename) {
  if (filename === "README.md") return "index";
  return filename.replace(/\.md$/, "");
}

function syncFolder(section, outSubdir) {
  const srcDir = path.join(docsRoot, section);
  const outDir = path.join(contentRoot, outSubdir);
  if (!fs.existsSync(srcDir)) {
    throw new Error(`Docs source missing: ${srcDir}`);
  }
  const mdFiles = fs.readdirSync(srcDir).filter((f) => f.endsWith(".md"));

  function fixLinks(body) {
    let next = body;
    for (const file of mdFiles) {
      const slug = slugFromFilename(file);
      const target = slug === "index" ? "./" : `./${slug}/`;
      next = next.replaceAll(`](${file})`, `](${target})`);
    }
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
    const esc = (s) => s.replace(/"/g, '\\"');
    return `---\ntitle: "${esc(title)}"\ndescription: "${esc(description)}"\ntableOfContents:\n  minHeadingLevel: 2\n  maxHeadingLevel: 3\n---\n\n`;
  }

  fs.mkdirSync(outDir, { recursive: true });
  const written = new Set();

  for (const file of mdFiles) {
    if (file === "IMAGENS.md") {
      const raw = fs.readFileSync(path.join(srcDir, file), "utf8");
      const title = extractTitle(raw);
      const body = fixLinks(stripTitle(raw));
      const description = "Checklist de capturas de tela do guia.";
      fs.writeFileSync(
        path.join(outDir, "imagens.md"),
        toFrontmatter(title, description) + body.trim() + "\n",
      );
      written.add("imagens.md");
      continue;
    }
    const raw = fs.readFileSync(path.join(srcDir, file), "utf8");
    const title = extractTitle(raw);
    const body = fixLinks(stripTitle(raw));
    const description = title.replace(/^\d+\s*—\s*/, "");
    const outName = file === "README.md" ? "index.md" : file;
    fs.writeFileSync(
      path.join(outDir, outName),
      toFrontmatter(title, description) + body.trim() + "\n",
    );
    written.add(outName);
  }

  for (const existing of fs.readdirSync(outDir)) {
    if (existing.endsWith(".md") && !written.has(existing)) {
      fs.unlinkSync(path.join(outDir, existing));
    }
  }

  console.log(`Synced ${written.size} files → ${outDir}`);
}

for (const section of PUBLIC_SECTIONS) {
  syncFolder(section, section);
}

for (const remove of ["configuracao", "dev", "meta", "en/configuracao", "en/dev", "en/meta"]) {
  const dir = path.join(contentRoot, remove);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`Removed unpublished ${remove}/`);
  }
}
