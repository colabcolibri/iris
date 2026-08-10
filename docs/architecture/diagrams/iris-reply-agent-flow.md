---
title: Iris — fluxo do agente de comentários
subtitle: Webhook/worker → gates → harness → draft ou Meta → audit (top → bottom)
updated: 2026-08-10
source_doc: docs/05_architecture.md
kind: flow
---

# Fluxo do agente de respostas automáticas

```mermaid
flowchart TB
  START([Novo comentário Instagram])

  subgraph IN ["Entrada"]
    WH["meta-webhook: upsert pending"]
    WRK["comment-responder: tick periódico"]
  end

  PCR["processCommentReply"]

  subgraph GATES ["Gates"]
    G1{pending e sem reply?}
    G2{auto_reply global ON?}
    G3{post reply_mode ≠ off?}
    G4{LLM configurado?}
  end

  STOP([Nada acontece])

  CTX["assembleReplyContext + agentContentStore.get"]
  HARNESS["runReplyHarness"]

  subgraph STAGES ["Harness — 3 estágios"]
    S1["① Triagem — LLM JSON shouldReply"]
    S2["② Rascunho — LLM texto"]
    S3["③ Verificação — LLM JSON approved"]
    S1 --> S2 --> S3
  end

  subgraph OUT_SKIP ["Bloqueio na triagem"]
    OS1["agent_run skipped + steps"]
    OS2["comment skipped · guardrail"]
  end

  subgraph OUT_FAIL ["Reprovação na verificação"]
    OF1["agent_run failed + steps"]
    OF2["comment failed · guardrail"]
  end

  subgraph OUT_OK ["Aprovado"]
    OK1["agent_run ok + 3 steps"]
    OK2{reply_mode?}
    OK3["comment_reply draft · pending mantido"]
    OK4["Graph API reply · comment replied"]
  end

  UI["SSE → Admin UI"]
  AUD["GET reply-audit sob demanda"]

  START --> WH
  START --> WRK
  WH --> PCR
  WRK --> PCR

  PCR --> G1
  G1 -->|não| STOP
  G1 -->|sim| G2
  G2 -->|não| STOP
  G2 -->|sim| G3
  G3 -->|não| STOP
  G3 -->|sim| G4
  G4 -->|não| STOP
  G4 -->|sim| CTX

  CTX --> HARNESS
  HARNESS --> S1

  S1 -->|fail| OS1 --> OS2
  S1 -->|pass| S2
  S3 -->|fail| OF1 --> OF2
  S3 -->|pass| OK1 --> OK2
  OK2 -->|draft| OK3
  OK2 -->|auto| OK4

  OS2 --> UI
  OF2 --> UI
  OK3 --> UI
  OK4 --> UI
  UI --> AUD

  classDef gate fill:#92400e,stroke:#fbbf24,color:#fffbeb
  classDef stage fill:#0f766e,stroke:#2dd4bf,color:#ecfeff
  classDef block fill:#7f1d1d,stroke:#f87171,color:#fef2f2
  classDef ok fill:#065f46,stroke:#34d399,color:#ecfdf5
  classDef ui fill:#1e3a8a,stroke:#60a5fa,color:#eff6ff

  class G1,G2,G3,G4,OK2 gate
  class S1,S2,S3,PCR,CTX,HARNESS stage
  class OS1,OS2,OF1,OF2 block
  class OK1,OK3,OK4 ok
  class UI,AUD ui
```
