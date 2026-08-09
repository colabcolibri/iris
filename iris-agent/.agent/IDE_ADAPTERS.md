# IDE adapters — iris-agent

Kit source: **`iris-agent/.agent/`** (committed).

```bash
cd iris-agent
chmod +x .agent/scripts/sync_cursor_kit.sh   # once
./.agent/scripts/sync_cursor_kit.sh
```

Creates `.cursor/skills/`, `.cursor/agents/` symlinks → `.agent/`. Do not commit adapters.

Antigravity / `.agent-native`: read `.agent/` directly — no sync needed.
