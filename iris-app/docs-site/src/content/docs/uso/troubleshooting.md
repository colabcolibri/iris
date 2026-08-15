---
title: "Problemas no uso (dia a dia)"
description: "Problemas no uso (dia a dia)"
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 3
---

Soluções para quem **já entrou no admin** e algo não funciona como esperado.

## Login e acesso

| Problema | Solução |
| -------- | ------- |
| Não recebo o código por email | Confira spam; confirme com quem instalou se seu email está em `IRIS_ADMIN_EMAIL` |
| Código inválido | Códigos expiram rápido — peça um novo |
| Tela em branco após login | Atualize a página; teste outro navegador |

## Postagens

| Problema | Solução |
| -------- | ------- |
| Post não publicou no horário | Servidor Iris precisa estar online; confira fuso em Configurações |
| Status **Falhou** | Abra o post — leia a mensagem de erro; reconecte Instagram |
| Imagem não sobe | Use JPG/PNG; arquivo muito grande pode demorar |

## Comentários e DMs

| Problema | Solução |
| -------- | ------- |
| Comentário não aparece | Aguarde 1–2 min; veja [Webhooks](./07-webhooks-e-monitoramento/) |
| Agente não responde | Modo em Silêncio? Agente desligado em Configurações? |
| Resposta errada | Mude para **supervisionado** e ajuste **Persona** |

## Agente e IA

| Problema | Solução |
| -------- | ------- |
| “Sem resposta” do agente | Modelo LLM não configurado no servidor |
| Agente parou numa conversa | Escalação humana — destrave na conversa ou Configurações |
| Texto em idioma errado | Persona e idioma das respostas em Configurações |

## Produtos

| Problema | Solução |
| -------- | ------- |
| Lista vazia | Conecte e sincronize loja em [Produtos e lojas](./05-produtos-e-lojas/) |
| Preço errado | Sincronize de novo na tela Lojas |

## Ainda com problema?

1. Anote **o que você fez**, **hora** e **mensagem de erro** (se houver).
2. Veja se é configuração de servidor → [Guia de configuração](../configuracao/troubleshooting/).
3. Envie isso para quem mantém o Iris.
