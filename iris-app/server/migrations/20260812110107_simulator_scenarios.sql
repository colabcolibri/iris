CREATE TABLE IF NOT EXISTS simulator_scenarios (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  caption TEXT NOT NULL,
  carousel_summary TEXT NOT NULL,
  thread_json TEXT NOT NULL,
  target_author TEXT NOT NULL,
  target_text TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO simulator_scenarios (
  id,
  label,
  description,
  caption,
  carousel_summary,
  thread_json,
  target_author,
  target_text,
  created_at,
  updated_at
) VALUES
(
  'jogo-grok',
  'Carrossel — jogo de conversa',
  'Apresentação do jogo + curiosidade sobre como usar em grupo.',
  'Conversas difíceis não precisam virar batalha. O Grok é um jogo de cartas que abre espaço pra falar do que importa — sem roteiro, sem certo ou errado.',
  '5 slides: capa do jogo, cartas em mesa, pessoas conversando, close de uma carta com pergunta aberta e cena de grupo em roda.',
  '[{"author":"renata.psi","text":"Amei a ideia de tirar o celular da mesa!","is_brand_reply":false},{"author":"marca","text":"Exato — o jogo cria um ritual de presença. Funciona muito em família também 💛","is_brand_reply":true}]',
  'renata.psi',
  'Funciona com adolescentes que não querem falar nada na mesa?',
  '2026-08-12T09:01:07.000Z',
  '2026-08-12T09:01:07.000Z'
),
(
  'arte-da-escuta',
  'Reel — arte da escuta',
  'Dica rápida de escuta ativa + pedido de exemplo prático.',
  'Escutar não é esperar sua turno pra falar. É ficar curioso pelo que a pessoa quer dizer — mesmo quando discorda.',
  'Reel vertical em 3 cortes: rosto em silêncio, gesto de atenção, texto na tela com a frase da legenda.',
  '[{"author":"marcos.coach","text":"Isso mudou minha reunião de equipe hoje.","is_brand_reply":false}]',
  'lucia.hr',
  'Tem um exemplo de pergunta que abre sem parecer interrogatório?',
  '2026-08-12T09:01:07.000Z',
  '2026-08-12T09:01:07.000Z'
),
(
  'cnv-formula',
  'Post — CNV além da fórmula',
  'Reflexão editorial sobre observação vs julgamento.',
  'CNV não é decorar quatro passos. É treinar o olhar: o que eu observei, o que sinto, o que preciso — sem atacar quem está na frente.',
  'Quote card em tipografia serif sobre fundo creme, seguido de contraste entre frase julgadora e frase observacional.',
  '[{"author":"ana.educadora","text":"Sempre confundi sentimento com julgamento.","is_brand_reply":false},{"author":"pedro.dev","text":"O segundo exemplo me pegou.","is_brand_reply":false}]',
  'ana.educadora',
  'Como você diferencia julgamento de sentimento num feedback no trabalho?',
  '2026-08-12T09:01:07.000Z',
  '2026-08-12T09:01:07.000Z'
),
(
  'livro-trabalho',
  'Carrossel — livro para o trabalho',
  'Trecho do livro + comentário sobre aplicar no dia a dia.',
  'Trecho do livro sobre comunicação no trabalho: conflito não é falha de caráter — é informação sobre necessidades não atendidas.',
  'Slides com citação destacada, foto do livro aberto, anotação em margem e nota sobre diálogo em equipe.',
  '[{"author":"marca","text":"Esse capítulo nasceu de histórias reais de times que pediram ferramentas sem teoria vazia.","is_brand_reply":true}]',
  'carla.gestora',
  'Li o capítulo 3 e quero usar numa retrospectiva. O exercício do final é pra duplas ou grupo inteiro?',
  '2026-08-12T09:01:07.000Z',
  '2026-08-12T09:01:07.000Z'
),
(
  'democracia-profunda',
  'Thread — democracia e escuta',
  'Post editorial longo com debate na thread e nova pergunta sensível.',
  'Democracia profunda começa onde a gente para de tratar o outro como ameaça. Escuta não é concordar — é manter a conversa possível.',
  'Carrossel com 4 slides: cena de roda de conversa, citação sobre poder e privilégio, pessoa anotando e convite à reflexão.',
  '[{"author":"joao.cidadania","text":"Post necessário.","is_brand_reply":false},{"author":"marina.politica","text":"Como escutar quem fala com raiva legítima?","is_brand_reply":false},{"author":"marca","text":"A raiva também carrega informação. A escuta começa validando o que está vivo antes de pedir calma.","is_brand_reply":true},{"author":"joao.cidadania","text":"Faz sentido. Difícil na prática.","is_brand_reply":false}]',
  'marina.politica',
  'Quando a pessoa só quer confronto, ainda vale insistir na escuta?',
  '2026-08-12T09:01:07.000Z',
  '2026-08-12T09:01:07.000Z'
);
