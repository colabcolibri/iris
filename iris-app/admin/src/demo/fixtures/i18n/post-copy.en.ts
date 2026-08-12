import { DEMO_STORE_URL } from "@/demo/demo-brand";

const REPLY_PROMPT_STORE = `Store link: ${DEMO_STORE_URL}. Prioritize size, stock, and delivery questions.`;

export const DEMO_POST_COPY_EN: Record<
  string,
  {
    caption?: string;
    carousel_summary?: string;
    reply_prompt?: string;
    assets?: Array<{ filename: string; alt_text?: string }>;
  }
> = {
  "demo-post-prev-01": {
    caption: `First real heat of the year and we're already reaching for linen ☀️

Sand linen dress + rustic sandals + iced coffee in hand — that's the mood.

What's your go-to linen piece when it's hot?

#summer #linen #estudionomade`,
  },
  "demo-post-prev-02": {
    caption: `Sunday market day with the Nômade bag full of fruit and bread 🥖

A comfortable look doesn't have to look messy — wide leg + off-white tank and you're set.

#lifestyle #market #estudionomade`,
  },
  "demo-post-prev-03": {
    caption: `3 colors that rescue any wardrobe: sand, olive, and off-white 🎨

We put together a carousel with combinations that work Monday through Sunday.

Save it for when you're getting dressed.

#capsulewardrobe #casualstyle`,
    carousel_summary:
      "Three palettes, three complete looks, styling tips on the last slide.",
  },
  "demo-post-prev-04": {
    caption: `The Nômade bag started from a real need: room for laptop, water bottle, and an extra layer 👜

Today it's the most requested piece in the store — and we get why.

Tell us: what never leaves your everyday bag?

#nomadebag #estudionomade`,
  },
  "demo-post-prev-05": {
    caption: `@marina.mods styled the late-summer transition look in 2 minutes 💫

Linen dress + straw belt + light jacket on the shoulders — ready for a cool evening.

#collab #styling #estudionomade`,
  },
  "demo-post-prev-06": {
    caption: `The question we get every day: "how do I know if it'll fit?" 📏

That's why we built the size guide — and it's already helped thousands of orders.

Link in bio if you haven't seen it yet.

#consciousfashion #onlinestore`,
  },
  "demo-post-prev-07": {
    caption: `Home office doesn't have to look like a boring meeting 💻

Cotton tank + wide leg pants + subtle earrings — polished without pinching.

#remotework #homeoffice #estudionomade`,
  },
  "demo-post-prev-08": {
    caption: `Packaging that becomes a ritual: recycled paper, cotton tape, care card included 📦

We believe opening your order should feel as good as wearing the piece.

#slowfashion #sustainability`,
  },
  "demo-post-prev-09": {
    caption: `Olive wide leg: the pants that became the community uniform 🌿

High waist, fabric that doesn't cling, functional pocket — and it goes with everything.

Do you already have yours?

#wideleg #casualstyle`,
  },
  "demo-post-prev-10": {
    caption: `You asked, we listened: more everyday looks with the capsule collection ✨

In last week's stories we showed 5 outfits with the same 4 pieces.

Which one was your favorite?

#community #estudionomade #lifestyle`,
  },
  "demo-post-loja": {
    caption: `New in the store: interactive size guide 📏

Tired of guessing sizes online? Every product now has a chart + fit notes.

First free exchange within 7 days → ${DEMO_STORE_URL.replace("https://", "")}

#onlinestore #womensfashion #estudionomade`,
  },
  "demo-post-cal-02": {
    caption: `Sunday closet reset 🧺

Three capsule pieces that save the week: linen dress, wide leg, and structured bag.

#organization #capsulewardrobe`,
  },
  "demo-post-viagem": {
    caption: `Weekend bag with 5 pieces — challenge accepted 🧳

Everything fits in the Nômade bag. Full list in the "Light travel" highlight.

#travel #packing #estudionomade`,
    carousel_summary: "Open suitcase, 5 numbered pieces, mirror outfit.",
  },
  "demo-post-carousel": {
    caption: `Summer capsule collection — fewer pieces, more outfits ✨

Sand linen dress · olive wide leg · straw belt · rustic sandals

Size guide on the last slide. Size questions? Comment here.

#casualstyle #summernomade #estudionomade`,
    carousel_summary:
      "Lookbook: cover, linen dress, wide leg, accessories, size chart.",
    reply_prompt: REPLY_PROMPT_STORE,
    assets: [{ filename: "capa.jpg", alt_text: "Summer lookbook cover" }],
  },
  "demo-post-collab": {
    caption: `Collab with @marina.mods — 2 looks using only the capsule 💫

Look 1: linen dress + sandals. Look 2: wide leg + straw belt.

Which would you wear for Sunday lunch?

#collab #styling #estudionomade`,
  },
  "demo-post-failed": {
    caption: `The experience starts before you get dressed 📦

Recycled paper, cotton tape, and a little card with care instructions — because opening the order is part of the ritual.

Tell us: what do you reuse the packaging for?

#unboxing #slowfashion #estudionomade`,
  },
  "demo-post-cal-07": {
    caption: `Breakfast + a comfortable look ☕️

Cotton tank + wide leg pants = Zoom meeting without suffering.

#routine #homeoffice`,
  },
  "demo-post-published": {
    caption: `3 ways to use the Nômade bag every day 👜

1. Coffee + laptop · 2. Saturday market · 3. Road trip

Which matches your routine? Drop the number!

#nomadebag #stylingtips #estudionomade`,
  },
  "demo-post-monitored": {
    caption: `Remote work routine (and still getting out of pajamas) ☕️

Coffee, store orders, a comfortable outfit, and a midday break.

It's not about looking polished all day — it's about feeling good.

#remotework #slowliving #estudionomade`,
  },
  "demo-post-scheduled": {
    caption: `Nomad summer 🌿

Linen, cotton, and sand tones for lightness without giving up style.

In the carousel: flat lay, rooftop look, size guide, and store link.

Save to build your capsule wardrobe!

#lookbook #summer2026 #sustainablefashion #estudionomade`,
    carousel_summary:
      "6 slides: cover, flat lay, rooftop look, sandals, size guide, store CTA.",
    reply_prompt: REPLY_PROMPT_STORE,
  },
  "demo-post-draft": {
    caption: `Behind the scenes of the summer capsule ☀️

Sand, olive, and off-white palette — fabric on body, coffee in hand, team picking the best angles.

Which vibe do you prefer: full look or texture close-up?

#bts #estudionomade #casualstyle`,
  },
  "demo-post-sustentavel": {
    caption: `Sustainable packaging that's part of the experience 📦

Recycled paper, cotton tape, and a care card for each piece.

Got yours yet? Tag us in your stories!

#sustainability #slowfashion`,
  },
  "demo-post-cal-13": {
    caption: `Honest question: how many pieces do you actually wear from your closet? 👀

We bet on a capsule — less deciding, more time for what matters.

#consciousfashion #minimalism`,
  },
  "demo-post-cal-14": {
    caption: `The detail that changes the look: straw belt on the linen dress 🌾

Light accessory, zero effort. Save this tip.

#details #accessories`,
  },
  "demo-post-cal-15": {
    caption: `Saturday market with the Nômade bag 🥬

Comfortable look, reusable tote, coffee afterwards. Perfect ritual.

#lifestyle #market #estudionomade`,
  },
  "demo-post-cal-16": {
    caption: `March arrived with store news and plenty of styling inspiration ✨

Light knit, moss tones, and the wide leg pants you ask for every day.

Keep an eye on stories — real try-ons with the team.

#estudionomade #newarrivals #casualstyle`,
  },
  "demo-post-cal-17": {
    caption: `One cotton tank, three occasions 👕

Morning meeting, coffee with a friend, park walk — same base, different moods.

Which would you wear on Monday?

#casualstyle #styletips #estudionomade`,
  },
  "demo-post-cal-18": {
    caption: `Olive wide leg: how to wear it at work without looking too casual 💼

Tip: light blazer on top or a more structured sandal.

#workwear #wideleg`,
  },
  "demo-post-cal-19": {
    caption: `Light autumn live shop 🍂

Fine knit, wide leg pants, and that effortless "tidy home" feeling.

Waitlist in bio — first in line gets the link.

#liveshop #lightautumn #estudionomade`,
    carousel_summary:
      "Event cover, light knit preview, date and waitlist CTA.",
  },
  "demo-post-cal-20": {
    caption: `Inside the sand linen dress ✂️

Breathable fabric, reinforced inner finish, stitching that lasts all day.

Fashion made to last — and to pair with everything.

#slowfashion #bts #estudionomade`,
  },
  "demo-post-cal-21": {
    caption: `Online shopping without surprises: delivery, exchanges, and sizes 📏

Everything we answer most in DMs — now in a carousel to save.

First free exchange within 7 days. Store link in bio.

#onlinestore #consciousfashion #estudionomade`,
    carousel_summary:
      "4 slides: regional delivery, free exchange, size guide, contact.",
    reply_prompt: REPLY_PROMPT_STORE,
  },
  "demo-post-cal-22": {
    caption: `@julia.style tried PP and M of the linen dress — results are in stories 💬

Loose fit in both, but the vibe changes completely.

Which size would you pick?

#collab #casualstyle #estudionomade`,
  },
  "demo-post-cal-23": {
    caption: `Rustic sandals: the pair that doesn't tire in the heat 🩴

Soft insole, low heel. Pair with a dress or wide leg.

#shoes #summer`,
  },
  "demo-post-cal-24": {
    caption: `Terracotta Nômade bag 🧡

The color you asked for is here — warm, versatile, same internal pocket that fits a laptop.

Comment "I want it" and we'll tag you at launch.

#nomadebag #newarrival #estudionomade`,
  },
  "demo-post-cal-25": {
    caption: `48-hour bag with 4 capsule pieces 🧳

Less volume, more combinations. Step by step in the video.

Save to copy on your next trip!

#travel #packing #estudionomade`,
  },
  "demo-post-cal-26": {
    caption: `"Finally found comfortable pants for meetings" 💬

Real customer message (with permission). You ask for this every week — here it is: olive wide leg, high waist, fabric that doesn't cling.

#testimonial #wideleg #estudionomade`,
  },
  "demo-post-cal-27": {
    caption: `Light autumn: fine knit + wide leg pants 🍁

Moss and caramel on the palette, comfort in balance.

What look would you build with these two pieces?

#lightautumn #casualstyle #estudionomade`,
  },
  "demo-post-cal-28": {
    caption: `Rooftop shoot, good wind, sand palette ☀️

The whole team loves this light.

Which look do you want to see first in stories?

#bts #estudionomade`,
  },
  "demo-post-cal-29": {
    caption: `Store birthday promo — list members only 💌

Sign up via bio link. No spam — just the essentials.

#birthday #promo`,
  },
  "demo-post-cal-30": {
    caption: `Autumn live shop — limited spots 🍂

Waitlist members get the link before everyone else. No spam, just essentials.

Sign up in bio.

#liveshop #estudionomade`,
  },
};
