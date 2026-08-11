import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/layout/brand-logo";
import { ROUTES } from "@/lib/routes";

const LAST_UPDATED = "10 de agosto de 2026";

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-svh bg-background">
      <header className="border-b border-border/80 bg-card/50 px-4 py-6 sm:px-6">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4">
          <Link to={ROUTES.home} className="flex items-center gap-3 text-foreground no-underline">
            <BrandLogo size="sm" />
            <span className="font-display text-xl font-semibold tracking-tight">Iris</span>
          </Link>
          <Link
            to={ROUTES.admin.login}
            className="text-sm font-medium text-primary hover:underline"
          >
            Entrar
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
        <article className="space-y-8 text-foreground">
          <header className="space-y-3">
            <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Legal
            </p>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Política de privacidade
            </h1>
            <p className="text-sm text-muted-foreground">Última atualização: {LAST_UPDATED}</p>
          </header>

          <section className="space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            <p>
              Esta política descreve como o <strong className="font-medium text-foreground">Iris</strong>{" "}
              — serviço de agendamento, publicação e acompanhamento de conteúdo no Instagram — trata
              dados pessoais quando você utiliza a interface web ou integra sua conta Instagram.
            </p>
            <p>
              O Iris é operado em instância dedicada. O responsável pelo tratamento dos seus dados é
              quem administra essa instância (o operador editorial), não a plataforma Meta.
            </p>
          </section>

          <PolicySection title="1. Dados que coletamos">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="font-medium text-foreground">Autenticação:</strong> endereço de
                email usado para login com código de verificação (OTP).
              </li>
              <li>
                <strong className="font-medium text-foreground">Conta Instagram:</strong> identificadores
                e tokens de acesso fornecidos pela Meta após autorização OAuth, além de dados da conta
                conectada (por exemplo, nome de usuário e ID).
              </li>
              <li>
                <strong className="font-medium text-foreground">Conteúdo editorial:</strong> legendas,
                imagens enviadas, datas de agendamento e status de publicações.
              </li>
              <li>
                <strong className="font-medium text-foreground">Comentários:</strong> textos, autores
                e metadados sincronizados da sua conta Instagram via API oficial da Meta.
              </li>
              <li>
                <strong className="font-medium text-foreground">Dados técnicos:</strong> registros
                básicos de uso do serviço (por exemplo, horário de acesso e erros) para operação e
                segurança.
              </li>
            </ul>
          </PolicySection>

          <PolicySection title="2. Como usamos os dados">
            <ul className="list-disc space-y-2 pl-5">
              <li>Permitir login seguro na interface administrativa.</li>
              <li>Conectar e manter a integração com sua conta Instagram.</li>
              <li>Agendar, publicar e gerenciar postagens em seu nome.</li>
              <li>Exibir e responder comentários conforme configuração do operador.</li>
              <li>Enviar notificações por email relacionadas ao acesso (códigos OTP).</li>
              <li>Garantir segurança, prevenir abuso e cumprir obrigações legais.</li>
            </ul>
          </PolicySection>

          <PolicySection title="3. Base legal (LGPD)">
            <p>
              O tratamento se apoia, conforme o caso, em execução de contrato ou procedimentos
              preliminares, legítimo interesse do operador para gestão editorial, cumprimento de
              obrigação legal e, quando aplicável, consentimento para integrações opcionais (como
              respostas automáticas assistidas por IA).
            </p>
          </PolicySection>

          <PolicySection title="4. Compartilhamento com terceiros">
            <p>Podemos compartilhar dados apenas quando necessário para o funcionamento do serviço:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong className="font-medium text-foreground">Meta (Instagram):</strong> para
                publicar conteúdo, ler comentários e receber webhooks, conforme permissões concedidas
                por você.
              </li>
              <li>
                <strong className="font-medium text-foreground">Provedor de email:</strong> para
                envio de códigos de login (por exemplo, Resend em produção).
              </li>
              <li>
                <strong className="font-medium text-foreground">Provedor de IA (opcional):</strong>{" "}
                quando o operador habilitar respostas automáticas, apenas o contexto necessário para
                gerar a resposta.
              </li>
            </ul>
            <p className="mt-3">
              Não vendemos dados pessoais. O uso pela Meta segue a{" "}
              <a
                href="https://www.facebook.com/privacy/policy/"
                className="text-primary underline-offset-2 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                política de privacidade da Meta
              </a>
              .
            </p>
          </PolicySection>

          <PolicySection title="5. Retenção e exclusão">
            <p>
              Mantemos os dados enquanto sua conta estiver ativa ou enquanto forem necessários para
              as finalidades descritas. Tokens de acesso podem ser revogados a qualquer momento nas
              configurações do Iris ou nas permissões do app na Meta. Backups e logs seguem a
              política de retenção definida pelo operador da instância.
            </p>
          </PolicySection>

          <PolicySection title="6. Segurança">
            <p>
              Adotamos medidas técnicas como autenticação por sessão em cookie HttpOnly, criptografia
              de tokens sensíveis em repouso, limites de tamanho de requisição e validação de
              assinaturas em webhooks. Nenhum sistema é 100% seguro; em caso de incidente, o
              operador deve comunicar os titulares conforme a LGPD.
            </p>
          </PolicySection>

          <PolicySection title="7. Seus direitos">
            <p>
              Nos termos da LGPD, você pode solicitar confirmação de tratamento, acesso, correção,
              anonimização, portabilidade, eliminação de dados desnecessários, informação sobre
              compartilhamentos e revogação de consentimento, quando aplicável.
            </p>
            <p className="mt-3">
              Para exercer esses direitos, entre em contato com o responsável pela instância Iris que
              você utiliza (geralmente o email cadastrado como administrador).
            </p>
          </PolicySection>

          <PolicySection title="8. Alterações nesta política">
            <p>
              Podemos atualizar este documento para refletir mudanças no serviço ou na legislação. A
              data no topo da página indica a versão vigente. O uso continuado após alterações
              relevantes pode exigir nova aceitação, conforme orientação do operador.
            </p>
          </PolicySection>

          <section className="rounded-xl border border-border/80 bg-card/60 p-6 text-sm text-muted-foreground">
            <p>
              <strong className="font-medium text-foreground">Aviso:</strong> este texto é um modelo
              informativo para operação do Iris e não substitui assessoria jurídica. Revise com seu
              advogado antes de publicar em produção, especialmente se houver titulares na União
              Europeia (GDPR).
            </p>
          </section>
        </article>
      </main>

      <footer className="border-t border-border/80 px-4 py-6 text-center text-xs text-muted-foreground sm:px-6">
        <p>© {new Date().getFullYear()} Iris. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

function PolicySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
        {children}
      </div>
    </section>
  );
}
