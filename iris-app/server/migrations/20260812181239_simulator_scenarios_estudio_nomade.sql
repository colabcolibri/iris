-- Substitui cenários legados (CNV/Grok) pelos 2 defaults do Estúdio Nômade.
DELETE FROM simulator_scenarios
WHERE id IN (
  'jogo-grok',
  'arte-da-escuta',
  'cnv-formula',
  'livro-trabalho',
  'democracia-profunda'
);

INSERT OR REPLACE INTO simulator_scenarios (
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
  'lookbook-verao',
  'Carrossel — lookbook verão',
  'Coleção cápsula de verão + pergunta sobre reposição de tamanho na loja.',
  'Verão nômade: peças leves em linho e algodão, paleta areia e oliva, feitas pra transitar do home office ao café da tarde. Qual look você levaria numa terça de reuniões?',
  '6 slides: capa da coleção, flat lay de linho, look no rooftop, close de sandália, guia de medidas, CTA para a loja virtual.',
  '[{"author":"marina.mods","text":"O vestido linho areia ficou perfeito no segundo slide!","is_brand_reply":false},{"author":"estudio.nomade","text":"Obrigada! Ele foi pensado pra não marcar no calor e combinar com tudo no armário ☀️","is_brand_reply":true}]',
  'julia.style',
  'Vocês vão repor o tamanho P do vestido linho areia? Quero comprar antes do fim de semana.',
  '2026-08-12T18:12:39.000Z',
  '2026-08-12T18:12:39.000Z'
),
(
  'reel-styling',
  'Reel — 3 jeitos de usar a bolsa Nômade',
  'Dica de styling com a bolsa Nômade + pergunta sobre entrega da loja.',
  'A bolsa Nômade não é só pra notebook: weekend, feira e viagem de carro. Salva esse reel pra montar a mala sem stress.',
  'Reel em 3 cortes: bolsa no café, na feira orgânica, no banco do carro; texto na tela com cada uso.',
  '[{"author":"pri.travel","text":"Preciso dessa bolsa na minha vida!","is_brand_reply":false}]',
  'camila.fit',
  'Qual o prazo de entrega pro Sul? Comprei pela loja virtual mês passado e adorei a embalagem.',
  '2026-08-12T18:12:39.000Z',
  '2026-08-12T18:12:39.000Z'
);
