import type { SimulateThreadMessage } from "@/lib/api";

export type SimulatorScenario = {
  id: string;
  label: string;
  description: string;
  caption: string;
  carousel_summary: string;
  thread: SimulateThreadMessage[];
  target_author: string;
  target_text: string;
};

/** Cenários no tom editorial da conta — CNV, empatia, jogos, livros, cursos (sem citar a marca). */
export const SIMULATOR_SCENARIOS: SimulatorScenario[] = [
  {
    id: "jogo-grok",
    label: "Carrossel — jogo de conversa",
    description: "Apresentação do jogo + curiosidade sobre como usar em grupo.",
    caption:
      "Conversas difíceis não precisam virar batalha. O Grok é um jogo de cartas que abre espaço pra falar do que importa — sem roteiro, sem certo ou errado.",
    carousel_summary:
      "5 slides: capa do jogo, cartas em mesa, pessoas conversando, close de uma carta com pergunta aberta e cena de grupo em roda.",
    thread: [
      {
        author: "renata.psi",
        text: "Amei a ideia de tirar o celular da mesa!",
        is_brand_reply: false,
      },
      {
        author: "marca",
        text: "Exato — o jogo cria um ritual de presença. Funciona muito em família também 💛",
        is_brand_reply: true,
      },
    ],
    target_author: "renata.psi",
    target_text: "Funciona com adolescentes que não querem falar nada na mesa?",
  },
  {
    id: "arte-da-escuta",
    label: "Reel — arte da escuta",
    description: "Dica rápida de escuta ativa + pedido de exemplo prático.",
    caption:
      "Escutar não é esperar sua turno pra falar. É ficar curioso pelo que a pessoa quer dizer — mesmo quando discorda.",
    carousel_summary:
      "Reel vertical em 3 cortes: rosto em silêncio, gesto de atenção, texto na tela com a frase da legenda.",
    thread: [
      {
        author: "marcos.coach",
        text: "Isso mudou minha reunião de equipe hoje.",
        is_brand_reply: false,
      },
    ],
    target_author: "lucia.hr",
    target_text:
      "Tem um exemplo de pergunta que abre sem parecer interrogatório?",
  },
  {
    id: "cnv-formula",
    label: "Post — CNV além da fórmula",
    description: "Reflexão editorial sobre observação vs julgamento.",
    caption:
      "CNV não é decorar quatro passos. É treinar o olhar: o que eu observei, o que sinto, o que preciso — sem atacar quem está na frente.",
    carousel_summary:
      "Quote card em tipografia serif sobre fundo creme, seguido de contraste entre frase julgadora e frase observacional.",
    thread: [
      {
        author: "ana.educadora",
        text: "Sempre confundi sentimento com julgamento.",
        is_brand_reply: false,
      },
      {
        author: "pedro.dev",
        text: "O segundo exemplo me pegou.",
        is_brand_reply: false,
      },
    ],
    target_author: "ana.educadora",
    target_text:
      "Como você diferencia julgamento de sentimento num feedback no trabalho?",
  },
  {
    id: "livro-trabalho",
    label: "Carrossel — livro para o trabalho",
    description: "Trecho do livro + comentário sobre aplicar no dia a dia.",
    caption:
      "Trecho do livro sobre comunicação no trabalho: conflito não é falha de caráter — é informação sobre necessidades não atendidas.",
    carousel_summary:
      "Slides com citação destacada, foto do livro aberto, anotação em margem e nota sobre diálogo em equipe.",
    thread: [
      {
        author: "marca",
        text: "Esse capítulo nasceu de histórias reais de times que pediram ferramentas sem teoria vazia.",
        is_brand_reply: true,
      },
    ],
    target_author: "carla.gestora",
    target_text:
      "Li o capítulo 3 e quero usar numa retrospectiva. O exercício do final é pra duplas ou grupo inteiro?",
  },
  {
    id: "democracia-profunda",
    label: "Thread — democracia e escuta",
    description:
      "Post editorial longo com debate na thread e nova pergunta sensível.",
    caption:
      "Democracia profunda começa onde a gente para de tratar o outro como ameaça. Escuta não é concordar — é manter a conversa possível.",
    carousel_summary:
      "Carrossel com 4 slides: cena de roda de conversa, citação sobre poder e privilégio, pessoa anotando e convite à reflexão.",
    thread: [
      {
        author: "joao.cidadania",
        text: "Post necessário.",
        is_brand_reply: false,
      },
      {
        author: "marina.politica",
        text: "Como escutar quem fala com raiva legítima?",
        is_brand_reply: false,
      },
      {
        author: "marca",
        text: "A raiva também carrega informação. A escuta começa validando o que está vivo antes de pedir calma.",
        is_brand_reply: true,
      },
      {
        author: "joao.cidadania",
        text: "Faz sentido. Difícil na prática.",
        is_brand_reply: false,
      },
    ],
    target_author: "marina.politica",
    target_text:
      "Quando a pessoa só quer confronto, ainda vale insistir na escuta?",
  },
];

export const DEFAULT_SIMULATOR_SCENARIO_ID = SIMULATOR_SCENARIOS[0].id;

export function getSimulatorScenario(
  id: string,
): SimulatorScenario | undefined {
  return SIMULATOR_SCENARIOS.find((scenario) => scenario.id === id);
}

export function threadRowsFromScenario(scenario: SimulatorScenario) {
  return scenario.thread.map((row) => ({
    id: crypto.randomUUID(),
    author: row.author,
    text: row.text,
    is_brand_reply: Boolean(row.is_brand_reply),
  }));
}
