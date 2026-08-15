#!/usr/bin/env node
/**
 * Minimal English stubs for public user guide only (no config/dev).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const enRoot = path.join(__dirname, "../src/content/docs/en");

function writePage(filePath, title, description, body) {
  const content = `---\ntitle: "${title.replace(/"/g, '\\"')}"\ndescription: "${description.replace(/"/g, '\\"')}"\n---\n\n${body.trim()}\n`;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

// Remove unpublished EN sections
for (const remove of ["configuracao", "dev", "meta"]) {
  const dir = path.join(enRoot, remove);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`Removed unpublished en/${remove}/`);
  }
}

writePage(
  path.join(enRoot, "inicio/index.md"),
  "Iris user guide",
  "How to operate the Iris admin.",
  `Iris schedules Instagram posts, manages comments and DMs, and can reply with an AI agent in your brand voice.

This site documents **how to use the admin** only. Server and Meta setup are internal team documentation.

→ [User guide](../uso/)
`,
);

writePage(
  path.join(enRoot, "uso/index.md"),
  "User guide",
  "Day-to-day Iris admin operations.",
  `The full guide is being translated. For now, use the **Portuguese** version (default) — same structure, complete content.

Switch language with the selector in the docs header.
`,
);

// Remove stale EN uso pages (old monolithic guides)
const enUsoDir = path.join(enRoot, "uso");
if (fs.existsSync(enUsoDir)) {
  for (const file of fs.readdirSync(enUsoDir)) {
    if (file !== "index.md" && file.endsWith(".md")) {
      fs.unlinkSync(path.join(enUsoDir, file));
      console.log(`Removed stale en/uso/${file}`);
    }
  }
}

console.log("Wrote minimal EN stubs (user guide only).");
