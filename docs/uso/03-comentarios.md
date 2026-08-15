# 03 — Comentários

**Tempo:** contínuo · **Para:** operador que responde a audiência

## O que você vai fazer

Ver comentários que chegam nos seus posts e responder manualmente ou deixar o **agente de IA** responder por você.

## Passo 1 — Abrir a caixa de comentários

1. Menu lateral → **Comentários**.
2. Você vê a lista de comentários recentes, agrupados por post.

Os comentários novos chegam **sozinhos** quando o Instagram e o Iris estão configurados (webhook). Se nada aparece, peça para quem instalou o servidor revisar a [configuração de webhooks](../configuracao/04-webhooks/).

## Passo 2 — Entender os modos de resposta

Cada post (ou o Iris inteiro) pode estar em um destes modos:

| Modo | O que acontece |
| ---- | -------------- |
| **Automático** | O agente gera e envia a resposta sozinho |
| **Supervisionado** | O agente sugere; **você aprova** antes de publicar no Instagram |
| **Silêncio** | Ninguém responde automaticamente — só manual |

O modo **global** fica em **Configurações → Agente de comentários**. Um post pode ter modo próprio que sobrescreve o global.

## Passo 3 — Responder manualmente

1. Clique no comentário.
2. Digite sua resposta no campo de texto.
3. Envie — a resposta aparece **público** no Instagram, embaixo do comentário.

Use quando quiser tom pessoal ou quando o agente estiver desligado.

## Passo 4 — Aprovar sugestão do agente (modo supervisionado)

1. Comentários com sugestão pendente aparecem destacados na fila.
2. Leia o texto sugerido.
3. **Aprove** para publicar, **edite** antes de enviar, ou **rejeite** e escreva outra resposta.

**Como saber que deu certo:** o comentário mostra sua resposta no Instagram em alguns segundos.

## Passo 5 — Ajustar o tom do agente

O vocabulário e estilo do agente vêm da **Persona** (menu **Persona**):

- Tom formal ou casual
- Idioma das respostas
- O que o agente pode ou não falar

Mudanças na persona afetam **novas** respostas, não as já enviadas.

## Resposta privada (DM a partir do comentário)

Em campanhas configuradas, o agente pode convidar o seguidor para o **DM** em vez de responder só no comentário. Isso depende das permissões da Meta e da configuração do post.

## Problemas comuns

| Sintoma | O que fazer |
| ------- | ----------- |
| Comentário não aparece | Aguarde 1–2 min; se persistir, ver [webhooks](../configuracao/04-webhooks/) |
| Agente não responde | Confira modo (não está em Silêncio?) e **Configurações → Agente de comentários** |
| Resposta estranha | Ajuste **Persona** ou passe o post para supervisionado |

## Próximo passo

→ [04 — Mensagens (DMs)](./04-mensagens/)
