import type { DemoLocale } from "@/demo/locale";
import { DEMO_STORE_URL } from "@/demo/demo-brand";

export type DemoEditorialCopy = {
  carousel_summary: string;
  reply_prompt: string;
};

const STORE = DEMO_STORE_URL;

const LOJA_REPLY_BASE = `Tom acolhedor e direto, como quem ajuda uma amiga a escolher peça — sem pressão de venda. Este post está ligado à loja virtual (${STORE}): use o link só quando a pessoa pedir onde comprar, quiser ver tabela de medidas ou confirmar disponibilidade.

Priorize: (1) dúvidas de tamanho — oriente ao guia de medidas na ficha do produto e explique que o caimento do linho é levemente solto; (2) estoque — se não souber reposição exata, diga que vale conferir na loja ou na DM com o SKU; (3) prazo de entrega — Sul e Sudeste costumam 3–7 dias úteis, demais regiões até 12 dias úteis (valores de demonstração).

Políticas: primeira troca grátis em até 7 dias após recebimento, peça sem uso e com etiqueta. Não prometa desconto não citado na legenda. Não invente cores ou tamanhos fora do que aparece no carrossel.

Se a pergunta for só elogio, agradeça e convide a salvar o post ou visitar a loja — sem link em todo comentário.`;

/** Resumos visuais (o que há nas imagens) + briefing de resposta por post publicado. */
const DEMO_EDITORIAL_PT: Record<string, DemoEditorialCopy> = {
  "demo-post-prev-01": {
    carousel_summary: `Carrossel de 5 slides sobre verão e linho. Slide 1: capa com título “primeiro sol forte” e modelo de costas, vestido linho areia e céu azul. Slide 2: look completo — vestido midi linho, sandália rústica de couro, bolsa pequena de palha. Slide 3: close da textura do linho na luz dourada, destaque para respirabilidade. Slide 4: lifestyle no café ao ar livre, café gelado na mão, mesma peça em uso real. Slide 5: flat lay com sandália, óculos e chapéu de palha — paleta areia e off-white. Não há preço na imagem; foco é mood de verão e versatilidade do linho.`,
    reply_prompt: `${LOJA_REPLY_BASE}

Peças em destaque: vestido linho areia (coleção cápsula verão). Se perguntarem combinação, cite sandália rústica e acessórios leves da paleta areia. Comentários sobre calor/transpiração: reforce que o linho é natural e não marca com suor leve.`,
  },
  "demo-post-prev-02": {
    carousel_summary: `Carrossel de 5 slides — domingo de feira. Slide 1: modelo na entrada da feira orgânica, bolsa Nômade grande no ombro, frutas à mostra. Slide 2: look wide leg off-white + regata algodão, tom confortável. Slide 3: interior da bolsa Nômade com pão, maçãs e garrafa reutilizável. Slide 4: caminhada entre barracas, foco na praticidade do look. Slide 5: café depois da feira, mesma bolsa na cadeira. Visual limpo, luz natural, sem texto de preço nos slides.`,
    reply_prompt: `${LOJA_REPLY_BASE}

Destaque a bolsa Nômade (cabem notebook, garrafa e compras). Se perguntarem capacidade ou cores, mencione versões areia e terracota na loja. Para dúvidas de look, wide leg oliva e regata off-white são combinações da mesma cápsula.`,
  },
  "demo-post-prev-03": {
    carousel_summary: `Carrossel de 5 slides — paleta de cores do armário. Slide 1: capa “3 cores que salvam” com amostras areia, oliva e off-white. Slide 2: look monocromático areia (vestido + sandália). Slide 3: look com calça wide leg oliva e regata branca. Slide 4: combinação off-white com cinto de palha. Slide 5: colagem das três paletas lado a lado com dica de uso segunda a domingo. Conteúdo educativo de styling, sem tabela de preços.`,
    reply_prompt: `${LOJA_REPLY_BASE}

Este post é inspiracional — não empurre venda. Se pedirem links, indique a seção “cápsula” na loja. Cores oliva e areia têm estoque variável; oriente a conferir a ficha de cada peça.`,
  },
  "demo-post-prev-04": {
    carousel_summary: `Reel em formato vertical (1 vídeo): três cortes rápidos mostrando a origem da bolsa Nômade. Corte 1: modelo no café com notebook e bolsa no chão. Corte 2: feira — bolsa aberta com frutas e espaço interno visível. Corte 3: banco do carro em viagem curta, bolsa no banco do passageiro. Texto na tela em cada corte: “café + notebook”, “feira”, “viagem”. Tom storytelling sobre necessidade real do produto.`,
    reply_prompt: `${LOJA_REPLY_BASE}

Foco: bolsa Nômade. Medidas aproximadas na ficha da loja (laptop até 14"). Se compararem com tote genérica, destaque bolso interno com zíper e alça reforçada. Reel não mostra todas as cores — remeta à loja para opções.`,
  },
  "demo-post-prev-05": {
    carousel_summary: `Carrossel de 4 slides — collab @marina.mods, transição outono-verão. Slide 1: capa com as duas marcas e look de rua. Slide 2: vestido linho areia com cinto de palha, luz de fim de tarde. Slide 3: jaqueta leve nos ombros sobre o mesmo vestido — styling de temperatura amena. Slide 4: detalhe dos pés com sandália e sombra alongada. Tag de collab visível na legenda; imagens sem preço.`,
    reply_prompt: `Tom leve e de parceria — mencione @marina.mods com respeito se citarem a collab. ${LOJA_REPLY_BASE}

Peças: vestido linho areia, cinto de palha, jaqueta leve (acessório de styling, pode não estar à venda — não confirme estoque de jaqueta sem checar). Priorize dúvidas sobre o vestido e tamanhos P–GG no guia.`,
  },
  "demo-post-prev-06": {
    carousel_summary: `Carrossel de 5 slides — guia de medidas (post antigo, ainda referência). Slide 1: capa “como saber se vai servir?” com régua estilizada. Slide 2: print da tabela de busto/cintura/quadril na ficha do produto. Slide 3: foto de modelo medindo com fita métrica (didático). Slide 4: comparativo PP vs M no mesmo vestido linho. Slide 5: CTA “link na bio” com ícone de loja. Conteúdo utilitário; texto legível nos slides.`,
    reply_prompt: `${LOJA_REPLY_BASE}

Este post é o principal para dúvidas de tamanho — sempre direcione ao guia interativo atual na loja (${STORE}/medidas). Explique que entre tamanhos, quem prefere mais folga pode subir um. Não dê diagnóstico médico de medidas corporais; peça que compare com a tabela.`,
  },
  "demo-post-prev-07": {
    carousel_summary: `Carrossel de 4 slides — home office com estilo. Slide 1: setup de mesa com laptop, planta e luz de janela. Slide 2: look regata algodão cinza-claro + calça wide leg, cadeira ergonômica ao fundo. Slide 3: close do tecido da calça (não marca ao sentar). Slide 4: pausa do café na cozinha, mesmo look. Ambiente real, não editorial de estúdio; sem logos de videoconferência.`,
    reply_prompt: `${LOJA_REPLY_BASE}

Peças: regata algodão e wide leg (provavelmente oliva ou cinza conforme slide). Para “serve para reunião?”, diga que o look é confortável mas apresentável com colar ou blazer por cima. Estoque de regata: várias cores na loja.`,
  },
  "demo-post-prev-08": {
    carousel_summary: `Carrossel de 4 slides — embalagem sustentável. Slide 1: caixa fechada com fita de algodão e selo Estúdio Nômade. Slide 2: abertura mostrando papel reciclado amassado como proteção. Slide 3: cartão impresso com instruções de lavagem do linho. Slide 4: peça dobrada dentro da caixa, vestido areia visível. Foco em experiência de unboxing, não no produto em uso.`,
    reply_prompt: `Tom caloroso sobre experiência de marca — não é post de venda direta. ${LOJA_REPLY_BASE}

Se perguntarem embalagem: papel reciclado, fita de algodão reutilizável, cartão com cuidados. Não prometa personalização de embrulho. Dúvidas de pedido em andamento: peça número do pedido na DM (fluxo real fica fora do demo).`,
  },
  "demo-post-prev-09": {
    carousel_summary: `Carrossel de 5 slides — lançamento wide leg oliva. Slide 1: capa com modelo de frente, calça cintura alta. Slide 2: lateral mostrando caimento wide e bolso. Slide 3: combinação com regata off-white e sandália. Slide 4: close do tecido (algodão com elastano leve). Slide 5: depoimento estático de cliente fictício em card — “uniforme da comunidade”. Paleta verde oliva dominante.`,
    reply_prompt: `${LOJA_REPLY_BASE}

Produto âncora: calça wide leg oliva. Tamanhos 36–46 BR na tabela. Cintura alta — se a pessoa está entre números, sugira medir quadril. Comentários sobre “marca ao sentar”: reforce tecido escolhido para não marcar em uso normal.`,
  },
  "demo-post-prev-10": {
    carousel_summary: `Carrossel de 5 slides — comunidade e cápsula. Slide 1: mosaico de stories repostados de clientes. Slide 2: quatro peças da cápsula dispostas em cabide (vestido, wide leg, regata, cinto). Slide 3: look 1 montado — vestido linho. Slide 4: look 2 — wide leg + regata. Slide 5: pergunta “qual foi sua favorita?” em tipografia da marca. Post em modo monitored — expectativa de volume de comentários.`,
    reply_prompt: `Post de engajamento da comunidade; priorize respostas curtas e calorosas. ${LOJA_REPLY_BASE}

Modo draft/auto conforme config do post — se pedirem SKU das 4 peças, liste nomes genéricos da cápsula verão e link da coleção. Agradeça quem compartilhar foto própria; não reposte imagem de terceiros sem permissão.`,
  },
  "demo-post-loja": {
    carousel_summary: `Carrossel de 5 slides sobre o guia de medidas interativo na loja. Slide 1: mockup da página do guia no celular. Slide 2: tabela de busto/cintura/quadril com destaque em amarelo. Slide 3: dica de caimento “linho solto vs justo”. Slide 4: print do botão “primeira troca grátis”. Slide 5: QR/link visual para ${STORE.replace("https://", "")}. Conteúdo de produto digital + política comercial.`,
    reply_prompt: `${LOJA_REPLY_BASE}

Este é o post principal de conversão para a loja — pode incluir o link ${STORE} quando relevante. Explique passo a passo: abrir ficha do produto → aba medidas → comparar com fita. Troca grátis 7 dias é política ativa; detalhe que a etiqueta deve estar intacta.`,
  },
  "demo-post-carousel": {
    carousel_summary: `Lookbook cápsula verão — 5 slides. Slide 1: capa “coleção cápsula” com paleta areia e oliva. Slide 2: vestido linho areia em corpo inteiro, tag @marina.mods no quadril. Slide 3: calça wide leg oliva, tag @julia.style. Slide 4: flat lay de cinto de palha e sandália rústica. Slide 5: tabela de medidas com linhas P–GG e nota de caimento. Conteúdo de venda suave com foco em combinações.`,
    reply_prompt: `${LOJA_REPLY_BASE}

Peças nomeadas na legenda: vestido linho areia, wide leg oliva, cinto de palha, sandália rústica. Collabs @marina.mods e @julia.style — não confunda com estoque de parceiros. Reposição de P no vestido é dúvida frequente: verificar estoque ao vivo na loja antes de prometer data.`,
  },
  "demo-post-viagem": {
    carousel_summary: `Carrossel de 5 slides — mala de fim de semana. Slide 1: mala aberta na cama, organização por cores. Slide 2: cinco peças numeradas (vestido, wide leg, regata, cinto, sandália). Slide 3: tudo dentro da bolsa Nômade fechada. Slide 4: look montado no espelho do hotel. Slide 5: checklist escrito à mão “5 peças / 3 looks”. Sem vídeo; foco em packing list visual.`,
    reply_prompt: `${LOJA_REPLY_BASE}

Destaque bolsa Nômade como peça de viagem. Se pedirem lista das 5 peças, repita da legenda e mencione destaque “Viagem leve” no perfil (fictício). Dúvidas de tamanho para viagem: sugira tecidos que não amassam (linho da marca com blend leve).`,
  },
  "demo-post-collab": {
    carousel_summary: `Carrossel de 4 slides com @marina.mods. Slide 1: apresentação collab, logos das duas contas. Slide 2: look 1 — vestido linho + sandália, almoço de domingo (mesa ao fundo). Slide 3: look 2 — wide leg + cinto de palha + regata. Slide 4: as duas peças lado a lado no cabide. Estética de styling, luz natural.`,
    reply_prompt: `Tom de parceria criativa. ${LOJA_REPLY_BASE}

Se perguntarem qual look para evento específico, ajude a escolher entre look 1 (mais leve) e look 2 (mais estruturado). Mencione @marina.mods quando citarem a collab.`,
  },
  "demo-post-published": {
    carousel_summary: `Reel vertical — “3 jeitos de usar a bolsa Nômade”. Corte 1: café com notebook deslizando para dentro da bolsa. Corte 2: feira de sábado, hortifrúti no bolso interno. Corte 3: viagem de carro, bolsa no banco com casaco por cima. Numeração 1-2-3 na tela; duração curta (~15s).`,
    reply_prompt: `${LOJA_REPLY_BASE}

Incentive comentários com número do uso favorito (1 café, 2 feira, 3 viagem). Responda personalizando conforme a rotina que a pessoa descrever. Link da bolsa Nômade na loja se pedirem compra.`,
  },
  "demo-post-monitored": {
    carousel_summary: `Carrossel de 4 slides — rotina home office. Slide 1: mesa com café e laptop, luz de manhã. Slide 2: look confortável regata + wide leg, sem sapato de salto. Slide 3: pausa do meio-dia, mesma roupa na varanda. Slide 4: texto “não é sobre estar produzida o tempo todo” sobre foto suave. Tom de slow living.`,
    reply_prompt: `Post de lifestyle — respostas empáticas, sem tom de vendedor agressivo. ${LOJA_REPLY_BASE}

Se compartilharem rotina parecida, valide e pergunte o que ajuda no conforto. Só ofereça link da loja se pedirem peça do look.`,
  },
  "demo-post-sustentavel": {
    carousel_summary: `Carrossel de 4 slides — embalagem sustentável (versão atual). Slide 1: pacote fechado com fita de algodão. Slide 2: mãos abrindo papel reciclado. Slide 3: cartão de cuidados com ícones de lavagem. Slide 4: cliente segurando vestido recém-aberto, sorriso. Foco ESG e experiência, não catálogo.`,
    reply_prompt: `Priorize conversa sobre sustentabilidade e cuidado. ${LOJA_REPLY_BASE}

Materiais: papel reciclado, fita algodão reutilizável. Se criticarem plástico, explique que a marca evita plástico bolha em pedidos nacionais demo. Pedidos de troca seguem política padrão 7 dias.`,
  },
};

const DEMO_EDITORIAL_EN: Record<string, DemoEditorialCopy> = {
  "demo-post-prev-01": {
    carousel_summary: `Five-slide carousel on summer linen. Slide 1: cover “first strong sun,” model from behind in sand linen dress, blue sky. Slide 2: full look — midi linen dress, rustic leather sandals, small straw bag. Slide 3: close-up of linen weave in golden light, breathability highlight. Slide 4: outdoor café lifestyle, iced coffee, same dress in real use. Slide 5: flat lay with sandals, sunglasses, straw hat — sand and off-white palette. No prices on images; mood and versatility focus.`,
    reply_prompt: `Warm, direct tone — like helping a friend choose, no hard sell. Store: ${STORE}. Share the link when they ask where to buy, sizing, or stock.

Priority: (1) sizing — point to the product size guide, linen runs slightly relaxed; (2) stock — if unsure on restock, suggest checking the store; (3) delivery — demo SLA 3–7 business days south/southeast, up to 12 elsewhere.

Free first exchange within 7 days, unworn with tags. Don’t promise discounts not in the caption.

Featured: sand linen dress (summer capsule). For styling questions, mention rustic sandals and sand palette accessories.`,
  },
  "demo-post-prev-02": {
    carousel_summary: `Five slides — Sunday market. Slide 1: model at organic market entrance, large Nômade bag, fruit visible. Slide 2: off-white wide leg + cotton tank, comfortable look. Slide 3: inside the Nômade bag with bread, apples, reusable bottle. Slide 4: walking between stalls, practical outfit. Slide 5: coffee after market, same bag on chair. Clean natural light, no price overlays.`,
    reply_prompt: `Warm tone. Store: ${STORE} for bag colors and sizing. Highlight Nômade bag (fits laptop, bottle, groceries). Wide leg olive and off-white tank are from the same capsule for outfit questions.`,
  },
  "demo-post-prev-03": {
    carousel_summary: `Five slides — wardrobe color palette. Slide 1: cover “3 colors that save any closet” with sand, olive, off-white swatches. Slide 2: monochromatic sand look (dress + sandal). Slide 3: olive wide leg + white tank. Slide 4: off-white with straw belt. Slide 5: three palettes side by side with weekday styling tips. Educational, no price table.`,
    reply_prompt: `Inspirational post — don’t push sale. If they want links, point to the capsule section at ${STORE}. Olive and sand stock varies by SKU.`,
  },
  "demo-post-prev-04": {
    carousel_summary: `Vertical reel (single video): three quick cuts on the Nômade bag origin story. Cut 1: café with laptop and bag on floor. Cut 2: market — open bag with fruit and visible interior. Cut 3: car trip, bag on passenger seat. On-screen labels: “café + laptop,” “market,” “trip.” Storytelling tone.`,
    reply_prompt: `Store: ${STORE}. Focus on Nômade bag — laptop up to 14", zippered inner pocket, reinforced strap. Reel doesn’t show all colors; send them to the store.`,
  },
  "demo-post-prev-05": {
    carousel_summary: `Four slides — @marina.mods collab, summer-to-fall transition. Slide 1: street look, both brands. Slide 2: sand linen dress with straw belt, golden hour. Slide 3: light jacket on shoulders over same dress. Slide 4: feet detail with sandals. Collab tag in caption; no prices on images.`,
    reply_prompt: `Partnership tone — credit @marina.mods when relevant. Store: ${STORE} for dress sizing P–GG. Light jacket is styling; don’t confirm jacket stock without checking.`,
  },
  "demo-post-prev-06": {
    carousel_summary: `Five slides — sizing guide (legacy but still referenced). Slide 1: cover “how to know if it fits?” with stylized ruler. Slide 2: bust/waist/hip table on product page. Slide 3: model measuring with tape (educational). Slide 4: PP vs M on same linen dress. Slide 5: “link in bio” CTA with store icon.`,
    reply_prompt: `Main sizing post — always direct to ${STORE}/measurements. Between sizes, suggest sizing up for a looser linen fit. Don’t give medical body advice; compare to the chart.`,
  },
  "demo-post-prev-07": {
    carousel_summary: `Four slides — styled home office. Slide 1: desk with laptop, plant, window light. Slide 2: light gray cotton tank + wide leg, ergonomic chair behind. Slide 3: fabric close-up (doesn’t mark when sitting). Slide 4: coffee break in kitchen, same outfit. Real home, not studio.`,
    reply_prompt: `Store: ${STORE}. Pieces: cotton tank and wide leg. For “Zoom-ready?” — comfortable but presentable; add necklace or blazer. Tank available in multiple colors.`,
  },
  "demo-post-prev-08": {
    carousel_summary: `Four slides — sustainable packaging. Slide 1: closed box with cotton tape and Estúdio Nômade seal. Slide 2: opening with crumpled recycled paper padding. Slide 3: printed care card for linen washing. Slide 4: folded sand dress inside box. Unboxing experience focus.`,
    reply_prompt: `Warm brand-experience tone. Recycled paper, cotton tape, care card. Don’t promise gift wrapping.customization. Order status: ask for order number in DM (out of demo scope).`,
  },
  "demo-post-prev-09": {
    carousel_summary: `Five slides — olive wide leg launch. Slide 1: front view, high waist. Slide 2: side view, wide leg and pocket. Slide 3: with off-white tank and sandals. Slide 4: cotton-elastane fabric close-up. Slide 5: static “community uniform” quote card. Olive green dominant.`,
    reply_prompt: `Store: ${STORE}. Anchor SKU: olive wide leg, sizes 36–46 BR. High waist — measure hips if between sizes. Reassure on sitting marks with chosen fabric.`,
  },
  "demo-post-prev-10": {
    carousel_summary: `Five slides — community capsule. Slide 1: repost mosaic of customer stories. Slide 2: four capsule pieces on hangers. Slide 3: look 1 linen dress. Slide 4: look 2 wide leg + tank. Slide 5: “which was your favorite?” typography. High comment volume expected (monitored).`,
    reply_prompt: `Community engagement — short warm replies. Store: ${STORE} for capsule collection link if asked. Thank photo shares; don’t repost third-party images without permission.`,
  },
  "demo-post-loja": {
    carousel_summary: `Five slides on the interactive size guide. Slide 1: mobile mockup of the guide. Slide 2: measurement table highlighted. Slide 3: “linen relaxed vs fitted” tip. Slide 4: “free first exchange” badge. Slide 5: link visual to ${STORE.replace("https://", "")}.`,
    reply_prompt: `Primary conversion post — ${STORE} link when relevant. Step-by-step: product page → measurements tab → compare with tape. Free 7-day exchange with tags intact.`,
  },
  "demo-post-carousel": {
    carousel_summary: `Summer capsule lookbook — 5 slides. Slide 1: cover, sand and olive palette. Slide 2: sand linen dress, @marina.mods tag. Slide 3: olive wide leg, @julia.style tag. Slide 4: straw belt and rustic sandals flat lay. Slide 5: P–GG size chart with fit note.`,
    reply_prompt: `Store: ${STORE}. Named pieces in caption. Collabs are partners — don’t confuse with their stock. Frequent question: size P dress restock — check live inventory before promising dates.`,
  },
  "demo-post-viagem": {
    carousel_summary: `Five slides — weekend bag. Slide 1: open suitcase on bed. Slide 2: five numbered pieces. Slide 3: everything inside closed Nômade bag. Slide 4: mirror outfit at hotel. Slide 5: handwritten “5 pieces / 3 looks” checklist.`,
    reply_prompt: `Store: ${STORE}. Nômade bag for travel. List five pieces from caption if asked. Linen blend resists wrinkling for trips.`,
  },
  "demo-post-collab": {
    carousel_summary: `Four slides with @marina.mods. Slide 1: collab intro. Slide 2: look 1 linen dress + sandals, Sunday lunch vibe. Slide 3: look 2 wide leg + straw belt + tank. Slide 4: both outfits on hangers.`,
    reply_prompt: `Creative partnership tone. Store: ${STORE}. Help choose look 1 (lighter) vs look 2 (more structured). Credit @marina.mods.`,
  },
  "demo-post-published": {
    carousel_summary: `Vertical reel — “3 ways to use the Nômade bag.” Cut 1: café + laptop. Cut 2: Saturday market produce in inner pocket. Cut 3: car trip on passenger seat. Numbered 1-2-3 on screen (~15s).`,
    reply_prompt: `Store: ${STORE}. Invite favorite number replies; personalize to their routine. Bag product link when they want to buy.`,
  },
  "demo-post-monitored": {
    carousel_summary: `Four slides — WFH routine. Slide 1: morning desk and coffee. Slide 2: tank + wide leg, no heels. Slide 3: midday balcony break. Slide 4: quote overlay on soft photo.`,
    reply_prompt: `Empathetic lifestyle tone. Store: ${STORE} only if they ask for the outfit pieces. Validate similar routines.`,
  },
  "demo-post-sustentavel": {
    carousel_summary: `Four slides — sustainable packaging (current). Slide 1: sealed package with cotton tape. Slide 2: hands opening recycled paper. Slide 3: care card with wash icons. Slide 4: customer holding new dress.`,
    reply_prompt: `Lead with sustainability and care. Store: ${STORE}. Materials: recycled paper, reusable cotton tape. Standard 7-day exchange policy.`,
  },
};

export function getDemoEditorialCopy(
  postId: string,
  locale: DemoLocale,
): DemoEditorialCopy | null {
  const table = locale === "en" ? DEMO_EDITORIAL_EN : DEMO_EDITORIAL_PT;
  return table[postId] ?? null;
}
