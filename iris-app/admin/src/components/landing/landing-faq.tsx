const FAQ_ITEMS = [
  {
    question: "O Iris é um produto pronto para comprar?",
    answer:
      "Ainda não. Esta página apresenta o projeto. Se você tem interesse em usar, pilotar ou conversar sobre o produto, envie uma mensagem pelo formulário de contato.",
  },
  {
    question: "Preciso de uma conta Instagram Business?",
    answer:
      "Sim. O Iris usa a API oficial da Meta (Instagram Login) para publicar conteúdo e sincronizar comentários com segurança.",
  },
  {
    question: "As respostas automáticas são publicadas sem revisão?",
    answer:
      "Não necessariamente. O fluxo foi pensado para aprovação humana: você revisa sugestões antes de enviar, e define persona, tom e limites na configuração.",
  },
  {
    question: "Meus dados ficam onde?",
    answer:
      "O Iris roda em instância dedicada com banco próprio. Tokens sensíveis são criptografados e a política de retenção pode ser configurada pelo operador.",
  },
  {
    question: "Posso integrar com ferramentas de IA?",
    answer:
      "Sim. Há suporte a MCP e configuração de modelos para o agente de comentários, sempre dentro dos limites que você definir.",
  },
] as const;

export function LandingFaq() {
  return (
    <section id="faq" className="border-t border-[color:var(--iris-lp-rule)]">
      <div className="mx-auto w-full min-w-0 max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-[color:var(--iris-lp-muted)] uppercase">
            03 · FAQ
          </p>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-[color:var(--iris-lp-text)] sm:text-4xl">
            Perguntas frequentes
          </h2>
        </div>

        <div className="mt-10 max-w-3xl divide-y divide-[color:var(--iris-lp-rule)] border-y border-[color:var(--iris-lp-rule)]">
          {FAQ_ITEMS.map((item) => (
            <details key={item.question} className="group py-4">
              <summary className="cursor-pointer list-none text-base font-medium text-[color:var(--iris-lp-text)] marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-start justify-between gap-4">
                  <span>{item.question}</span>
                  <span
                    aria-hidden
                    className="mt-0.5 text-[color:var(--iris-lp-muted)] transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-[color:var(--iris-lp-text-soft)] sm:text-base">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
