# Meridian kit

Portable agent harness for **Cursor**, **Claude Code**, **Codex**, **Antigravity**, and other AI IDEs.

**This package contains only the kit** (`.agent/` + installer). No desktop app, no VS Code extension source — those are optional extras in the full [Meridian](https://github.com/colabcolibri/meridian) repository.

## Which IDE do you use?

| IDE | What install does | Slash commands |
| --- | ----------------- | -------------- |
| **Cursor** | Copies `.agent/` + builds `.cursor/` symlinks | Yes — `.cursor/commands/` |
| **Claude Code** | Copies `.agent/` + builds `.claude/` symlinks | Yes — `.claude/commands/` |
| **Codex** | Copies `.agent/` + builds `.agents/skills/` + `.codex/` | Yes — `workflow-*` skills (e.g. `$workflow-create-us`) |
| **Antigravity / ag-kit** | Copies `.agent/` only (`--no-sync`) | Yes — reads `.agent/workflows/` directly |
| **Other `.agent` tools** | Copies `.agent/` only (`--no-sync`) | Depends on tool |

Default `./install.sh` syncs Cursor, Claude Code, and Codex adapters. That is safe: only Meridian symlinks and generated Codex agent TOMLs are created; your own `.cursor/rules/` files are never deleted.

## What gets installed (agents included)

The full `.agent/` tree is copied — **all agents**, skills, workflows, rules, scripts, and references. Adapter sync then exposes agents and slash commands in Cursor (`.cursor/agents/`, `.cursor/commands/`), Claude Code (`.claude/agents/`, `.claude/commands/`), and Codex (`.agents/skills/workflow-*`, `.codex/agents/`). Antigravity reads `.agent/` directly — use `--no-sync`.

See [DISTRIBUTION.md](.agent/DISTRIBUTION.md) for kit vs extension and GitHub Releases.

## Install into your project

Extract this archive, then:

```bash
chmod +x install.sh
./install.sh /path/to/your-project
```

Or install into the current directory:

```bash
./install.sh .
```

**Antigravity-only project:**

```bash
./install.sh --no-sync /path/to/your-project
```

**Single IDE:**

```bash
./install.sh --cursor-only .
./install.sh --claude-only .
./install.sh --codex-only .
```

Do **not** commit `.cursor/`, `.claude/`, `.agents/skills/`, `.codex/`, or symlinked `AGENTS.md` — they are regenerated per machine.

## After install

1. Open your project in your IDE.
2. Run **`/init-meridian`** if `docs/` does not exist yet.
3. Read **`.agent/references/agents-help.md`** or run **`/agents-help`**.

## Update the kit

From your project (after a new kit release):

```bash
./install.sh --force .
```

`--force` replaces `.agent/` entirely and refreshes IDE adapters. Custom files in adapter folders that are **not** Meridian-managed are preserved.

Re-sync adapters only (no `.agent/` copy):

```bash
./.agent/scripts/sync_cursor_kit.sh
./.agent/scripts/sync_cursor_kit.sh --cursor-only
./.agent/scripts/sync_cursor_kit.sh --dry-run
```

## Build tarball (maintainers)

From the Meridian monorepo:

```bash
KIT_VERSION=1.0.0 ./.agent/scripts/package-kit.sh
# → dist/meridian-kit-1.0.0.tar.gz
```

## Validate

```bash
python3 .agent/scripts/validate_meridian.py .
```

## Optional: VS Code / Cursor extension

**Meridian Harness** on the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=colabcolibri.meridian-vscode) — bundles the kit and installs it when you run **Meridian: Install Harness**. Kanban and planning views in the editor.

Details: [app-visual-studio/README.md](app-visual-studio/README.md)

## Author

[Sergio Luciano Jr](https://github.com/colabcolibri) · [colabcolibri/meridian](https://github.com/colabcolibri/meridian)

## License

PolyForm Noncommercial 1.0.0 — see `LICENSE`.
