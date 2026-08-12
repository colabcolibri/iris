/** Limites alinhados ao comportamento real de comentários no Instagram + persona Iris. */
export const DEMO_USER_COMMENT_MAX = 140;
export const DEMO_BRAND_COMMENT_MIN = 200;
export const DEMO_BRAND_COMMENT_MAX = 300;

export type CommentTurn = { author: "user" | "brand"; text: string };

function brand(
  body: string,
  signer: "equipe" | "julia" | "ana" = "equipe",
): string {
  if (body.includes("Estúdio Nômade")) return body;
  const line =
    signer === "julia"
      ? "Julia, Estúdio Nômade"
      : signer === "ana"
        ? "Ana, Estúdio Nômade"
        : "Equipe Estúdio Nômade 💛";
  return `${body}\n${line}`;
}

/** Threads 6–8 turnos — trocas elaboradas, algumas com mensagens ~300 caracteres. */
export const ELABORATE_THREADS: CommentTurn[][] = [
  [
    {
      author: "user",
      text: "Vi o carrossel e lembrei do verão passado viajando com uma mala só. Quero voltar a me vestir assim — o vestido linho areia marca no quadril? Tenho 1,63 e curvas.",
    },
    {
      author: "brand",
      text: brand(
        "Que lindo reler isso — viajar leve é exatamente a filosofia da cápsula ☀️ Sobre o vestido areia: o corte tem folga intencional no quadril e o linho amassa com charme, não com “marca” de apertado. Na página do produto o guia indica medir quadril e busto deitados; entre dois tamanhos, muita gente com curva prefere o maior no busto e ajusta cintura com cinto.",
        "julia",
      ),
    },
    {
      author: "user",
      text: "Uso M em vestido de festa e 38 em calça jeans. Fico entre P e M. Vou num casamento de dia no sábado — se pedir hoje chega?",
    },
    {
      author: "brand",
      text: brand(
        "Com 38 em jeans, geralmente M no vestido linho fica confortável sem ficar caixa. Pra POA e região Sul, a média é 5–8 dias úteis após confirmação do pagamento — casamento no sábado com pedido hoje pode apertar, depende do CEP. Pix confirma em minutos; rastreio vai pro e-mail. Se quiser, abre o carrinho e manda o CEP no DM que a gente olha o prazo estimado antes de você fechar.",
      ),
    },
    {
      author: "user",
      text: "Perfeito, vou tentar o M então. Vocês repõem P com frequência? Minha irmã quer igual mas só veste P.",
    },
    {
      author: "brand",
      text: brand(
        "O P costuma girar rápido no verão — quando esgota, a lista de espera na página do produto avisa por e-mail assim que repõe. Pra sua irmã, vale reservar na lista hoje; não prometemos data exata, mas repomos em ciclos curtos nessa peça. Enquanto isso, o guia de medidas ajuda a comparar P x M se ela estiver na dúvida.",
      ),
    },
    {
      author: "user",
      text: "Obrigada pela paciência! Comprei o M e já indiquei o guia pra ela. Vocês convertem curiosidade em confiança mesmo — raro em loja online.",
    },
    {
      author: "brand",
      text: brand(
        "Ficamos muito felizes com esse feedback — foi pra isso que a Ana criou a marca: menos ansiedade na hora de escolher tamanho, mais peça que você usa de verdade. Quando o vestido chegar, marca a gente nos stories se quiser; adoramos ver o linho areia na vida real. Bom casamento no sábado! ✨",
        "ana",
      ),
    },
  ],
  [
    {
      author: "user",
      text: "A calça wide leg mudou minha cabeça sobre conforto no escritório. Mas fico insegura: parece que “engordo” visualmente ou é impressão minha?",
    },
    {
      author: "brand",
      text: brand(
        "Boa pergunta — e super válida. Wide leg de propósito alonga a silhueta quando o comprimento bate no dorso do sapato e a cintura está no lugar certo. Se a sensação é de “volume”, testa com regata mais justa em cima e sandália ou tênis branco — equilíbrio de proporção. A oliva do post é neutra e não chama atenção pro quadril; chama pro caimento.",
        "julia",
      ),
    },
    {
      author: "user",
      text: "Trabalho híbrido 3x na empresa. Queria uma calça que não pareça pijama em reunião mas não aperte como skinny. A wide leg serve?",
    },
    {
      author: "brand",
      text: brand(
        "Serve muito — é um dos usos que mais ouvimos. Linho + algodão na parte superior, wide leg embaixo: conforto de home office com cara de “montei um look”. Pro escritório, fecha com mocassim ou sandália mais coberta; pro remoto, pantufa aceita 😄 O guia no destaque “Medidas” mostra cintura e comprimento interno pra você não errar na numeração.",
      ),
    },
    {
      author: "user",
      text: "Uso 40 em calça social. Wide leg M ou G?",
    },
    {
      author: "brand",
      text: brand(
        "Com 40 social, em geral M na wide leg oliva fica na medida wide confortável; se você gosta de mais folga na cintura, G pode funcionar com cinto. Mede cintura e quadril em superfície plana — igual explicamos no slide 2 do guia — e compara com a tabela. Se quiser, responde aqui busto/cintura/quadril que a gente chuta o tamanho antes de você comprar.",
      ),
    },
  ],
  [
    {
      author: "user",
      text: "Comprei a bolsa Nômade no mês passado achando que era “só mais uma bolsa”. Virou minha companheira de café, mercado e ida pro coworking. As alças aguentam notebook + garrafa mesmo?",
    },
    {
      author: "brand",
      text: brand(
        "Que relato lindo — é exatamente o uso que desenhamos: rotina corrida, uma peça que não te abandona 💛 As alças são algodão cru reforçado e o fundo comporta MacBook 13” com folga + garrafa; fecho magnético segura sem gritar “bolsa técnica”. Se um dia notar desgaste na alça, chama no DM com foto que a gente orienta cuidado ou troca se for defeito de costura.",
      ),
    },
    {
      author: "user",
      text: "Tem previsão de terracota ou outra cor? O cru combina com tudo mas queria um tom pro outono.",
    },
    {
      author: "brand",
      text: brand(
        "Terracota suave está no pipeline das próximas semanas — newsletter e lista de espera avisam em primeira mão. O cru foi proposital como base de cápsula; terracota entra como “acento” de estação sem brigar com areia e oliva. Comenta “eu quero” aqui se quiser que a gente te lembre quando subir, ou entra na lista na loja.",
      ),
    },
    {
      author: "user",
      text: "Feito! Obrigada por responder com calma — parece conversa de verdade, não robô.",
    },
    {
      author: "brand",
      text: brand(
        "A gente leva isso a sério: comentário é porta da loja, não checklist. Obrigada por confiar na bolsa e por dividir como ela entrou na sua rotina — histórias assim alimentam a próxima coleção. Quando a terracota chegar, te esperamos por aqui 🙌",
        "ana",
      ),
    },
  ],
  [
    {
      author: "user",
      text: "Quase desisti de comprar roupa online de novo depois de 3 trocas em outras marcas. O guia de medidas de vocês foi o que me fez tentar mais uma vez — e acertou de primeira.",
    },
    {
      author: "brand",
      text: brand(
        "Obrigada por contar isso — sei o quanto três trocas esgotam. O guia nasceu depois de muita conversa com clientes frustradas: medida em superfície plana, sem esticar tecido, e dica de caimento por peça (wide vs justa). Ficamos felizes que funcionou pra você; se um dia errar, primeira troca em 7 dias continua valendo, com frete de devolução por nossa conta na primeira vez.",
      ),
    },
    {
      author: "user",
      text: "Medi com fita em casa seguindo o vídeo do destaque. Vestido M ficou como na modelo do carrossel. Vocês pretendem vídeo assim pra calça também?",
    },
    {
      author: "brand",
      text: brand(
        "Sim — calça wide leg está na fila de conteúdo de medidas; o desafio é mostrar cintura vs quadril sem câmera enganar. Enquanto isso, o slide 2 do guia na loja já diferencia “medida do corpo” de “medida da peça”. Salva o destaque “Medidas” que avisamos quando o vídeo novo subir.",
      ),
    },
    {
      author: "user",
      text: "Salvei! Indiquei pra duas amigas que também trabalham remoto.",
    },
    {
      author: "brand",
      text: brand(
        "Indicação de amiga é o melhor elogio. Se elas tiverem dúvida de tamanho, manda aqui que respondemos igual — sem pressa de fechar carrinho. Boa semana de looks confortáveis ☀️",
      ),
    },
  ],
  [
    {
      author: "user",
      text: "@marina.mods no look 1 ficou impecável 😍 Queria entender se o vestido areia dela é o mesmo do site ou versão de styling.",
    },
    {
      author: "brand",
      text: brand(
        "É o mesmo vestido linho areia da loja — Marina estilizou com sandália rústica e cinto de palha do nosso acervo. Collab é assim: peça real, look que você reproduz. Look 2 usa wide leg oliva da cápsula; se quiser montar os dois com estoque atual, link na bio e guia de medidas no último slide do carrossel.",
        "julia",
      ),
    },
    {
      author: "user",
      text: "Look 2 serviria pra escritório criativo? Ou é casual demais?",
    },
    {
      author: "brand",
      text: brand(
        "Escritório criativo costuma aceitar wide leg + regata estruturada + mocassim ou sandália fechada. Troca pantufa por sapato e adiciona blazer leve se a cultura pedir mais formalidade. A calça não é jeans — o linho/algodão passa mais “montada” que weekend puro.",
      ),
    },
    {
      author: "user",
      text: "Perfeito, vou testar segunda-feira. Obrigada Marina e equipe!",
    },
    {
      author: "brand",
      text: brand(
        "Marina vai adorar ler — repassamos o carinho! Marca a gente se postar o look de segunda; adoramos ver styling real no feed da comunidade ✨",
      ),
    },
  ],
  [
    {
      author: "user",
      text: "Abri o pacote e quase guardei a caixa de papel — ficou bonita demais na estante. Vocês pensam em moda e em ritual de receber, né?",
    },
    {
      author: "brand",
      text: brand(
        "Exatamente — embalagem faz parte da experiência, não só proteção. Papel reciclado, fita de algodão reutilizável e cartão com cuidados da peça (linho à mão, sombra). A ideia é você reusar: fita no caderno, cartão como marcador, caixa pra organizar lenços. Slow fashion também é menos lixo no lixo comum 📦",
        "ana",
      ),
    },
    {
      author: "user",
      text: "Tem plano de refil ou embalagem ainda mais enxuta? Compro pouco mas penso nisso.",
    },
    {
      author: "brand",
      text: brand(
        "Estamos testando envelope mais compacto pra peças únicas sem perder proteção — acompanha nos stories quando validarmos. Enquanto isso, cada feedback como o seu entra na planilha de fornecedor. Obrigada por comprar pouco e pensar muito; é o cliente que a gente quer crescer junto.",
      ),
    },
    {
      author: "user",
      text: "Isso me convenceu a voltar na próxima coleção.",
    },
    {
      author: "brand",
      text: brand(
        "Ficamos honradas. Quando a terracota e os novos básicos subirem, newsletter avisa — sem spam, só lançamento e reposição. Até lá, cuida bem do linho e nos chama se precisar de dica de lavagem.",
      ),
    },
  ],
  [
    {
      author: "user",
      text: "Trabalho remoto desde 2020 e cansei de blusa “de videochamada” que pinica depois. O look do post parece confortável sem parecer que acordei há 5 minutos.",
    },
    {
      author: "brand",
      text: brand(
        "Essa é a linha fina que a gente persegue: conforto que não humilha na call 😄 Regata de algodão médio + wide leg = tronco limpo na câmera, perna livre fora. Não é pijama porque o caimento tem intenção — paleta neutra, tecido com corpo. Se marcar soutien claro, nosso algodão não é transparente no uso normal; se for muito claro, camiseta por baixo resolve.",
      ),
    },
    {
      author: "user",
      text: "A regata marca com soutien bege? Uso 40 min de call seguidos e suor leve.",
    },
    {
      author: "brand",
      text: brand(
        "Bege costuma passar bem; se suar muito, prefira off-white da coleção — mesmo tecido, um tom mais seguro na câmera. Lava delicado pra manter o toque; evita secadora que pode encolher algodão levemente. Pra call longa, leva cardigan leve: estilo e plano B se o ar-condicionado gelar.",
      ),
    },
    {
      author: "user",
      text: "Montei carrinho com regata + calça. Pix confirma na hora mesmo?",
    },
    {
      author: "brand",
      text: brand(
        "Pix confirma em minutos na maioria dos bancos — pedido entra na fila de separação no mesmo dia útil se pagar até o horário de corte. Rastreio chega no e-mail e na área do cliente. Qualquer trava no checkout, print no DM que a gente destrava com você.",
      ),
    },
  ],
  [
    {
      author: "user",
      text: "Moro em Porto Alegre e já tive atraso com outras lojas no Sul. Qual a experiência real de vocês? Preciso de um presente pro dia 20.",
    },
    {
      author: "brand",
      text: brand(
        "Transparência total: pro Sul trabalhamos com média de 5–8 dias úteis após confirmação do pagamento — capital tende pro menor fim. Não prometemos milagre no dia 20 sem ver CEP e data do pedido, mas Pix hoje + POA costuma caber com folga moderada. Rastreio no e-mail; se passar do prazo estimado dos Correios, área do cliente ou DM que a gente acompanha com você.",
      ),
    },
    {
      author: "user",
      text: "Se atrasar por culpa dos Correios vocês ajudam ou só “aguardar”?",
    },
    {
      author: "brand",
      text: brand(
        "Ajudamos sim — não sumimos depois da venda. Abre ticket na área do cliente com o rastreio parado; em 1–2 dias úteis respondemos com orientação ou reenvio conforme caso. Presente pro dia 20: se quiser, manda CEP no DM antes de pagar que confirmamos janela realista.",
      ),
    },
    {
      author: "user",
      text: "Mandei DM com CEP. Obrigada por não ser resposta automática de uma linha.",
    },
    {
      author: "brand",
      text: brand(
        "Vamos olhar o CEP no DM com calma. Obrigada pela paciência — presente que chega na hora certa vale mais que promessa vazia. Qualquer novidade te respondemos por lá ainda hoje.",
      ),
    },
  ],
  [
    {
      author: "user",
      text: "Salvei o carrossel de mala de fim de semana — viajo sexta e volto domingo com mala de cabine só. A sandália rústica aguenta caminhada em pedra?",
    },
    {
      author: "brand",
      text: brand(
        "Que viagem boa! Sandália rústica aguenta passeio leve e cidade — soleado, calçada, café. Pedra irregular o dia inteiro pode cansar como qualquer flat; pra trilha pesada leva tênis na mala e sandália na ida pro jantar. O carrossel mostra exatamente o combo 5 peças + bolsa Nômade; lista completa no destaque “Viagem leve”.",
        "julia",
      ),
    },
    {
      author: "user",
      text: "Levo tênis na mala e sandália no pé na ida então. A bolsa entra como item pessoal na cabine?",
    },
    {
      author: "brand",
      text: brand(
        "Na maioria das companhias cabe embaixo do assento ou no overhead se não estiver lotado — a bolsa Nômade é compacta quando vazia e flexível. Notebook 13” + necessaire + casaco leve é o kit que clientes relatam sem stress. Confere regra da sua cia, mas não é mala de mão gigante.",
      ),
    },
    {
      author: "user",
      text: "Fechado. Comprei o cinto de palha junto — amarra o vestido na cintura na foto 3?",
    },
    {
      author: "brand",
      text: brand(
        "Exatamente — cinto de palha no vestido linho define cintura sem perder o caimento solto. Look 3 do carrossel é o mais “jantar de viagem”. Boa viagem sexta; marca stories se montar a mala com as 5 peças 🧳",
      ),
    },
  ],
  [
    {
      author: "user",
      text: "Tenho medo de comprar e não servir de novo. Vocês fazem troca sem burocracia infernal? Já chorei em chat de outra loja.",
    },
    {
      author: "brand",
      text: brand(
        "Sinto muito pelas experiências anteriores — burocracia mata confiança. Aqui: primeira troca grátis em até 7 dias corridos após receber, produto sem uso com etiquetas. Abre na área do cliente; respondemos em 1–2 dias úteis com etiqueta de devolução. Na primeira troca o frete de volta é por nossa conta. Segunda troca aí sim o frete volta pro cliente.",
      ),
    },
    {
      author: "user",
      text: "E se for só tamanho errado por 2 cm na cintura? Não é “sem uso” se experimentei em casa?",
    },
    {
      author: "brand",
      text: brand(
        "Experimentar em casa com cuidado — sem odor, sem etiqueta cortada — entra no critério de troca de tamanho. 2 cm na cintura às vezes resolve com cinto ou outro tamanho; se preferir trocar, guia de medidas na solicitação ajuda a acertar na segunda vez. A gente prefere você usar a peça certa do que guardar no armário.",
      ),
    },
    {
      author: "user",
      text: "Ok, vou medir de novo e pedir. Obrigada por explicar sem copypaste.",
    },
    {
      author: "brand",
      text: brand(
        "Mede com calma; se quiser cola busto/cintura/quadril aqui antes de fechar. Tamanho certo é metade da experiência Nômade. Estamos por aqui 💛",
      ),
    },
  ],
  [
    {
      author: "user",
      text: "Li o post do armário cápsula e percebi que uso 20% das roupas 80% do tempo. Queria começar devagar — qual peça vocês indicam como primeira se só puder uma agora?",
    },
    {
      author: "brand",
      text: brand(
        "Começo devagar é o melhor caminho — cápsula não é comprar tudo de uma vez. Se só uma: vestido linho areia ou wide leg oliva, depende da sua rotina. Muita reunião e calor? Vestido. Dia a dia misto? Wide leg combina com tudo do post. As duas transitam café, mercado e jantar com troca de sapato.",
        "julia",
      ),
    },
    {
      author: "user",
      text: "Rotina híbrida, 3 dias escritório. Wide leg então. Cor oliva desbota?",
    },
    {
      author: "brand",
      text: brand(
        "Oliva foi testada em lavagens repetidas em ciclo delicado — desbotar leve é natural em tingimento vegetal, mas não vira cinza no primeiro mês se seguir cartão de cuidados. Lava do avesso, água fria, sombra. É cor de cápsula justamente por combinar com areia, off-white e cru sem brigar.",
      ),
    },
    {
      author: "user",
      text: "Obrigada — parece conversa de styling, não só venda.",
    },
    {
      author: "brand",
      text: brand(
        "É o que a Ana quer no perfil: menos gatilho, mais armário que funciona. Quando a wide leg chegar, volta aqui se quiser ideia de 3 looks com a mesma calça — adoramos esse tipo de conversa ✨",
        "ana",
      ),
    },
  ],
];

/** Threads 4–5 turnos — meio termo entre elaborado e par simples. */
export const MEDIUM_THREADS: CommentTurn[][] = [
  [
    {
      author: "user",
      text: "O linho areia do segundo slide é o mesmo tom do site? Na tela do celular parece mais bege.",
    },
    {
      author: "brand",
      text: brand(
        "Variação de tela é real — luz do shooting deixa mais areia, celular no automático pode puxar bege. No site temos foto neutra e descrição “areia acinzentado”. Se na dúvida entre areia e off-white, areia tem mais calor; off-white é mais frio. Guia de medidas no último slide ajuda a visualizar no corpo.",
      ),
    },
    {
      author: "user",
      text: "Perfeito, quero o mais areia mesmo. Tem cupom primeira compra?",
    },
    {
      author: "brand",
      text: brand(
        "Newsletter na bio dá 10% na primeira compra — vale testar antes de fechar carrinho. Se já estiver inscrita e não chegou, olha spam ou manda e-mail no contato da loja que reenviamos. Sem cupom inventado aqui: só o que está no site oficial.",
      ),
    },
  ],
  [
    {
      author: "user",
      text: "Parcelamento em 4x sem juros vale pra todo Brasil? Cartão Nubank passa?",
    },
    {
      author: "brand",
      text: brand(
        "4x sem juros no cartão de crédito nas condições do checkout — Nubank costuma passar como qualquer bandeira, mas aprovação é do banco. Pix à vista confirma rápido se preferir. Valor mínimo e regras aparecem na etapa de pagamento antes de você confirmar.",
      ),
    },
    {
      author: "user",
      text: "Pix então — pedido de ontem já tem rastreio?",
    },
    {
      author: "brand",
      text: brand(
        "Rastreio em geral sai em 1–2 dias úteis após confirmação do pagamento. Checa e-mail e área do cliente; se passou disso, manda número do pedido no DM que localizamos o status interno sem te deixar no vácuo.",
      ),
    },
  ],
  [
    {
      author: "user",
      text: "Vestido serve pra amamentar? Decote parece ok no foto mas tenho bebê de 4 meses.",
    },
    {
      author: "brand",
      text: brand(
        "Decote permite acesso discreto em muitas posições, mas cada corpo é diferente — guia de medidas + foto de cliente no destaque ajudam. Se prioridade é amamentar sem esforço, regata off-white + saia wide pode ser combo mais flexível. Primeira troca em 7 dias existe se experimentar em casa e não servir.",
      ),
    },
    {
      author: "user",
      text: "Boa, vou olhar o destaque. Frete grátis existe?",
    },
    {
      author: "brand",
      text: brand(
        "Frete grátis acima de R$ 299 no Sudeste nas campanhas vigentes — confere no carrinho com seu CEP. Nordeste e Norte têm tabela própria; transparência antes de pagar, sem surpresa na última etapa.",
      ),
    },
  ],
  [
    {
      author: "user",
      text: "Amei o vídeo da bolsa Nômade nos 3 contextos — qual uso vocês mais veem na comunidade?",
    },
    {
      author: "brand",
      text: brand(
        "Café + notebook lidera, seguido de feira de sábado e viagem de carro. A bolsa foi desenhada pra transitar sem trocar de bolsa três vezes no dia. Qual dos 3 você mais se vê? Curiosidade genuína — usamos isso em próximo reel.",
      ),
    },
    {
      author: "user",
      text: "Feira + café, 100%. MacBook 14 cabe mesmo?",
    },
    {
      author: "brand",
      text: brand(
        "14” cabe com folga moderada e garrafa lateral — clientes relatam sem apertar zíper. 15” pode exigir capa mais fina; se for seu caso, mede no DM que confirmamos com foto de referência interna.",
      ),
    },
  ],
  [
    {
      author: "user",
      text: "Collab com @marina.mods foi inspiração pura. Vai ter parte 2 com looks de inverno leve?",
    },
    {
      author: "brand",
      text: brand(
        "Marina já sinalizou vontade de parte 2 — provável com camadas leves e terracota quando a cor subir. Nada datado ainda; segue o perfil e stories que anunciamos collab antes do feed. Obrigada por acompanhar — comunidade pede, a gente ouve.",
      ),
    },
    {
      author: "user",
      text: "Ativei notificação. O look 1 usa sandália do site?",
    },
    {
      author: "brand",
      text: brand(
        "Sandália rústica palha do look 1 está na loja, numeração 34–40. Combina com vestido areia e wide leg; guia de medidas no carrossel. Se esgotar seu número, lista de espera na página do produto.",
        "julia",
      ),
    },
  ],
  [
    {
      author: "user",
      text: "Cheiro forte de tecido novo incomoda — vocês aeram antes de enviar?",
    },
    {
      author: "brand",
      text: brand(
        "Tecido natural pode ter leve odor de fábrica; não usamos perfume artificial. Lavada delicada à chegada resolve na maioria dos casos. Se persistir algo atípico, foto + DM que avaliamos troca — não é normal ficar forte após ar fresco.",
      ),
    },
    {
      author: "user",
      text: "Lavou e sumiu. Obrigada!",
    },
    {
      author: "brand",
      text: brand(
        "Ótimo! Guarda o cartão de cuidados dentro do armário — linho e algodão agradecem água fria e sombra. Qualquer dúvida de manutenção, volta aqui.",
      ),
    },
  ],
  [
    {
      author: "user",
      text: "Plus size: até quando no vestido? Vi só até G no site.",
    },
    {
      author: "brand",
      text: brand(
        "Vestido linho hoje até G; wide leg até GG. Expansão de grade está no roadmap de outono — newsletter avisa. Se você está no limite entre G e necessidade maior, mede e manda aqui: às vezes caimento solto do linho atende sem grade extra.",
      ),
    },
    {
      author: "user",
      text: "Vou medir e esperar outono então. Obrigada pela honestidade.",
    },
    {
      author: "brand",
      text: brand(
        "Honestidade evita troca frustrada. Quando a grade nova subir, te esperamos — e a lista de espera avisa quem já manifestou interesse.",
      ),
    },
  ],
  [
    {
      author: "user",
      text: "Look pra chuva em SP — wide leg molha a barra?",
    },
    {
      author: "brand",
      text: brand(
        "Barra pode molhar como qualquer calça longa — dobra levemente, tênis impermeável ou calça um pouco mais curta no alfaiate se for crônico. Linho seca rápido em ambiente ventilado; evita secadora. Regata + jaqueta leve impermeável é o hack que clientes de SP repetem.",
      ),
    },
    {
      author: "user",
      text: "Jaqueta já tenho. Vou na wide leg oliva.",
    },
    {
      author: "brand",
      text: brand(
        "Boa escolha — oliva não marca chuva como off-white. Boa semana úmida e nos chama se precisar de cuidado pós-chuva.",
      ),
    },
  ],
];

/** Pares raiz — usuário até ~140 chars, marca 200–280. Um par vira pendente (índice definido no builder). */
export const REALISTIC_PAIRS: Array<{ user: string; brand: string }> = [
  {
    user: "Qual o link da loja mesmo? Salvei o post mas perdi a bio.",
    brand: brand(
      "Tudo na bio do @estudio.nomade e direto em loja.estudionomade.app — mesmo estoque, mesmas fotos de medidas. Se o link da bio não abrir, copia o endereço ou usa Pix pelo checkout desktop. Qualquer erro de página, print no DM que a gente ajuda.",
    ),
  },
  {
    user: "Amei a paleta areia e oliva — parece que respira. Vocês pensam em peças masculinas?",
    brand: brand(
      "Que bom que a paleta conversou com você ☀️ Linha masculina ainda não está no catálogo — hoje focamos em cápsula feminina e unissex pontual (bolsa Nômade, alguns acessórios). Se surgir expansão, newsletter e stories avisam primeiro. Obrigada por perguntar com carinho.",
    ),
  },
  {
    user: "Tem cupom de primeira compra ou melhor esperar sale? Quero o vestido mas orçamento apertado.",
    brand: brand(
      "Newsletter na bio dá 10% na primeira compra — é o desconto oficial que temos hoje, sem cupom secreto em comentário. Sale sazonal a gente anuncia no feed; se o vestido é prioridade, lista de espera no tamanho avisa reposição. Não inventamos promoção aqui: só o que está no site.",
    ),
  },
  {
    user: "O vestido amassa no transporte? Morro de medo de receber engomado eterno.",
    brand: brand(
      "Linho amassa — faz parte do tecido e não é defeito. Vapor leve ou banho de vapor no banheiro resolve em poucos minutos; cartão na embalagem explica. Evita prensa quente demais que pode brilhar fibra. Muita cliente amassa de propósito pro look natural.",
    ),
  },
  {
    user: "Enviam pro Nordeste? Moro em Recife e sempre fico com medo do prazo.",
    brand: brand(
      "Enviamos sim — Nordeste costuma ficar na faixa de 8–12 dias úteis após confirmação do pagamento, dependendo do CEP em Recife. Rastreio no e-mail; se passar muito do estimado do checkout, área do cliente ou DM. Pix confirma rápido se quiser adiantar separação.",
    ),
  },
  {
    user: "Posso lavar na máquina ou só à mão? Sou preguiçosa com roupa delicada 😅",
    brand: brand(
      "Ciclo delicado, água fria, saco de lavagem, secar à sombra — dá pra máquina sim, sem centrifugar forte. Linho e algodão agradecem menos atrito. Se puder, lava do avesso. Cartão de cuidados vem na caixa; seguir ele prolonga vida da peça.",
    ),
  },
  {
    user: "A bolsa Nômade cabe MacBook 13 com capa + garrafa? Uso todo dia no coworking.",
    brand: brand(
      "13” com capa fina + garrafa lateral é o combo que mais ouvimos — cabe sem forçar fecho magnético. Se a capa for muito robusta, testa sem ou mochila slim. Alças reforçadas aguentam rotina; se notar desgaste anormal, manda foto no DM.",
    ),
  },
  {
    user: "O cinto de palha pinica na cintura? Tenho pele sensível.",
    brand: brand(
      "Acabamento interno é macio; se pinicar, usa um pouco mais solto ou camiseta por baixo na primeira semana até o material assentar. Palha natural pode ter textura — não é couro rígido. Se incomodar demais, primeira troca em 7 dias vale testar em casa com cuidado.",
    ),
  },
  {
    user: "Quando sai terracota? Quero algo pro outono sem comprar fast fashion de novo.",
    brand: brand(
      "Terracota suave entra nas próximas semanas — comenta “eu quero” ou entra na newsletter que avisamos sem spam. Entendemos a pressa de não cair no fast fashion: nossa proposta é peça que fica, não coleção descartável. Obrigada por esperar com intenção.",
    ),
  },
  {
    user: "Pedido de ontem no Pix — já sai rastreio ou só depois de separar tudo?",
    brand: brand(
      "Pix confirmado entra na fila de separação no mesmo dia útil se pagou no horário de corte. Rastreio em 1–2 dias úteis no e-mail e área do cliente. Se passou disso, manda número do pedido no DM — localizamos sem te fazer repetir história.",
    ),
  },
  {
    user: "Look perfeito pra feira de sábado 🥬 Sandália aguenta pisar em terra molhada?",
    brand: brand(
      "Feira + café é combo clássico da comunidade! Sandália rústica aguenta cidade e pisos leves; terra molhada o dia todo pode escorregar como qualquer flat — leva tênis na bolsa se for chão irregular. Wide leg não marca barra fácil se molhar pouco.",
    ),
  },
  {
    user: "Altura da modelo do carrossel? Tenho 1,58 e medo do vestido engolir.",
    brand: brand(
      "Modelo do lookbook tem 1,68 m — medidas de busto/cintura/quadril no último slide. Com 1,58 o vestido linho pode ficar mais longo; algumas clientes fazem barra simples ou usam sandália mais baixa. Compara tabela com suas medidas antes de comprar.",
    ),
  },
  {
    user: "Vestido tem bolso? Preciso de lugar pro celular na feira.",
    brand: brand(
      "Bolso lateral discreto no vestido linho areia — cabe celular slim sem deformar caimento. Se carregar carteira grossa, bolsa ou cinto ajudam. Detalhe está no close do terceiro slide do carrossel.",
    ),
  },
  {
    user: "Cartão presente existe? Quero dar de aniversário sem errar tamanho.",
    brand: brand(
      "Cartão presente digital na loja, valor livre — pessoa escolhe peça e medida. Link na seção “Presentes” do site. Validade e regras aparecem no checkout do cartão. Presente sem stress de tamanho é o melhor caminho.",
    ),
  },
  {
    user: "Areia puxa amarelo na pele morena ou é neutro de verdade?",
    brand: brand(
      "Areia aqui é neutro acinzentado, não amarelo ouro — costuma harmonizar com subtons quentes e frios. Se quiser contraste, oliva e off-white do mesmo carrossel funcionam. Luz natural do shooting é a referência mais fiel; tela varia.",
    ),
  },
  {
    user: "Wide leg com tênis branco fica infantil ou funciona pro escritório?",
    brand: brand(
      "Tênis branco limpo + wide leg + regata ou camisa leve funciona em escritório criativo — não infantil se a paleta é neutra e o tênis é minimalista. Troca por mocassim se a cultura for mais formal. Julia usa esse combo nos stories de styling.",
      "julia",
    ),
  },
  {
    user: "Aceitam Pix e parcelado no mesmo pedido? Nunca sei qual escolher.",
    brand: brand(
      "É um ou outro no checkout — Pix à vista confirma em minutos; cartão permite parcelamento conforme regras do gateway. Não dá pra misturar no mesmo pedido. Se valor alto, compara total parcelado vs Pix; ambos seguros no site oficial.",
    ),
  },
  {
    user: "Salvando pra comprar dia 15 — vocês seguram tamanho M sem pagar?",
    brand: brand(
      "Reserva formal sem pagamento a gente não faz — estoque é ao vivo. Manda DM perto do dia 15 que confirmamos se o M ainda está disponível; se voou, lista de espera avisa reposição. Obrigada por planejar compra consciente.",
    ),
  },
  {
    user: "Tecido transparente no sol forte? Trabalho em varanda e a câmera denuncia tudo.",
    brand: brand(
      "Regata e vestido têm forro parcial onde necessário — no sol forte, lingerie clara ajuda. Close no carrossel mostra transparência real sem filtro enganoso. Se prioridade é zero transparência, off-white estruturado pode ser melhor que linho fino.",
    ),
  },
  {
    user: "Loja física em SP? Queria provar antes mas moro no interior.",
    brand: brand(
      "Hoje somos online + pop-up pontual em SP anunciado nos stories — não temos loja fixa. Guia de medidas, primeira troca em 7 dias e fotos de cliente no destaque compensam falta de provador. Se pop-up rolar, avisamos com antecedência.",
    ),
  },
];
