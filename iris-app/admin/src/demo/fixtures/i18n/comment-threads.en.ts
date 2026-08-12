/** Limits aligned with real Instagram comments + Iris persona behavior. */
export const DEMO_USER_COMMENT_MAX = 140;
export const DEMO_BRAND_COMMENT_MIN = 200;
export const DEMO_BRAND_COMMENT_MAX = 300;

export type CommentTurn = { author: "user" | "brand"; text: string };

function brand(
  body: string,
  signer: "equipe" | "julia" | "ana" = "equipe",
): string {
  if (body.includes("Estúdio Nômade")) return body;
  const line =
    signer === "julia"
      ? "Julia, Estúdio Nômade"
      : signer === "ana"
        ? "Ana, Estúdio Nômade"
        : "Team Estúdio Nômade 💛";
  return `${body}\n${line}`;
}

/** Threads 6–8 turns — elaborate exchanges, some brand messages ~300 characters. */
export const ELABORATE_THREADS: CommentTurn[][] = [
  [
    {
      author: "user",
      text: "Saw the carousel and remembered last summer traveling with one bag. I want to dress like that again — does the sand linen dress cling at the hips? I'm 5'4\" with curves.",
    },
    {
      author: "brand",
      text: brand(
        "Love that memory — traveling light is exactly what the capsule is about ☀️ On the sand dress: the cut has intentional ease at the hips and linen creases with charm, not a tight cling. On the product page the guide says to measure bust and hips lying flat; between sizes, many curvy customers size up at the bust and belt the waist.",
        "julia",
      ),
    },
    {
      author: "user",
      text: "I wear M in party dresses and size 8 in jeans. Stuck between S and M. Saturday daytime wedding — if I order today, will it arrive?",
    },
    {
      author: "brand",
      text: brand(
        "With size 8 jeans, M in the linen dress usually feels comfortable without boxy. For southern Brazil, average is 5–8 business days after payment clears — Saturday wedding with an order today might be tight depending on ZIP. Pix confirms in minutes; tracking goes to email. Open the cart and DM your ZIP and we'll check estimated delivery before you checkout.",
      ),
    },
    {
      author: "user",
      text: "Perfect, I'll try M. Do you restock S often? My sister wants the same but only wears S.",
    },
    {
      author: "brand",
      text: brand(
        "S turns fast in summer — when it's out, the waitlist on the product page emails as soon as we restock. For your sister, join the list today; we can't promise an exact date, but we restock this piece on short cycles. Meanwhile the size guide helps compare S vs M if she's unsure.",
      ),
    },
    {
      author: "user",
      text: "Thanks for your patience! I bought M and sent her the guide. You turn curiosity into confidence — rare for online stores.",
    },
    {
      author: "brand",
      text: brand(
        "We're so happy to hear that — Ana built the brand for this: less sizing anxiety, more pieces you actually wear. When the dress arrives, tag us in stories if you like; we love seeing sand linen in real life. Happy wedding Saturday! ✨",
        "ana",
      ),
    },
  ],
  [
    {
      author: "user",
      text: "The wide leg pants changed how I think about office comfort. But I'm insecure — do they make me look wider or is that in my head?",
    },
    {
      author: "brand",
      text: brand(
        "Valid question — and a common one. Wide leg on purpose elongates when the length hits the back of your shoe and the waist sits right. If it feels like 'volume,' try a fitted tank on top and white sandals or sneakers — proportion balance. Olive from this post is neutral; it draws attention to drape, not hips.",
        "julia",
      ),
    },
    {
      author: "user",
      text: "Hybrid work 3 days in office. I want pants that don't look like pajamas in meetings but don't pinch like skinny jeans. Does wide leg work?",
    },
    {
      author: "brand",
      text: brand(
        "It works great — one of our most common use cases. Linen + cotton on top, wide leg below: home office comfort with a 'I put a look together' feel. For office, close with loafers or a more covered sandal; for remote, slippers are fair 😄 The 'Sizes' highlight shows waist and inseam so you don't miss on fit.",
      ),
    },
    {
      author: "user",
      text: "I wear size 10 in dress pants. Wide leg M or L?",
    },
    {
      author: "brand",
      text: brand(
        "With dress pants size 10, M in olive wide leg is usually the comfortable wide fit; if you like more ease at the waist, L can work with a belt. Measure waist and hips on a flat surface — like slide 2 of the guide — and compare to the chart. Reply with bust/waist/hips and we'll suggest a size before you buy.",
      ),
    },
  ],
  [
    {
      author: "user",
      text: "Bought the Nômade bag last month thinking it was 'just another bag.' It's my coffee, market, and coworking companion now. Do the straps really hold laptop + bottle?",
    },
    {
      author: "brand",
      text: brand(
        "Beautiful story — that's the use we designed for: busy routine, one piece that doesn't quit 💛 Straps are reinforced raw cotton and the base fits a 13\" MacBook with room + bottle; magnetic closure holds without screaming 'tech bag.' If you ever notice strap wear, DM a photo and we'll advise care or replace if it's a stitching defect.",
      ),
    },
    {
      author: "user",
      text: "Any terracotta or other colors coming? Natural goes with everything but I want a tone for autumn.",
    },
    {
      author: "brand",
      text: brand(
        "Soft terracotta is in the pipeline for the next few weeks — newsletter and waitlist get first word. Natural was intentional as a capsule base; terracotta lands as a seasonal accent without fighting sand and olive. Comment 'I want it' here or join the store list and we'll remind you at launch.",
      ),
    },
    {
      author: "user",
      text: "Done! Thanks for answering calmly — feels like a real conversation, not a bot.",
    },
    {
      author: "brand",
      text: brand(
        "We take that seriously: comments are the storefront, not a checklist. Thanks for trusting the bag and sharing how it fits your routine — stories like that feed the next collection. When terracotta drops, we'll be here 🙌",
        "ana",
      ),
    },
  ],
  [
    {
      author: "user",
      text: "Almost gave up on online clothes after 3 exchanges at other brands. Your size guide made me try once more — and I got it right first time.",
    },
    {
      author: "brand",
      text: brand(
        "Thanks for sharing — three exchanges is exhausting. The guide came from frustrated customers: measure flat, don't stretch fabric, fit notes per piece (wide vs fitted). Glad it worked for you; if it ever misses, first exchange within 7 days still applies with return shipping on us the first time.",
      ),
    },
    {
      author: "user",
      text: "Measured at home with the highlight video. Dress M looked like the carousel model. Will you do a video for pants too?",
    },
    {
      author: "brand",
      text: brand(
        "Yes — wide leg is on the sizing content queue; the challenge is showing waist vs hips without the camera lying. Meanwhile slide 2 of the store guide separates body measure from garment measure. Save the 'Sizes' highlight — we'll announce when the new video is up.",
      ),
    },
    {
      author: "user",
      text: "Saved! Referred two friends who also work remote.",
    },
    {
      author: "brand",
      text: brand(
        "Friend referrals are the best compliment. If they have size questions, send them here — we answer the same way, no rush to checkout. Have a comfortable week of outfits ☀️",
      ),
    },
  ],
  [
    {
      author: "user",
      text: "@marina.mods in look 1 was flawless 😍 Is her sand dress the same as on the site or a styling version?",
    },
    {
      author: "brand",
      text: brand(
        "Same sand linen dress from the store — Marina styled it with rustic sandals and straw belt from our archive. Collabs are real pieces, looks you can recreate. Look 2 uses olive wide leg from the capsule; to build both with current stock, link in bio and size guide on the last carousel slide.",
        "julia",
      ),
    },
    {
      author: "user",
      text: "Would look 2 work at a creative office? Or too casual?",
    },
    {
      author: "brand",
      text: brand(
        "Creative offices often accept wide leg + structured tank + loafers or closed sandals. Swap slippers for shoes and add a light blazer if culture needs more formality. The pants aren't jeans — linen/cotton reads more 'assembled' than pure weekend.",
      ),
    },
    {
      author: "user",
      text: "Perfect, I'll test Monday. Thanks Marina and team!",
    },
    {
      author: "brand",
      text: brand(
        "Marina will love reading this — we'll pass it on! Tag us if you post Monday's look; we love real community styling ✨",
      ),
    },
  ],
  [
    {
      author: "user",
      text: "Opened the package and almost kept the paper box on the shelf — it's too pretty. You think about fashion and the ritual of receiving, right?",
    },
    {
      author: "brand",
      text: brand(
        "Exactly — packaging is part of the experience, not just protection. Recycled paper, reusable cotton tape, care card (hand-wash linen, shade dry). Reuse: tape on notebooks, card as bookmark, box for scarves. Slow fashion also means less trash in the regular bin 📦",
        "ana",
      ),
    },
    {
      author: "user",
      text: "Any plan for refill or leaner packaging? I buy little but think about it.",
    },
    {
      author: "brand",
      text: brand(
        "We're testing a slimmer envelope for single pieces without losing protection — follow stories when we validate. Meanwhile feedback like yours goes into the supplier spreadsheet. Thanks for buying thoughtfully; that's the customer we want to grow with.",
      ),
    },
    {
      author: "user",
      text: "That convinced me to come back for the next collection.",
    },
    {
      author: "brand",
      text: brand(
        "We're honored. When terracotta and new basics launch, newsletter alerts you — no spam, just launches and restocks. Until then, care for the linen and DM us for wash tips.",
      ),
    },
  ],
  [
    {
      author: "user",
      text: "Remote since 2020 and tired of 'video call' tops that itch afterwards. The post look seems comfortable without looking like I woke up 5 minutes ago.",
    },
    {
      author: "brand",
      text: brand(
        "That's the line we chase: comfort that doesn't embarrass on camera 😄 Medium cotton tank + wide leg = clean torso on screen, free legs off. Not pajamas because the drape is intentional — neutral palette, fabric with body. Light bra under our cotton is fine; very light bra, layer a tee.",
      ),
    },
    {
      author: "user",
      text: "Does the tank show with a beige bra? 40 min calls and light sweat.",
    },
    {
      author: "brand",
      text: brand(
        "Beige usually works; if you sweat a lot, off-white from the collection is safer on camera — same fabric, safer tone. Wash delicate to keep hand; skip dryer that can shrink light cotton slightly. For long calls, light cardigan: style plus backup if AC gets cold.",
      ),
    },
    {
      author: "user",
      text: "Built cart with tank + pants. Does Pix confirm right away?",
    },
    {
      author: "brand",
      text: brand(
        "Pix confirms in minutes at most banks — order enters packing same business day if paid before cutoff. Tracking to email and customer area. Any checkout glitch, screenshot in DM and we'll unblock with you.",
      ),
    },
  ],
  [
    {
      author: "user",
      text: "I live in Porto Alegre and had delays with other stores in the south. What's your real experience? Need a gift by the 20th.",
    },
    {
      author: "brand",
      text: brand(
        "Full transparency: for the south we work with 5–8 business days after payment clears — capitals tend toward the lower end. Can't promise miracle on the 20th without ZIP and order date, but Pix today + POA usually fits with moderate margin. Tracking by email; if it passes checkout estimate, customer area or DM and we track with you.",
      ),
    },
    {
      author: "user",
      text: "If Correios delays, do you help or just 'wait'?",
    },
    {
      author: "brand",
      text: brand(
        "We help — we don't disappear after sale. Open a ticket in customer area with stuck tracking; within 1–2 business days we respond with guidance or reship per case. Gift for the 20th: DM ZIP before paying and we'll confirm realistic window.",
      ),
    },
    {
      author: "user",
      text: "Sent ZIP in DM. Thanks for not being a one-line auto reply.",
    },
    {
      author: "brand",
      text: brand(
        "We'll review ZIP in DM carefully. Thanks for patience — a gift that arrives on time beats empty promises. We'll reply there today with any update.",
      ),
    },
  ],
  [
    {
      author: "user",
      text: "Saved the weekend bag carousel — flying Friday, back Sunday with cabin bag only. Do rustic sandals hold up on stone paths?",
    },
    {
      author: "brand",
      text: brand(
        "Great trip! Rustic sandals handle light city walking — sun, sidewalk, café. All-day rough stone can tire like any flat; for heavy trails pack sneakers and sandals for dinner. Carousel shows the 5-piece + Nômade bag combo; full list in 'Light travel' highlight.",
        "julia",
      ),
    },
    {
      author: "user",
      text: "Sneakers in bag, sandals on feet for the trip. Does the bag count as personal item in cabin?",
    },
    {
      author: "brand",
      text: brand(
        "Most carriers fit it under seat or overhead if not full — Nômade bag is compact when empty and flexible. 13\" laptop + toiletry + light layer is what customers report without stress. Check your airline, but it's not a giant carry-on.",
      ),
    },
    {
      author: "user",
      text: "Got it. Bought straw belt too — ties the dress at the waist in photo 3?",
    },
    {
      author: "brand",
      text: brand(
        "Exactly — straw belt on linen dress defines waist without losing loose drape. Look 3 in the carousel is the 'travel dinner' vibe. Safe trip Friday; tag stories if you pack the 5 pieces 🧳",
      ),
    },
  ],
  [
    {
      author: "user",
      text: "Afraid to buy and not fit again. Do you exchange without nightmare bureaucracy? I cried in another store's chat.",
    },
    {
      author: "brand",
      text: brand(
        "Sorry for past experiences — bureaucracy kills trust. Here: first free exchange within 7 calendar days after delivery, unworn with tags. Open in customer area; we reply in 1–2 business days with return label. First exchange return shipping is on us. Second exchange, return shipping is customer.",
      ),
    },
    {
      author: "user",
      text: "If it's just 2 cm off at the waist? Not 'unworn' if I tried at home?",
    },
    {
      author: "brand",
      text: brand(
        "Careful home try-on — no odor, tags intact — counts for size exchange. 2 cm at waist sometimes fixes with belt or another size; if you prefer exchange, size guide on the request helps nail the second try. We'd rather you wear the right piece than stash it in the closet.",
      ),
    },
    {
      author: "user",
      text: "Ok, I'll measure again and order. Thanks for explaining without copypaste.",
    },
    {
      author: "brand",
      text: brand(
        "Measure calmly; share bust/waist/hips here before checkout if you want. Right size is half the Nômade experience. We're here 💛",
      ),
    },
  ],
  [
    {
      author: "user",
      text: "Read the capsule closet post and realized I wear 20% of clothes 80% of the time. Want to start slow — if only one piece now, which do you recommend?",
    },
    {
      author: "brand",
      text: brand(
        "Slow start is best — capsule isn't buying everything at once. If just one: sand linen dress or olive wide leg, depending on routine. Lots of meetings and heat? Dress. Mixed daily life? Wide leg pairs with everything in the post. Both go café, market, dinner with a shoe change.",
        "julia",
      ),
    },
    {
      author: "user",
      text: "Hybrid routine, 3 office days. Wide leg then. Does olive fade?",
    },
    {
      author: "brand",
      text: brand(
        "Olive was tested through repeated delicate washes — light fade is natural with plant dye, but it doesn't turn gray in the first month if you follow the care card. Wash inside out, cold water, shade. Capsule color because it pairs with sand, off-white, and natural without fighting.",
      ),
    },
    {
      author: "user",
      text: "Thanks — feels like styling chat, not just sales.",
    },
    {
      author: "brand",
      text: brand(
        "That's what Ana wants on the feed: less trigger, more wardrobe that works. When wide leg arrives, come back for 3 looks with the same pants — we love that conversation ✨",
        "ana",
      ),
    },
  ],
];

/** Threads 4–5 turns — between elaborate and simple pairs. */
export const MEDIUM_THREADS: CommentTurn[][] = [
  [
    {
      author: "user",
      text: "Is slide 2 sand linen the same tone as the site? On my phone it looks more beige.",
    },
    {
      author: "brand",
      text: brand(
        "Screen variation is real — shooting light reads more sand, phone auto can pull beige. Site has neutral photo and 'grayed sand' description. Between sand and off-white: sand is warmer; off-white is cooler. Size guide on last slide helps visualize on body.",
      ),
    },
    {
      author: "user",
      text: "Perfect, I want the sandier one. First purchase coupon?",
    },
    {
      author: "brand",
      text: brand(
        "Newsletter in bio gives 10% on first purchase — test before checkout. If subscribed and nothing arrived, check spam or email store contact for resend. No invented coupons here: only what's on the official site.",
      ),
    },
  ],
  [
    {
      author: "user",
      text: "4 installments no interest for all Brazil? Nubank card works?",
    },
    {
      author: "brand",
      text: brand(
        "4x no interest on credit card per checkout conditions — Nubank usually passes like any issuer, approval is the bank. Pix upfront confirms fast if you prefer. Minimums and rules show at payment before you confirm.",
      ),
    },
    {
      author: "user",
      text: "Pix then — yesterday's order has tracking yet?",
    },
    {
      author: "brand",
      text: brand(
        "Tracking usually ships 1–2 business days after payment clears. Check email and customer area; if past that, DM order number and we'll find internal status without leaving you hanging.",
      ),
    },
  ],
  [
    {
      author: "user",
      text: "Dress works for nursing? Neckline looks ok in photo but I have a 4-month-old.",
    },
    {
      author: "brand",
      text: brand(
        "Neckline allows discreet access for many bodies, but everyone differs — size guide + customer photos in highlights help. If nursing ease is priority, off-white tank + wide skirt may be more flexible. First exchange within 7 days if home try doesn't work.",
      ),
    },
    {
      author: "user",
      text: "Good, I'll check highlights. Free shipping?",
    },
    {
      author: "brand",
      text: brand(
        "Free shipping above R$ 299 in Southeast during current campaigns — check cart with your ZIP. Northeast and North have their own table; transparent before pay, no surprise at the last step.",
      ),
    },
  ],
  [
    {
      author: "user",
      text: "Loved the Nômade bag video in 3 contexts — which use do you see most in the community?",
    },
    {
      author: "brand",
      text: brand(
        "Coffee + laptop leads, then Saturday market and road trips. Bag was designed to move through the day without switching three times. Which of the 3 fits you? Genuine curiosity — we use it in the next reel.",
      ),
    },
    {
      author: "user",
      text: "Market + coffee, 100%. Does 14\" MacBook really fit?",
    },
    {
      author: "brand",
      text: brand(
        "14\" fits with moderate room and side bottle — customers report without forcing closure. 15\" may need a slimmer case; if that's you, DM and we'll confirm with internal reference photo.",
      ),
    },
  ],
  [
    {
      author: "user",
      text: "Collab with @marina.mods was pure inspiration. Part 2 with light winter looks?",
    },
    {
      author: "brand",
      text: brand(
        "Marina already wants part 2 — likely light layers and terracotta when the color drops. No date yet; follow profile and stories for collab news before feed. Thanks for watching — community asks, we listen.",
      ),
    },
    {
      author: "user",
      text: "Turned on notifications. Look 1 sandals from the site?",
    },
    {
      author: "brand",
      text: brand(
        "Rustic straw sandals from look 1 are in the store, sizes 34–40. Pair with sand dress and wide leg; size guide in carousel. If your size is out, waitlist on product page.",
        "julia",
      ),
    },
  ],
  [
    {
      author: "user",
      text: "Strong new fabric smell bothers me — do you air before shipping?",
    },
    {
      author: "brand",
      text: brand(
        "Natural fabric can have light factory odor; we don't add perfume. Delicate wash on arrival fixes most cases. If something unusual persists, photo + DM and we'll assess exchange — shouldn't stay strong after fresh air.",
      ),
    },
    {
      author: "user",
      text: "Washed and it went away. Thanks!",
    },
    {
      author: "brand",
      text: brand(
        "Great! Keep care card in the closet — linen and cotton like cold water and shade. Any maintenance question, come back here.",
      ),
    },
  ],
  [
    {
      author: "user",
      text: "Plus size: dress goes up to what? Site only shows through L.",
    },
    {
      author: "brand",
      text: brand(
        "Linen dress today through L; wide leg through XL. Grade expansion is on autumn roadmap — newsletter alerts. If you're between L and need more, measure and DM: sometimes loose linen drape works without extra grade.",
      ),
    },
    {
      author: "user",
      text: "I'll measure and wait for autumn. Thanks for honesty.",
    },
    {
      author: "brand",
      text: brand(
        "Honesty avoids frustrating exchanges. When new sizes launch, we'll be here — waitlist alerts who already showed interest.",
      ),
    },
  ],
  [
    {
      author: "user",
      text: "Rain look for São Paulo — does wide leg hem get soaked?",
    },
    {
      author: "brand",
      text: brand(
        "Hem can wet like any long pant — slight cuff, waterproof sneakers, or tailor shorten if chronic. Linen dries fast ventilated; skip dryer. Tank + light waterproof jacket is the SP customer hack.",
      ),
    },
    {
      author: "user",
      text: "Already have jacket. Going olive wide leg.",
    },
    {
      author: "brand",
      text: brand(
        "Good pick — olive doesn't show rain like off-white. Have a wet week and DM if you need post-rain care tips.",
      ),
    },
  ],
];

/** Root pairs — user up to ~140 chars, brand 200–280. One pair becomes pending (index set in builder). */
export const REALISTIC_PAIRS: Array<{ user: string; brand: string }> = [
  {
    user: "What's the store link again? Saved the post but lost the bio.",
    brand: brand(
      "Everything at @estudio.nomade bio and loja.estudionomade.app — same stock, same size photos. If bio link fails, copy the URL or use Pix on desktop checkout. Any page error, screenshot in DM and we'll help.",
    ),
  },
  {
    user: "Love the sand and olive palette — feels breathable. Any men's pieces planned?",
    brand: brand(
      "Glad the palette spoke to you ☀️ Men's line isn't in catalog yet — today we focus women's capsule and occasional unisex (Nômade bag, some accessories). If expansion comes, newsletter and stories first. Thanks for asking kindly.",
    ),
  },
  {
    user: "First purchase coupon or wait for sale? Want the dress but budget is tight.",
    brand: brand(
      "Newsletter in bio gives 10% on first purchase — official discount today, no secret comment codes. Seasonal sales we announce on feed; if dress is priority, size waitlist alerts restock. We don't invent promos here: only what's on the site.",
    ),
  },
  {
    user: "Does the dress wrinkle in shipping? Afraid of permanent creases.",
    brand: brand(
      "Linen wrinkles — it's the fabric, not a defect. Light steam or bathroom steam fixes in minutes; card in packaging explains. Skip very hot iron that can shine fiber. Many customers wrinkle on purpose for natural look.",
    ),
  },
  {
    user: "Ship to Northeast? I live in Recife and always worry about timing.",
    brand: brand(
      "Yes — Northeast usually 8–12 business days after payment clears, Recife ZIP dependent. Tracking by email; if far past checkout estimate, customer area or DM. Pix confirms fast if you want to speed packing.",
    ),
  },
  {
    user: "Machine wash or hand only? I'm lazy with delicate laundry 😅",
    brand: brand(
      "Delicate cycle, cold water, wash bag, shade dry — machine is fine without heavy spin. Linen and cotton prefer less friction. Inside out if possible. Care card in box; following it extends life.",
    ),
  },
  {
    user: "Nômade bag fits 13\" MacBook with case + bottle? Daily coworking.",
    brand: brand(
      "13\" with slim case + side bottle is our most common combo — fits without forcing magnetic closure. Very bulky case, try without or slim backpack. Reinforced straps for routine; abnormal wear, photo in DM.",
    ),
  },
  {
    user: "Straw belt pinches at waist? Sensitive skin.",
    brand: brand(
      "Inner finish is soft; if it pinches, wear looser or tee underneath first week while material settles. Natural straw has texture — not rigid leather. If too much, first exchange within 7 days for careful home try.",
    ),
  },
  {
    user: "When is terracotta coming? Want autumn without fast fashion again.",
    brand: brand(
      "Soft terracotta lands in coming weeks — comment 'I want it' or newsletter, no spam. We get not falling into fast fashion: our pitch is pieces that stay, not disposable drops. Thanks for waiting intentionally.",
    ),
  },
  {
    user: "Pix order yesterday — tracking now or only after packing?",
    brand: brand(
      "Pix confirmed enters packing same business day if paid before cutoff. Tracking 1–2 business days to email and customer area. Past that, DM order number — we locate without making you repeat the story.",
    ),
  },
  {
    user: "Perfect Saturday market look 🥬 Sandals ok on wet dirt?",
    brand: brand(
      "Market + coffee is community classic! Rustic sandals handle city and light ground; all-day wet dirt can slip like any flat — sneakers in bag for irregular ground. Wide leg hem doesn't stain easily if lightly wet.",
    ),
  },
  {
    user: "Carousel model height? I'm 5'2\" and afraid dress will swallow me.",
    brand: brand(
      "Lookbook model is 5'6\" — bust/waist/hip on last slide. At 5'2\" linen dress may read longer; some customers simple hem or lower sandal. Compare chart to your measures before buying.",
    ),
  },
  {
    user: "Dress has pocket? Need phone space at market.",
    brand: brand(
      "Discreet side pocket on sand linen dress — fits slim phone without breaking drape. Thick wallet, bag or belt helps. Detail in third slide close-up.",
    ),
  },
  {
    user: "Gift card? Birthday gift without wrong size.",
    brand: brand(
      "Digital gift card on store, open amount — recipient picks piece and size. Link in 'Gifts' section. Terms at gift checkout. Best path for size-free gifting.",
    ),
  },
  {
    user: "Sand pulls yellow on brown skin or truly neutral?",
    brand: brand(
      "Our sand is grayed neutral, not golden yellow — usually works warm and cool undertones. For contrast, olive and off-white from same carousel work. Natural shooting light is best reference; screens vary.",
    ),
  },
  {
    user: "Wide leg with white sneakers — childish or office ok?",
    brand: brand(
      "Clean white sneakers + wide leg + tank or light shirt works in creative offices — not childish if palette is neutral and sneakers minimal. Loafers if more formal. Julia uses it in styling stories.",
      "julia",
    ),
  },
  {
    user: "Pix and installments same order? Never know which to pick.",
    brand: brand(
      "One or the other at checkout — Pix upfront confirms in minutes; card allows installments per gateway. Can't mix same order. Compare total installments vs Pix; both secure on official site.",
    ),
  },
  {
    user: "Saving to buy on the 15th — can you hold size M without payment?",
    brand: brand(
      "No formal hold without payment — live stock. DM near the 15th and we'll confirm if M is still available; if gone, waitlist alerts restock. Thanks for planning consciously.",
    ),
  },
  {
    user: "Fabric sheer in strong sun? Work on balcony and camera shows everything.",
    brand: brand(
      "Tank and dress have partial lining where needed — light bra helps in strong sun. Carousel close shows real transparency without misleading filter. Zero sheer priority, structured off-white may beat fine linen.",
    ),
  },
  {
    user: "Physical store in SP? Want to try before buying but live inland.",
    brand: brand(
      "Online + occasional SP pop-up in stories — no permanent store. Size guide, first exchange in 7 days, customer photos in highlights offset no fitting room. Pop-up announced ahead if scheduled.",
    ),
  },
];
