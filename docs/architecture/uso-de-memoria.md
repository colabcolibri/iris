---
title: Uso de memória da conta no Turso
updated: 2026-09-27
---

# Uso de memória da conta no Turso

Estimativa para o processo único da Iris com tenancy ligada. Medido nesta máquina em 2026-09-27, com contas vazias. Não é carga de produção com posts, imagens em processamento nem o admin aberto.

## O que fica aberto

Existe um processo Node: o servidor HTTP. Não há um segundo programa escutando o Instagram.

A Meta empurra o evento. O webhook `POST /webhooks/meta/{slug}` grava a mensagem no SQLite daquela conta e avisa o navegador que estiver com a tela aberta, pelo fluxo de eventos que o admin já usa. Enquanto a aba está fechada, essa ligação com o navegador não existe.

O worker que publica e responde é um `setInterval` dentro desse mesmo processo, a cada 60 segundos quando o intervalo não é configurado. Ele não segura um socket com a Meta. Ele relê o SQLite que o webhook já preencheu e, se a conta tem token e LLM, responde.

No primeiro ciclo, esse intervalo abre o contexto de cada conta ativa e o deixa no cache até o processo reiniciar. A conta parada continua aberta.

## Números medidos

`process.memoryUsage().rss` no processo que carregou o runtime de tenancy.

| Peça | Quando abre | O que a medição mostrou |
| --- | --- | --- |
| Processo com os módulos carregados | o tempo todo | cerca de 110 MB antes de qualquer conta |
| Banco de controle | o tempo todo, com tenancy ligada | cabe nesse mesmo processo; o arquivo em si é pequeno |
| Conta em arquivo local (`node:sqlite`) | no primeiro uso ou no primeiro ciclo do worker | o heap subiu cerca de 0,2 MB por conta vazia; o RSS não cresceu de forma estável em 10 contas |
| Thread libSQL, uma por conta Turso | no primeiro uso ou no primeiro ciclo, e fica viva | 1 thread: +11 MB; 2: +28 MB; 5: +79 MB; 10: +111 MB. Média nas 10: cerca de 11 MB. A segunda sozinha chegou perto de 17 MB |

A thread é o custo que importa no Turso. Cada uma é um isolate do Node, não o arquivo SQLite. O arquivo mora no Turso. A imagem mora em disco, em `tenants/{id}/media`, e só entra na RAM na hora de otimizar ou publicar aquele arquivo.

## Leitura para o VPS

Use 15 MB por conta Turso aberta como número de planejamento. A média medida foi 11 MB. O pico de uma thread passou de 15 MB.

Some o processo base. 110 MB aqui é o Node com o runtime de tenancy, sem o servidor HTTP completo e sem o admin. No servidor real o piso fica acima disso.

| Contas Turso abertas ao mesmo tempo | RAM só das threads | Processo nesta medição + threads |
| --- | --- | --- |
| 1 | 11–17 MB | cerca de 125 MB |
| 10 | cerca de 110 MB | cerca de 220 MB |
| 30 | cerca de 450 MB, a 15 MB | cerca de 560 MB |
| 50 | cerca de 750 MB, a 15 MB | cerca de 860 MB |

Modo arquivo local, sem Turso, não paga essa thread. Dez contas vazias locais não moveram o RSS de forma estável. O que cresce no disco local é o `iris.db` de cada uma e as imagens.

Esses números são de banco vazio. Consulta grande, upload com `sharp` e várias abas do admin aumentam o uso na hora e devolvem boa parte depois. O que não devolve sozinho é a thread da conta Turso deixada no cache.
