# Meridian distribution

**Product:** [Meridian Harness](https://marketplace.visualstudio.com/items?itemName=colabcolibri.meridian-vscode) on the Visual Studio Marketplace.

**GitHub:** https://github.com/colabcolibri/meridian · **Publisher:** https://github.com/colabcolibri · **Author:** S. Luciano

---

## End users

1. **Extensions** → **Meridian Harness** (publisher `colabcolibri`) → Install → Reload.
2. **File → Open Folder…** → your project.
3. **Meridian: Install Harness** — manual; status bar, Command Palette, or **Meridian → Commands**.
4. Cursor: `/init-meridian` if `docs/` is missing.
5. **Meridian: Open Board**, slash commands, **Validate Project**.

Install Harness copies `.agent/` and syncs `.cursor/` / `.claude/`. The extension never installs the kit automatically.

**Update kit:** update extension → **Meridian: Upgrade Harness**.

User-facing install guide: [`app-visual-studio/README.md`](../app-visual-studio/README.md).

---

## Maintainers — publish a new version

```bash
cd app-visual-studio
pnpm test
pnpm package:vsix
```

Upload `meridian-vscode-X.Y.Z.vsix` at https://marketplace.visualstudio.com/manage

Details: [`app-visual-studio/MARKETPLACE.md`](../app-visual-studio/MARKETPLACE.md).

---

## License

PolyForm Noncommercial 1.0.0 — see `LICENSE` in the monorepo.
