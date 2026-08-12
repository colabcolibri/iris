import type { LandingMessages } from "./types";

export const landingEn: LandingMessages = {
  meta: {
    htmlLang: "en",
    documentTitle: "Iris — the editorial manager for your Instagram",
  },
  brand: {
    name: "Iris",
  },
  nav: {
    howItWorks: "How it works",
    features: "Features",
    trust: "Trust",
    pricing: "Implementation",
    faq: "FAQ",
    contact: "Contact",
  },
  hero: {
    eyebrow: "Your editorial agent and social media manager",
    titleLine1: "Your brand's Instagram",
    titleLine2Accent: "handled every single day",
    titleLine2: "exactly how you want it",
    subtitle:
      "Iris publishes to your Instagram and replies to the people commenting, always in your brand's voice — at whatever level of autonomy you choose.",
    cta: "I want to meet Iris",
    demoCta: "View demo",
    stage: {
      postHandle: "@nomad.studio",
      postCaption:
        "Carousel · behind the scenes of the new collection, shot at our SP atelier.",
      commentAuthor: "@marianadias",
      commentBody:
        "Loved the second slide! Are you launching in other cities too?",
      replyAuthor: "Nomad Studio",
      replyBody:
        "So glad you liked it! We're only in SP for now, but Belo Horizonte is on the radar for later this year 💜",
      replySignature: "— Iris, Nomad Studio's virtual assistant",
      statusLabel: "Replied automatically · within the brand's persona",
    },
  },
  workflow: {
    sectionLabel: "01 · How it works",
    titleLine1: "From planning to conversation,",
    titleLine2: "without losing the thread",
    subtitle:
      "Four simple steps connect planning your content, publishing to Instagram, and replying to comments — one panel built for people who take care of their own brand, not autopilot.",
    steps: [
      {
        title: "You (or your AI agent) plan the content",
        description:
          "Write the caption and upload the images right in the dashboard, or ask your AI assistant (Cursor, Claude, or ChatGPT) to prepare the post for you — both paths land on the same calendar.",
      },
      {
        title: "You review before it goes live",
        description:
          "See everything organized on a calendar: what's in draft, what's scheduled, and what's already published. Nothing goes out without passing through this step.",
      },
      {
        title: "Iris publishes at the right time",
        description:
          "At the scheduled time, Iris publishes straight to your Instagram account, through Instagram's own official connection — no workaround, no third party holding your password.",
      },
      {
        title: "Iris replies to comments",
        description:
          "When someone comments on a post, Iris reads the comment, the post's own content, and — if you want — a briefing just for that post (promo, price, link, a different tone). You choose whether you want to approve every reply before it goes live, or let Iris reply on its own within the limits you set.",
      },
    ],
  },
  features: {
    sectionLabel: "02 · Features",
    title: "Built for people who publish with",
    titleAccent: "intent",
    subtitle:
      "Five pieces of the operation: AI agent, editorial calendar, brand persona, per-post briefing, and an official Instagram connection.",
    items: [
      {
        title: "Your AI agent creates and schedules posts",
        description:
          'If you already use an AI assistant like Cursor, Claude, or ChatGPT, it can talk directly to Iris — create posts, send images, and check the calendar without you opening the dashboard. (The technical name for this connection is "MCP", in case you\'ve heard the term.)',
        highlight: true,
      },
      {
        title: "Editorial calendar",
        description:
          "See everything in one place: what's in draft, what's scheduled, and what's already published. Organize it as a board (like Trello), by month, or as a list of only the days that have posts.",
      },
      {
        title: "Brand persona",
        description:
          "It's the fixed base of the voice: you set it once in preferences and Iris uses it on every comment — tone, what the page sells, facts it can cite, and what is off-limits. No rewriting for each post; the brand sounds the same Monday through Sunday.",
      },
      {
        title: "Briefing for that one post",
        description:
          "When a post has its own context (launch, pre-sale, a specific look), you add instructions just for it and can turn off pieces of the general prompt that would get in the way — for example the old catalog. The persona stays; only that post changes what counts.",
      },
      {
        title: "Official connection, your data protected",
        description:
          "Iris connects to Instagram through Meta's official channel (the company behind Instagram) — the same one used by large brands. That keeps comments, posts, and stats always in sync, and your account never shares access with another brand's.",
      },
    ],
  },
  trust: {
    sectionLabel: "03 · Trust",
    titleLine1: "You decide how much",
    titleLine2: "autonomy to give.",
    subtitle:
      "Iris doesn't run one fixed way. You choose the level of automation — and every automatic reply still passes through a guardrail built for exactly that. It's the difference between automating your brand's Instagram and handing the keys to a robot.",
    items: [
      {
        title: "Configurable autonomy",
        description:
          "You can turn automatic replies on or off whenever you want — for every post at once, or just one — and set a waiting time before sending. On each post, you can also steer the reply with its own briefing and silence blocks from the general prompt (persona, page, knowledge, or restrictions) when that content needs a different approach.",
      },
      {
        title: "Comments don't run the brand",
        description:
          "People can try to push instructions inside a comment — ask for another tone, language, or rule. Iris goes through staged checks and your persona restrictions specifically to reduce that risk: the comment is content to answer, not a command. It isn't an absolute guarantee; it's designed to handle this as well as possible.",
      },
      {
        title: "A record of everything it replied",
        description:
          "Every automatic reply is logged in the dashboard, along with the steps Iris followed to get to that text — so you can check it anytime and understand how it reasoned.",
      },
      {
        title: "Test it before it counts",
        description:
          "Before changing Iris's tone or rules, you can try it out in a simulation mode without publishing anything for real — only once you approve does the change apply to real comments.",
      },
    ],
  },
  pricing: {
    sectionLabel: "04 · Implementation",
    titleLine1: "An Iris of your own,",
    titleLine2: "not a shared account",
    subtitle: "Not something you sign up for and start using on your own.",
    manifestoNote:
      "I set up a version of Iris just for your brand, and teach you how to use it.",
    manifestoQuestion:
      "Why this way, instead of selling it as a traditional SaaS subscription?",
    manifestoAnswer:
      "Because being a developer isn't my main occupation, and I'm not trying to start a company. Iris grew out of tools I built for my own use, which I decided to make available to other people too. I'm more of a small boutique, taking on one-off projects for people who genuinely see the value — not a software company chasing thousands of accounts.",
    items: [
      {
        title: "Implementation",
        description:
          "I set up the technical side: the connection to Instagram, your brand's tone of voice, and, if you'd like, the link to the AI agent you already use (Cursor, Claude, or ChatGPT). And I show you how to use the dashboard day to day, so you get the most out of it.",
      },
      {
        title: "Maintenance",
        description:
          "I make sure it stays up and running. Adjustments and requests outside what we originally agreed on are billed separately, as needed.",
      },
      {
        title: "Updates",
        description:
          "Iris keeps evolving — improvements and new features get added over time, and your version receives those updates.",
      },
    ],
    noteLabel: "About the investment",
    note: "No fixed plan or price published here: the investment depends on your brand's size and what you need. The way to find out is to talk to me — no strings attached.",
  },
  faq: {
    sectionLabel: "05 · FAQ",
    title: "Frequently asked questions",
    subtitle:
      "The essentials on Iris, AI agent connection, and what you can expect from the project right now.",
    items: [
      {
        question: "What is Iris?",
        answer:
          "Iris takes care of your brand's Instagram: it schedules and publishes posts, watches comments as they come in, and replies to people — always in your brand's voice, at whatever level of automation you choose.",
      },
      {
        question: "Do I need to know how to code or use AI to have Iris?",
        answer:
          "No. You can use just the dashboard — write captions, upload photos, and follow comments like normal. Connecting AI agents (Cursor, Claude, ChatGPT) is an extra feature, for people who already use those tools and want to create posts straight from there.",
      },
      {
        question: "What exactly can my AI agent do in Iris?",
        answer:
          "Create and edit posts, send photos, check the calendar, and read comments and stats — like an editorial assistant. It has no access to account settings and can't publish anything on its own: every post goes out through Iris, at its scheduled time.",
      },
      {
        question: "Are automatic replies published without review?",
        answer:
          "You choose. You can require your approval before every reply goes live, or let Iris reply on its own within the tone and limits you define. Either way, you can also set a waiting time before sending — and, on specific posts, an extra briefing (or silence parts of the general prompt) so the reply doesn't mix brand-wide rules with that post's context.",
      },
      {
        question: "How do I get Iris for my brand?",
        answer:
          "There's no signup form or \"subscribe now\" button. I set up and configure everything personally for you, and teach you how to use it. Send a message through the contact form and we'll talk about your case.",
      },
    ],
  },
  contact: {
    sectionLabel: "06 · Contact",
    title: "Interested?",
    titleAccent: "Let's talk",
    bodyBeforeEmail:
      "Every implementation is individual. Use the form below for investment questions, doubts, or whether Iris fits your brand — you'll get a reply from me through",
    bodyAfterEmail: ".",
    email: "ola@sergioluciano.com",
    form: {
      name: "Name",
      email: "Email",
      subject: "Subject",
      message: "Message",
      submit: "Send message",
      submitting: "Sending...",
      success:
        "Thank you — we received your message and will reply by email shortly.",
      validationError:
        "Fill in all fields. The message must be at least 10 characters.",
      genericError: "Could not send right now. Please try again in a moment.",
    },
  },
  footer: {
    blurb:
      "Iris takes care of your brand's Instagram: schedules and publishes posts, replies to comments with judgment, and connects to your AI agent, if you use one.",
    contact: "Contact",
    privacy: "Privacy",
  },
};
