# Problemas no dia a dia

Sintomas operacionais e o que **você** pode fazer no admin. Configuração de servidor e app Meta é responsabilidade do time técnico interno.

## Login e acesso

| Sintoma | Tente |
| ------- | ----- |
| Código OTP não chega | Pasta de spam; confirme email autorizado com quem administra o Iris |
| Código inválido ou expirado | **Reenviar código** ou **Trocar email** |
| Sessão cai ao recarregar | Limpe cache; peça novo código |

→ [Primeiro acesso](./primeiro-acesso.md)

## Instagram e publicação

| Sintoma | Tente |
| ------- | ----- |
| Não consigo agendar | Header → **Conectar** / **Reconectar Instagram** |
| Post **Falhou** | Abra o post → leia **Causa da falha**; **Testar conexão** |
| Carrossel travado | Aguarde até ~1 min; não feche o dialog |
| Horário errado no calendário | **Configurações → Fuso horário editorial** |

→ [Conectar Instagram](./conectar-instagram.md) · [Agendar e publicar](./agendar-e-publicar.md)

## Comentários

| Sintoma | Tente |
| ------- | ----- |
| Post não aparece | **Importar** ou **Adicionar** link |
| Comentário no IG, não no Iris | **Sincronizar** no post; veja [Webhooks](./webhooks.md) |
| Agente não responde | Modo **Desligado**? Post em **Pausar nesta publicação**? |
| Rascunho não publica | Aba **Atividade → Aprovação** — aprove manualmente |

→ [Comentários — visão geral](./comentarios-visao-geral.md)

## Mensagens (DMs)

| Sintoma | Tente |
| ------- | ----- |
| Lista vazia | **Importar**; banner de Page do Facebook? → acione técnico |
| Não consigo enviar | Badge **Janela fechada** — Meta não permite |
| IA não responde | Modo global **Desligado**? **IA pausada** na conversa? |
| Caso escalado | [Alertas do operador](./alertas-operador.md); **Retomar IA** |

→ [Mensagens — visão geral](./mensagens-visao-geral.md)

## Agente e monitoramento

| Sintoma | Tente |
| ------- | ----- |
| Respostas lentas | Normal com debounce + ciclo do worker — veja [Fila do agente](./fila-agente.md) |
| Webhooks sem eventos | **Testar conexão**; exporte JSON em Webhooks para o técnico |
| Assinatura inválida nos webhooks | Escale ao time técnico (config servidor) |
| Resposta estranha | **Ver decisão do agente** ou [Execuções](./execucoes-agente.md) |

## Produtos e lojas

| Sintoma | Tente |
| ------- | ----- |
| Sync Yampi falhou | **Testar conexão** na loja; confira token no painel Yampi |
| Agente não cita preço | **Preview resolvido** no produto; políticas de campo |
| Produto não aparece na triagem | Toggle **Ativo**; slug correto |

→ [Lojas — conectar](./lojas-conectar.md)

## Quando acionar o time técnico

Envie:

1. Horário exato do problema (fuso editorial)
2. @ Instagram conectado
3. Export JSON de **Webhooks** (se aplicável)
4. Print da **Causa da falha** em post ou execução do agente

Não inclua tokens, senhas ou chaves de API em tickets.

## Lista de imagens

Capturas pendentes: [IMAGENS.md](./IMAGENS.md)
