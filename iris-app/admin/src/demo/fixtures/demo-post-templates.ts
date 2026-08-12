import type { PostReplyModeSetting, PostStatus } from "@/lib/types";
import { DEMO_STORE_URL } from "@/demo/demo-brand";

const REPLY_PROMPT_LOJA = `Link da loja: ${DEMO_STORE_URL}. Priorizar dúvidas de tamanho, estoque e prazo.`;

export type DemoAssetSpec = {
  id?: string;
  filename: string;
  alt_text?: string;
  user_tags?: Array<{ username: string; x: number; y: number }>;
  width?: number;
  height?: number;
};

export type DemoPostTemplate = {
  id: string;
  caption: string;
  status?: PostStatus;
  skipCalendar?: boolean;
  collaborators?: string[];
  carousel_summary?: string;
  reply_prompt?: string;
  reply_mode?: PostReplyModeSetting;
  ig_media_id?: string;
  assets?: DemoAssetSpec[];
};

const reel = (name: string): DemoAssetSpec => ({
  filename: name,
  height: 1920,
});

/**
 * 40 templates: índices 0–9 → mês anterior; 10–24 → mês atual; 25–39 → mês seguinte.
 * Datas aplicadas em runtime por buildDemoPosts().
 */
export const DEMO_POST_TEMPLATES: DemoPostTemplate[] = [
  // —— Mês anterior (10) ——
  {
    id: "demo-post-prev-01",
    caption: `Primeiro sol forte do ano e a gente já quer linho na pele ☀️

Vestido areia + sandália rústica + café gelado na mão — esse é o mood.

Qual peça de linho vocês usam mais no calor?

#verao #linho #estudionomade`,
    ig_media_id: "17890001001112223",
    assets: [{ filename: "linho-sol.jpg" }],
  },
  {
    id: "demo-post-prev-02",
    caption: `Domingo de feira com a bolsa Nômade lotada de fruta e pão 🥖

Look confortável não precisa ser bagunça — wide leg + regata off-white e pronto.

#lifestyle #feira #estudionomade`,
    ig_media_id: "17890001002223334",
    assets: [{ filename: "feira-domingo.jpg" }],
  },
  {
    id: "demo-post-prev-03",
    caption: `3 cores que salvam qualquer armário: areia, oliva e off-white 🎨

Montamos um carrossel só com combinações que funcionam de segunda a domingo.

Salva pra consultar na hora de vestir.

#capsulewardrobe #modacasual`,
    carousel_summary: "Três paletas, três looks completos, dicas de combinação no último slide.",
    ig_media_id: "17890001003334445",
    assets: [
      { filename: "paleta-1.jpg" },
      { filename: "paleta-2.jpg" },
      { filename: "paleta-3.jpg" },
    ],
  },
  {
    id: "demo-post-prev-04",
    caption: `A bolsa Nômade nasceu de uma necessidade real: caber notebook, garrafa e a blusa extra 👜

Hoje ela é a peça mais pedida da loja — e a gente entende o porquê.

Conta aqui: o que não pode faltar na sua bolsa do dia a dia?

#totebag #estudionomade`,
    ig_media_id: "17890001004445556",
    assets: [reel("tote-origin.jpg")],
  },
  {
    id: "demo-post-prev-05",
    caption: `@marina.mods montou o look de transição outono-verão em 2 minutos 💫

Vestido linho + cinto de palha + jaqueta leve nos ombros — pronto pra noite fresca.

#collab #styling #estudionomade`,
    collaborators: ["@marina.mods"],
    ig_media_id: "17890001005556667",
    assets: [{ filename: "marina-transicao.jpg" }],
  },
  {
    id: "demo-post-prev-06",
    caption: `Pergunta que a gente recebe todo dia: "como saber se vai servir?" 📏

Por isso criamos o guia de medidas — e hoje ele já ajudou milhares de pedidos.

Link na bio se ainda não viu.

#modaconsciente #lojavirtual`,
    ig_media_id: "17890001006667778",
    reply_mode: "auto",
    assets: [{ filename: "guia-antigo.jpg" }],
  },
  {
    id: "demo-post-prev-07",
    caption: `Home office não precisa ser visual de reunião chata 💻

Regata de algodão + calça wide leg + brinco discreto — produzida sem apertar.

#trabalhoremoto #homeoffice #estudionomade`,
    ig_media_id: "17890001007778889",
    assets: [{ filename: "home-office.jpg" }],
  },
  {
    id: "demo-post-prev-08",
    caption: `Embalagem que vira ritual: papel reciclado, fita de algodão, cartão com cuidados 📦

A gente acredita que receber o pedido tem que ser tão bonito quanto vestir a peça.

#slowfashion #sustentabilidade`,
    ig_media_id: "17890001008889990",
    assets: [{ filename: "embalagem-antiga.jpg" }],
  },
  {
    id: "demo-post-prev-09",
    caption: `Wide leg oliva: a calça que virou uniforme da comunidade 🌿

Cintura alta, tecido que não marca, bolso funcional — e combina com tudo do armário.

Já tem a sua?

#wideleg #modacasual`,
    ig_media_id: "17890001009990001",
    assets: [
      { filename: "wide-leg-launch-1.jpg" },
      { filename: "wide-leg-launch-2.jpg" },
    ],
  },
  {
    id: "demo-post-prev-10",
    caption: `Vocês pediram, a gente ouviu: mais looks com a coleção cápsula no dia a dia ✨

Nos stories da semana passada mostramos 5 combinações com as mesmas 4 peças.

Qual foi a favorita de vocês?

#comunidade #estudionomade #modalifestyle`,
    status: "monitored",
    ig_media_id: "17890001010001112",
    reply_mode: "draft",
    assets: [{ filename: "comunidade-capsula.jpg" }],
  },

  // —— Mês atual (15) ——
  {
    id: "demo-post-loja",
    caption: `Novidade na loja: guia de medidas interativo 📏

Cansada de errar o tamanho comprando online? Cada produto agora tem tabela + dica de caimento.

Primeira troca grátis em 7 dias → ${DEMO_STORE_URL.replace("https://", "")}

#lojavirtual #modafeminina #estudionomade`,
    ig_media_id: "17890002223334445",
    reply_mode: "auto",
    assets: [{ filename: "guia-medidas.jpg" }],
  },
  {
    id: "demo-post-cal-02",
    caption: `Domingo de organização de armário 🧺

Três peças da cápsula que salvam a semana: vestido linho, wide leg e bolsa estruturada.

#organização #capsulewardrobe`,
    assets: [{ filename: "flatlay-armario.jpg" }],
  },
  {
    id: "demo-post-viagem",
    caption: `Mala de fim de semana com 5 peças — desafio aceito 🧳

Tudo cabe na bolsa Nômade. Lista completa no destaque "Viagem leve".

#viagem #packing #estudionomade`,
    carousel_summary: "Mala aberta, 5 peças numeradas, look no espelho.",
    ig_media_id: "17890007778889990",
    assets: [
      { filename: "mala.jpg" },
      { filename: "pecas.jpg" },
      { filename: "look-espelho.jpg" },
    ],
  },
  {
    id: "demo-post-carousel",
    caption: `Coleção cápsula verão — menos peças, mais combinações ✨

Vestido linho areia · calça wide leg oliva · cinto de palha · sandália rústica

Guia de medidas no último slide. Dúvidas de tamanho? Comenta aqui.

#modacasual #veranonômade #estudionomade`,
    status: "monitored",
    collaborators: ["@marina.mods", "@julia.style"],
    carousel_summary:
      "Lookbook: capa, vestido linho, wide leg, acessórios, tabela de medidas.",
    reply_prompt: REPLY_PROMPT_LOJA,
    reply_mode: "draft",
    ig_media_id: "17890005556667788",
    assets: [
      { filename: "capa.jpg", alt_text: "Capa lookbook verão" },
      {
        filename: "vestido-linho.jpg",
        user_tags: [{ username: "marina.mods", x: 0.42, y: 0.55 }],
      },
      {
        filename: "wide-leg.jpg",
        user_tags: [{ username: "julia.style", x: 0.68, y: 0.38 }],
      },
      { filename: "acessorios.jpg" },
      { filename: "medidas.jpg" },
    ],
  },
  {
    id: "demo-post-collab",
    caption: `Collab com @marina.mods — 2 looks só com a cápsula 💫

Look 1: vestido linho + sandália. Look 2: wide leg + cinto de palha.

Qual você usaria num almoço de domingo?

#collab #styling #estudionomade`,
    collaborators: ["@marina.mods"],
    reply_mode: "draft",
    ig_media_id: "17890006665554443",
    assets: [{ filename: "collab-look-1.jpg" }, { filename: "collab-look-2.jpg" }],
  },
  {
    id: "demo-post-failed",
    caption: `A experiência começa antes de vestir 📦

Papel reciclado, fita de algodão e um cartãozinho com os cuidados de cada peça — porque abrir o pedido também faz parte do ritual.

Conta aqui: você reutiliza a embalagem pra quê?

#unboxing #slowfashion #estudionomade`,
    status: "failed",
    assets: [reel("unboxing.mp4")],
  },
  {
    id: "demo-post-cal-07",
    caption: `Café da manhã + look confortável ☕️

Regata de algodão + calça wide leg = reunião de zoom sem sofrimento.

#rotina #homeoffice`,
    assets: [{ filename: "cafe-look.jpg" }],
  },
  {
    id: "demo-post-published",
    caption: `3 jeitos de usar a bolsa Nômade no dia a dia 👜

1. Café + notebook · 2. Feira de sábado · 3. Viagem de carro

Qual combina com a sua rotina? Comenta o número!

#totebag #stylingtips #estudionomade`,
    reply_mode: "auto",
    ig_media_id: "17890001112223344",
    assets: [reel("reel-tote.jpg")],
  },
  {
    id: "demo-post-monitored",
    caption: `Rotina de quem trabalha remoto (e ainda quer sair da pijama) ☕️

Café, pedidos da loja, look confortável e pausa do meio-dia.

Não é sobre estar produzida o tempo todo — é sobre se sentir bem.

#trabalhoremoto #slowliving #estudionomade`,
    status: "monitored",
    ig_media_id: "17890009988776655",
    assets: [{ filename: "rotina.jpg" }],
  },
  {
    id: "demo-post-scheduled",
    caption: `Verão nômade 🌿

Linho, algodão e tons areia pra quem quer leveza sem abrir mão de estilo.

No carrossel: flat lay, look no rooftop, guia de medidas e link da loja.

Salva pra montar o armário cápsula!

#lookbook #verao2026 #modasustentavel #estudionomade`,
    status: "scheduled",
    carousel_summary:
      "6 slides: capa, flat lay, look rooftop, sandália, medidas, CTA loja.",
    reply_prompt: REPLY_PROMPT_LOJA,
    reply_mode: "draft",
    assets: [
      { filename: "capa-lookbook.jpg" },
      { filename: "flat-lay.jpg" },
      { filename: "look-rooftop.jpg" },
      { filename: "close-sandalia.jpg" },
      { filename: "guia-medidas.jpg" },
      { filename: "cta-loja.jpg" },
    ],
  },
  {
    id: "demo-post-draft",
    caption: `Bastidores da cápsula verão ☀️

Paleta areia, oliva e off-white — tecido no corpo, café na mão, equipe escolhendo os melhores ângulos.

Qual vibe vocês preferem: look completo ou close de textura?

#bastidores #estudionomade #modacasual`,
    status: "draft",
    skipCalendar: true,
    assets: [
      { filename: "bastidores-1.jpg" },
      { filename: "bastidores-2.jpg" },
    ],
  },
  {
    id: "demo-post-sustentavel",
    caption: `Embalagem sustentável que faz parte da experiência 📦

Papel reciclado, fita de algodão e cartão com cuidados da peça.

Já recebeu o seu? Marca a gente nos stories!

#sustentabilidade #slowfashion`,
    ig_media_id: "17890008887776665",
    assets: [{ filename: "embalagem.jpg" }],
  },
  {
    id: "demo-post-cal-13",
    caption: `Pergunta honesta: quantas peças você usa de verdade no armário? 👀

A gente aposta em cápsula — menos decisão, mais tempo pro que importa.

#modaconsciente #minimalismo`,
    assets: [{ filename: "armario.jpg" }],
  },
  {
    id: "demo-post-cal-14",
    caption: `Detalhe que muda o look: cinto de palha no vestido linho 🌾

Acessório leve, zero esforço. Salva essa dica.

#detalhes #acessorios`,
    assets: [{ filename: "cinto-palha.jpg" }],
  },
  {
    id: "demo-post-cal-15",
    caption: `Feira de sábado com a bolsa Nômade 🥬

Look confortável, sacola reutilizável e café depois. Ritual perfeito.

#lifestyle #feira #estudionomade`,
    assets: [{ filename: "feira-tote.jpg" }],
  },

  // —— Mês seguinte (15) ——
  {
    id: "demo-post-cal-16",
    caption: `Março chegou com novidades na loja e muita inspiração de styling por aqui ✨

Tricô leve, tons musgo e aquela calça wide leg que vocês pedem todo dia.

Fica de olho nos stories — tem provador real com a equipe.

#estudionomade #novidades #modacasual`,
    status: "scheduled",
    assets: [{ filename: "agenda-mes.jpg" }],
  },
  {
    id: "demo-post-cal-17",
    caption: `Uma regata de algodão, três ocasiões 👕

Reunião de manhã, café com amiga e passeio no parque — mesma base, moods diferentes.

Qual você usaria na segunda-feira?

#modacasual #dicasdeestilo #estudionomade`,
    status: "scheduled",
    assets: [reel("reel-regata.jpg")],
  },
  {
    id: "demo-post-cal-18",
    caption: `Wide leg oliva: como usar sem parecer informal demais no trabalho 💼

Dica: blazer leve por cima ou sandália mais estruturada.

#modaprofissional #wideleg`,
    status: "scheduled",
    assets: [{ filename: "wide-leg-office.jpg" }],
  },
  {
    id: "demo-post-cal-19",
    caption: `Live shop de outono leve 🍂

Tricô fino, calça wide leg e aquela sensação de casa arrumada sem esforço.

Lista de espera na bio — quem entra recebe o link em primeira mão.

#liveshop #outonoleve #estudionomade`,
    status: "scheduled",
    carousel_summary: "Capa do evento, preview de tricô leve, data e CTA lista de espera.",
    assets: [
      { filename: "live-capa.jpg" },
      { filename: "live-preview.jpg" },
      { filename: "live-cta.jpg" },
    ],
  },
  {
    id: "demo-post-cal-20",
    caption: `Por dentro do vestido linho areia ✂️

Tecido respirável, acabamento interno reforçado e costura que aguenta o dia inteiro.

Moda feita pra durar — e pra combinar com tudo.

#slowfashion #bastidores #estudionomade`,
    status: "scheduled",
    assets: [{ filename: "costura.jpg" }, { filename: "detalhe-linho.jpg" }],
  },
  {
    id: "demo-post-cal-21",
    caption: `Compra online sem surpresa: prazo, troca e medidas 📏

Tudo que a gente mais responde na DM — agora num carrossel pra salvar.

Primeira troca grátis em 7 dias. Link da loja na bio.

#lojavirtual #modaconsciente #estudionomade`,
    status: "scheduled",
    carousel_summary: "4 slides: prazo por região, troca grátis, guia de medidas, contato.",
    reply_prompt: REPLY_PROMPT_LOJA,
    reply_mode: "draft",
    assets: [
      { filename: "faq-prazo.jpg" },
      { filename: "faq-troca.jpg" },
      { filename: "faq-medidas.jpg" },
      { filename: "faq-contato.jpg" },
    ],
  },
  {
    id: "demo-post-cal-22",
    caption: `@julia.style testou PP e M do vestido linho — e o resultado tá nos stories 💬

Caimento solto nos dois, mas a vibe muda completamente.

Qual tamanho você usaria?

#collab #modacasual #estudionomade`,
    status: "scheduled",
    collaborators: ["@julia.style"],
    assets: [{ filename: "collab-julia.jpg" }],
  },
  {
    id: "demo-post-cal-23",
    caption: `Sandália rústica: o par que não cansa no calor 🩴

Palmilha macia, salto baixo. Combine com vestido ou wide leg.

#calcados #verao`,
    status: "scheduled",
    assets: [{ filename: "sandalia.jpg" }],
  },
  {
    id: "demo-post-cal-24",
    caption: `Bolsa Nômade em terracota 🧡

A cor que vocês pediram chegou — quente, versátil e com o mesmo bolso interno que cabe notebook.

Comenta "eu quero" que a gente te marca no lançamento.

#totebag #novidade #estudionomade`,
    status: "scheduled",
    assets: [{ filename: "tote-terracota.jpg" }],
  },
  {
    id: "demo-post-cal-25",
    caption: `Mala de 48h com 4 peças da cápsula 🧳

Menos volume, mais combinação. Passo a passo no vídeo.

Salva pra copiar na próxima viagem!

#viagem #packing #estudionomade`,
    status: "scheduled",
    assets: [reel("reel-mala.jpg")],
  },
  {
    id: "demo-post-cal-26",
    caption: `"Finalmente achei calça confortável pra reunião" 💬

Mensagem real de cliente (com permissão). Vocês pedem essa indicação toda semana — então aqui está: wide leg oliva, cintura alta, tecido que não marca.

#depoimento #wideleg #estudionomade`,
    status: "scheduled",
    assets: [{ filename: "depoimento.jpg" }],
  },
  {
    id: "demo-post-cal-27",
    caption: `Outono leve: tricô fino + calça wide leg 🍁

Musgo e caramelo na paleta, conforto na medida.

Qual look você montaria com essas duas peças?

#outonoleve #modacasual #estudionomade`,
    status: "scheduled",
    assets: [
      { filename: "outono-1.jpg" },
      { filename: "outono-2.jpg" },
    ],
  },
  {
    id: "demo-post-cal-28",
    caption: `Shooting no rooftop, vento bom e paleta areia ☀️

Equipe inteira apaixonada por esse horário de luz.

Qual look vocês querem ver primeiro nos stories?

#bastidores #estudionomade`,
    status: "scheduled",
    assets: [{ filename: "rooftop-bts.jpg" }],
  },
  {
    id: "demo-post-cal-29",
    caption: `Promo de aniversário da loja — só pra quem tá na lista 💌

Cadastro no link da bio. Não vamos spammar — só o essencial.

#aniversario #promo`,
    status: "scheduled",
    assets: [{ filename: "promo-aniversario.jpg" }],
  },
  {
    id: "demo-post-cal-30",
    caption: `Live shop de outono — vagas limitadas 🍂

Quem tá na lista recebe o link antes de todo mundo. Sem spam, só o essencial.

Cadastro na bio.

#liveshop #estudionomade`,
    status: "scheduled",
    assets: [{ filename: "live-lista.jpg" }],
  },
];
