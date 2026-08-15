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
    label: "Primeiros passos",
    translations: { en: "Getting started" },
    items: [
      { slug: "uso/primeiro-acesso" },
      { slug: "uso/navegacao-no-admin" },
      { slug: "uso/conectar-instagram" },
    ],
  },
  {
    label: "Calendário e postagens",
    translations: { en: "Calendar & posts" },
    items: [
      { slug: "uso/calendario-visao-geral" },
      { slug: "uso/criar-postagem" },
      { slug: "uso/agendar-e-publicar" },
      { slug: "uso/editar-e-status" },
      { slug: "uso/kanban-pipeline" },
      { slug: "uso/lista-editorial" },
      { slug: "uso/post-campanha-agente" },
    ],
  },
  {
    label: "Comentários",
    translations: { en: "Comments" },
    items: [
      { slug: "uso/comentarios-visao-geral" },
      { slug: "uso/comentarios-importar" },
      { slug: "uso/comentarios-responder" },
      { slug: "uso/comentarios-aprovacao" },
      { slug: "uso/comentarios-sincronizar" },
    ],
  },
  {
    label: "Mensagens (DMs)",
    translations: { en: "Messages" },
    items: [
      { slug: "uso/mensagens-visao-geral" },
      { slug: "uso/mensagens-responder" },
      { slug: "uso/mensagens-aprovacao" },
      { slug: "uso/mensagens-escalacao" },
    ],
  },
  {
    label: "Produtos e lojas",
    translations: { en: "Products & stores" },
    items: [
      { slug: "uso/produtos-cadastro" },
      { slug: "uso/produtos-vinculo-yampi" },
      { slug: "uso/lojas-conectar" },
      { slug: "uso/lojas-politicas-campo" },
    ],
  },
  {
    label: "Configurações e persona",
    translations: { en: "Settings & persona" },
    items: [
      { slug: "uso/configuracoes-visao-geral" },
      { slug: "uso/fuso-e-monitoramento" },
      { slug: "uso/agente-comentarios" },
      { slug: "uso/agente-dms" },
      { slug: "uso/alertas-operador" },
      { slug: "uso/persona-marca" },
    ],
  },
  {
    label: "Monitoramento",
    translations: { en: "Monitoring" },
    items: [
      { slug: "uso/webhooks" },
      { slug: "uso/execucoes-agente" },
      { slug: "uso/fila-agente" },
    ],
  },
  {
    label: "Lab",
    translations: { en: "Lab" },
    items: [
      { slug: "uso/simulador-comentarios" },
      { slug: "uso/simulador-dm" },
    ],
  },
  {
    label: "Ajuda",
    translations: { en: "Help" },
    items: [
      { slug: "uso/troubleshooting" },
      { slug: "uso/imagens" },
    ],
  },
];

export default defineConfig({
  base: "/docs",
  outDir: "../public/docs",
  trailingSlash: "always",
  integrations: [
    starlight({
      title: "Iris — guia de uso",
      description: "Como operar o admin Iris no dia a dia.",
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
