// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

/** @type {import('@astrojs/starlight').StarlightUserConfig['sidebar']} */
const sidebar = [
  {
    label: "Início",
    translations: { en: "Home" },
    items: [{ slug: "inicio" }],
  },
  {
    label: "Guia de uso",
    translations: { en: "User guide" },
    items: [
      { slug: "uso" },
      { slug: "uso/01-primeiro-acesso" },
      { slug: "uso/02-calendario-e-postagens" },
      { slug: "uso/03-comentarios" },
      { slug: "uso/04-mensagens" },
      { slug: "uso/05-produtos-e-lojas" },
      { slug: "uso/06-configuracoes-e-agentes" },
      { slug: "uso/07-webhooks-e-monitoramento" },
      { slug: "uso/troubleshooting" },
    ],
  },
  {
    label: "Guia de configuração",
    translations: { en: "Setup guide" },
    items: [
      { slug: "configuracao" },
      { slug: "configuracao/01-conta-instagram" },
      { slug: "configuracao/02-criar-app-meta" },
      { slug: "configuracao/03-variaveis-de-ambiente" },
      { slug: "configuracao/04-webhooks" },
      { slug: "configuracao/05-conectar-instagram-admin" },
    ],
  },
  {
    label: "Mensagens (DMs) — configuração",
    translations: { en: "DM setup" },
    items: [
      { slug: "configuracao/06-mensagens-receptor-primario" },
      { slug: "configuracao/07-page-access-token" },
    ],
  },
  {
    label: "App Review",
    items: [{ slug: "configuracao/08-app-review" }],
  },
  {
    label: "Suporte",
    translations: { en: "Support" },
    items: [{ slug: "configuracao/troubleshooting" }],
  },
  {
    label: "Desenvolvedores",
    translations: { en: "Developers" },
    items: [{ slug: "dev/referencia-tecnica" }],
  },
];

// https://astro.build/config
export default defineConfig({
  base: "/docs",
  outDir: "../public/docs",
  trailingSlash: "always",
  integrations: [
    starlight({
      title: "Iris Docs",
      description:
        "Guias de uso e configuração do Iris para Instagram e Meta.",
      logo: {
        src: "./src/assets/iris-logo.svg",
        alt: "Iris",
        replacesTitle: false,
      },
      defaultLocale: "root",
      locales: {
        root: {
          label: "🇧🇷 Português",
          lang: "pt-BR",
        },
        en: {
          label: "🇺🇸 English",
          lang: "en",
        },
      },
      lastUpdated: false,
      customCss: ["./src/styles/custom.css"],
      head: [
        {
          tag: "link",
          attrs: {
            rel: "icon",
            href: "/docs/favicon.svg",
            type: "image/svg+xml",
          },
        },
        {
          tag: "meta",
          attrs: {
            property: "og:image",
            content: "/docs/iris-logo-192.png",
          },
        },
      ],
      sidebar,
    }),
  ],
});
