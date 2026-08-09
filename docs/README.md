# Iris — phase documentation

Meridian phase docs for **Iris** (Instagram scheduling and comments service).

| Doc | Topic |
| --- | ----- |
| [00_scope.md](./00_scope.md) | Product charter |
| [01_tech_stack.md](./01_tech_stack.md) | Stack choices |
| [02_security.md](./02_security.md) | Auth, secrets, agents |
| [03_user_types.md](./03_user_types.md) | Operador, agente, Meta |
| [04_principles.md](./04_principles.md) | SRP, simplicity |
| [05_architecture.md](./05_architecture.md) | System shape (**backlog gate**) |
| [06_database.md](./06_database.md) | SQLite schema |
| [07_api_contracts.md](./07_api_contracts.md) | REST + SSE + webhooks |
| [08_environments.md](./08_environments.md) | Dev and prod |
| [09_design_system.md](./09_design_system.md) | HTML UI tokens |
| [10_test_strategy.md](./10_test_strategy.md) | Testing approach |
| [11_decisions.md](./11_decisions.md) | Decision log pointer |

Detail files: [architecture/](./architecture/) — [local-publications](./architecture/local-publications.md), [image-optimization](./architecture/image-optimization.md).

Backlog: `.meridian/meridian.db` — use Board extension or `meridian_db_export --format planning`.
