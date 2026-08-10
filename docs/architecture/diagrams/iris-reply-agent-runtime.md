---
title: Iris — runtime do agente de comentários
subtitle: Módulos, config editorial e persistência do harness (top → bottom)
updated: 2026-08-10
source_doc: docs/05_architecture.md
kind: runtime
---

# Runtime — agente de comentários

```mermaid
flowchart TB
  subgraph L1 ["① Gatilhos"]
    WH["meta-webhook"]
    WRK["comment-responder"]
  end

  subgraph L2 ["② Gates — precedência"]
    G1["app_settings.auto_reply_enabled"]
    G2["post.reply_mode ≠ off"]
    G3["comment pending + sem reply"]
  end

  PCR["process-comment-reply"]

  subgraph L3 ["③ Contexto"]
    RCA["reply-context-assembler"]
    FS["data/agent/*.md"]
    RP["reply_persona SQLite"]
  end

  subgraph L4 ["④ Harness"]
    T["triage-stage"]
    D["draft-stage"]
    V["verify-stage"]
    T --> D --> V
  end

  LLM[("LLM completer")]

  subgraph L5 ["⑤ Desfecho"]
    SK["comment → skipped"]
    FL["comment → failed"]
    DR["comment_reply draft"]
    AU["Graph API → replied"]
  end

  subgraph L6 ["⑥ Persistência"]
    AR[("agent_runs")]
    ARS[("agent_run_steps")]
    CR[("comment_replies")]
    CMT[("comments")]
  end

  subgraph L7 ["⑦ UI"]
    SSE["SSE comments-changed"]
    AUD["ReplyAuditTimeline"]
    SET["persona-page → agent content"]
  end

  WH --> PCR
  WRK --> PCR
  G1 --> PCR
  G2 --> PCR
  G3 --> PCR

  PCR --> RCA
  PCR --> FS
  RCA --> RP
  PCR --> T

  T --> LLM
  D --> LLM
  V --> LLM

  T -->|fail| SK
  V -->|fail| FL
  V -->|ok + draft| DR
  V -->|ok + auto| AU

  SK & FL & DR & AU --> AR
  T & D & V --> ARS
  DR & AU --> CR
  SK & FL & DR & AU --> CMT

  PCR --> SSE
  SSE --> AUD
  SET --> FS
  ARS --> AUD

  classDef module fill:#0f766e,stroke:#2dd4bf,color:#ecfeff
  classDef store fill:#065f46,stroke:#34d399,color:#ecfdf5
  classDef gate fill:#92400e,stroke:#fbbf24,color:#fffbeb
  classDef ui fill:#1e3a8a,stroke:#60a5fa,color:#eff6ff

  class PCR,RCA,T,D,V module
  class CMT,AR,ARS,CR,FS,RP,LLM store
  class G1,G2,G3 gate
  class SSE,AUD,SET ui
```
