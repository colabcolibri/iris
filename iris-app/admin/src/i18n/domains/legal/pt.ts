export const legalPt = {
  privacy: {
    meta: {
      lastUpdated: "12 de agosto de 2026",
    },
    header: {
      signIn: "Entrar",
    },
    page: {
      eyebrow: "Legal",
      title: "Política de privacidade",
      lastUpdatedLabel: "Última atualização:",
    },
    intro: {
      p1:
        "Esta política descreve como o Iris — serviço de agendamento, publicação e acompanhamento de conteúdo no Instagram — trata dados pessoais quando você utiliza a interface web ou integra sua conta Instagram.",
      p2:
        "O Iris é operado em instância dedicada. O responsável pelo tratamento dos seus dados é quem administra essa instância (o operador editorial), não a plataforma Meta.",
    },
    sections: {
      dataCollected: {
        title: "1. Dados que coletamos",
        items: {
          auth: {
            label: "Autenticação:",
            body: "endereço de email usado para login com código de verificação (OTP).",
          },
          instagram: {
            label: "Conta Instagram:",
            body:
              "identificadores e tokens de acesso fornecidos pela Meta após autorização OAuth, além de dados da conta conectada (por exemplo, nome de usuário e ID).",
          },
          editorial: {
            label: "Conteúdo editorial:",
            body: "legendas, imagens enviadas, datas de agendamento e status de publicações.",
          },
          comments: {
            label: "Comentários:",
            body:
              "textos, autores e metadados sincronizados da sua conta Instagram via API oficial da Meta.",
          },
          technical: {
            label: "Dados técnicos:",
            body:
              "registros básicos de uso do serviço (por exemplo, horário de acesso e erros) para operação e segurança.",
          },
          analytics: {
            label: "Analytics do site:",
            body:
              "páginas visitadas e eventos agregados via Umami (analytics privacy-first, sem cookies de publicidade nem venda de dados).",
          },
        },
      },
      dataUse: {
        title: "2. Como usamos os dados",
        items: [
          "Permitir login seguro na interface administrativa.",
          "Conectar e manter a integração com sua conta Instagram.",
          "Agendar, publicar e gerenciar postagens em seu nome.",
          "Exibir e responder comentários conforme configuração do operador.",
          "Enviar notificações por email relacionadas ao acesso (códigos OTP).",
          "Garantir segurança, prevenir abuso e cumprir obrigações legais.",
        ],
      },
      legalBasis: {
        title: "3. Base legal (LGPD)",
        body:
          "O tratamento se apoia, conforme o caso, em execução de contrato ou procedimentos preliminares, legítimo interesse do operador para gestão editorial, cumprimento de obrigação legal e, quando aplicável, consentimento para integrações opcionais (como respostas automáticas assistidas por IA).",
      },
      sharing: {
        title: "4. Compartilhamento com terceiros",
        intro:
          "Podemos compartilhar dados apenas quando necessário para o funcionamento do serviço:",
        items: {
          meta: {
            label: "Meta (Instagram):",
            body:
              "para publicar conteúdo, ler comentários e receber webhooks, conforme permissões concedidas por você.",
          },
          email: {
            label: "Provedor de email:",
            body: "para envio de códigos de login (por exemplo, Resend em produção).",
          },
          ai: {
            label: "Provedor de IA (opcional):",
            body:
              "quando o operador habilitar respostas automáticas, apenas o contexto necessário para gerar a resposta.",
          },
        },
        metaPolicyPrefix: "Não vendemos dados pessoais. O uso pela Meta segue a",
        metaPolicyLink: "política de privacidade da Meta",
        metaPolicySuffix: ".",
      },
      retention: {
        title: "5. Retenção e exclusão",
        body:
          "Mantemos os dados enquanto sua conta estiver ativa ou enquanto forem necessários para as finalidades descritas. Tokens de acesso podem ser revogados a qualquer momento nas configurações do Iris ou nas permissões do app na Meta. Backups e logs seguem a política de retenção definida pelo operador da instância.",
      },
      security: {
        title: "6. Segurança",
        body:
          "Adotamos medidas técnicas como autenticação por sessão em cookie HttpOnly, criptografia de tokens sensíveis em repouso, limites de tamanho de requisição e validação de assinaturas em webhooks. Nenhum sistema é 100% seguro; em caso de incidente, o operador deve comunicar os titulares conforme a LGPD.",
      },
      rights: {
        title: "7. Seus direitos",
        p1:
          "Nos termos da LGPD, você pode solicitar confirmação de tratamento, acesso, correção, anonimização, portabilidade, eliminação de dados desnecessários, informação sobre compartilhamentos e revogação de consentimento, quando aplicável.",
        p2:
          "Para exercer esses direitos, entre em contato com o responsável pela instância Iris que você utiliza (geralmente o email cadastrado como administrador).",
      },
      changes: {
        title: "8. Alterações nesta política",
        body:
          "Podemos atualizar este documento para refletir mudanças no serviço ou na legislação. A data no topo da página indica a versão vigente. O uso continuado após alterações relevantes pode exigir nova aceitação, conforme orientação do operador.",
      },
    },
    disclaimer: {
      label: "Aviso:",
      body:
        "este texto é um modelo informativo para operação do Iris e não substitui assessoria jurídica. Revise com seu advogado antes de publicar em produção, especialmente se houver titulares na União Europeia (GDPR).",
    },
    footer: {
      copyright: "© {year} Iris. Todos os direitos reservados.",
    },
  },
};
