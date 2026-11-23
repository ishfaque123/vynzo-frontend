export interface BlogSection {
  heading: string | null;
  paragraphs: string[];
}

export interface BlogArticle {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO yyyy-mm-dd
  readingMinutes: number;
  sections: BlogSection[];
}

export const articles: BlogArticle[] = [
  {
    slug: 'how-creators-earn-online-pakistan',
    title: 'How creators in Pakistan actually earn online: the legitimate routes',
    description:
      'No hype and no shortcuts: the real ways Pakistani creators and freelancers earn money online — platform programs, brand deals, client work, products and teaching — and how the payments actually reach a Pakistani bank account.',
    date: '2026-10-23',
    readingMinutes: 6,
    sections: [
      {
        heading: null,
        paragraphs: [
          'Search for "online earning in Pakistan" and you will drown in promises: earn lakhs from your phone, no skills needed, start today. The truth is quieter and much better than the hype. Thousands of Pakistanis genuinely do earn online — as creators, freelancers, teachers and small sellers — but every legitimate route has the same shape: a real skill or a real audience, offered to real people or businesses who pay for a reason. This guide walks through the routes that actually work, what each one demands from you, and how the money physically reaches you in Pakistan.',
        ],
      },
      {
        heading: '1. Platform monetisation programs',
        paragraphs: [
          'The route most people imagine first is getting paid by a platform itself. YouTube\u2019s Partner Program shares advertising revenue with channels that meet its subscriber and watch-time thresholds and follow its content policies. Facebook and TikTok run their own creator programs with their own eligibility rules, and newer platforms periodically open local programs too. Two honest warnings: the thresholds and rules change often, so always check the program\u2019s official page rather than a video someone made last year — and earnings per view in Pakistan are usually modest, because advertisers pay less for Pakistani audiences than for American or European ones. Treat platform payouts as one stream among several, not the whole plan.',
        ],
      },
      {
        heading: '2. Brand deals and sponsored content',
        paragraphs: [
          'For many mid-sized Pakistani creators, local brands pay better than platforms do. A clothing label, a food brand, a coaching academy or a mobile shop would rather pay a trusted local creator whose followers actually buy things than run a generic ad. Brands care about engagement and trust far more than raw follower counts — a small account whose comments are full of real questions is worth more than a huge account full of silent, bought followers. Start by posting honest reviews of products you already use, keep screenshots of your best-performing posts, and write a simple one-page profile of your audience and rates. That professionalism is what separates creators brands return to from creators they try once.',
        ],
      },
      {
        heading: '3. Freelancing the skills behind your content',
        paragraphs: [
          'If you can make a good reel, you already have a sellable skill. Small businesses across Pakistan — restaurants, salons, clothing sellers, clinics, academies — need exactly what creators do for fun: short videos, product photos, captions, page management. Many creators earn their first real online income not from views but from two or three local clients paying a monthly fee for content. The same skills also sell internationally on freelance marketplaces: video editing, thumbnail design, caption writing, translation between Urdu, English and regional languages, and social media management. Client work is unglamorous and dependable — the opposite of viral fame, and for most people a faster road to real money.',
        ],
      },
      {
        heading: '4. Selling products and services of your own',
        paragraphs: [
          'An audience that trusts you will buy from you. Pakistani creators sell home-made food, clothing, cosmetics, plants, exam notes, design templates, and services from tutoring to fitness coaching — usually coordinated through WhatsApp, with payment by mobile wallet or bank transfer and delivery by courier. Start with one product, a clear price, and honest photos. The creators who fail here almost always fail on operations, not demand: late replies, unclear prices, and deliveries that drift. Answer fast, price clearly, deliver when promised, and your buyers become your marketing.',
        ],
      },
      {
        heading: '5. Affiliate marketing, done honestly',
        paragraphs: [
          'Affiliate programs pay you a commission when someone buys through your link — marketplaces like Daraz run them, as do many software and hosting companies. This can be a fair extra stream if, and only if, you recommend things you have genuinely used. The moment a creator starts pushing random products for commission, followers smell it, and the trust that made the account valuable evaporates. Disclose that a link earns you commission; audiences in Pakistan respect the honesty and punish the hiding.',
        ],
      },
      {
        heading: '6. Teaching what you know',
        paragraphs: [
          'Knowledge is the most underrated product in Pakistan. Creators earn by teaching: recorded courses, live Zoom classes, paid WhatsApp or Telegram groups, e-books and notes. The pattern that works is free, useful content in public — which proves you know the subject — and deeper, structured teaching for those who pay. If your free videos genuinely help people pass an exam, cook a dish, fix a phone or learn a skill, a fraction of those viewers will happily pay for the full version.',
        ],
      },
      {
        heading: '7. How the money actually reaches you',
        paragraphs: [
          'Payments are where many beginners get confused, so here is the practical picture. For local clients and buyers, JazzCash, Easypaisa and direct bank transfer are normal. For international platforms and clients, PayPal does not officially serve Pakistan, so freelancers and creators typically use Payoneer — which receives payments from marketplaces and clients abroad and withdraws to a local Pakistani bank account — or similar services such as Wise where available. Keep simple records of what you earned and from where: a notebook or spreadsheet is enough at the start. As your income grows, registering your work properly and speaking to an accountant about tax is part of treating it as a real business — and legitimate earners do.',
        ],
      },
      {
        heading: 'The honest timeline',
        paragraphs: [
          'Almost every real earner will tell you the same story: the first months paid little or nothing, because they were building the skill and the audience at the same time. Then one stream started working, then a second. Anyone who promises you the reverse — money first, skill later — is selling you something, and a companion article on this blog covers the scams to recognise. Build the skill, serve a real audience, stack two or three of the routes above, and the income stops depending on any single platform\u2019s mood. That is what sustainable online earning in Pakistan actually looks like.',
        ],
      },
    ],
  },
  {
    slug: 'online-earning-scams-pakistan',
    title: 'Online earning in Pakistan: the scams everyone should recognise',
    description:
      'Fake investment apps, jobs that charge a joining fee, WhatsApp task scams and OTP phishing steal money from hopeful Pakistanis every day. Learn exactly how each one works, the red flags they all share, and what to do if you have already sent money.',
    date: '2026-10-23',
    readingMinutes: 6,
    sections: [
      {
        heading: null,
        paragraphs: [
          'Every week, people across Pakistan lose money they could not afford to lose to "online earning" schemes — students with their savings, homemakers with household money, young men borrowing from friends to invest. The schemes wear different costumes, but they run on the same few tricks. This article names those tricks plainly. If you recognise the pattern while it is happening to you or someone in your family, you can stop before the money is gone.',
        ],
      },
      {
        heading: 'Scam 1: "Double your money" investment apps and groups',
        paragraphs: [
          'The pitch: deposit money into an app or send it to an agent, and receive guaranteed profit — daily, weekly, double in a month. Early members really do get paid, which is why they recruit so enthusiastically. But the "profit" is not earned from any business; it is paid out of the deposits of newer members. The moment new deposits slow down, the app stops withdrawals, the group goes silent, and the operators vanish. No genuine investment on earth guarantees high returns on a fixed schedule. If returns are guaranteed and large, the product being sold is you.',
        ],
      },
      {
        heading: 'Scam 2: Jobs that charge you to join',
        paragraphs: [
          'The pitch: a data-entry job, a typing job, an ad-watching job, a packaging job — easy work, high pay, work from home. There is just one small thing: a registration fee, an activation charge, a security deposit, or a "starter kit" you must buy first. Real employers pay you; they never charge you for the privilege of working. The fee is the entire business. Once paid, the "job" either never materialises or pays a few rupees before inventing a new fee for "level two". Any earning opportunity that requires you to pay before you earn has the flow of money exactly backwards.',
        ],
      },
      {
        heading: 'Scam 3: WhatsApp and Telegram task scams',
        paragraphs: [
          'This one starts politely: a message offers part-time work liking videos or rating products. The first tasks genuinely pay small amounts into your wallet — that is the bait, and it works because it feels like proof. Then comes a "high-value task" that requires you to deposit money first to unlock bigger commissions. The deposits escalate. Each withdrawal is blocked by a new condition: a tax, a penalty, a minimum balance. People have emptied accounts chasing money that was never theirs to withdraw. The small early payments are simply the cost of making you trust the big theft.',
        ],
      },
      {
        heading: 'Scam 4: Fake bank, JazzCash and Easypaisa messages',
        paragraphs: [
          'A text or call claims your account will be blocked, a transaction failed, or a prize is waiting — and asks for your PIN, your OTP code, or a click on a link to "verify". Sometimes it is a fake courier demanding a small customs payment for a parcel. Remember the rule that defeats all of these: no bank or wallet company will ever ask for your PIN or OTP, on a call, in a message, or through a link. Those codes are for your fingers only. If a message creates panic and urgency, that panic is the product — hang up, and call the official helpline printed on your card or inside the real app instead.',
        ],
      },
      {
        heading: 'Scam 5: Crypto and trading "mentors"',
        paragraphs: [
          'Screenshots of profits, photos of cars, a friendly mentor who will "double your account" or copy his trades for you. Sometimes it is a fake trading app where your balance grows beautifully on screen — and can never be withdrawn. Sometimes your money goes into a coin that only the group is buying, whose price collapses the moment the organisers sell. Trading is genuinely risky even when it is real; most beginners lose money. Anyone who removes that risk from the story is not describing trading — they are describing a transfer of your money to them.',
        ],
      },
      {
        heading: 'The red flags every scam shares',
        paragraphs: [
          'Different costumes, same skeleton. Be suspicious when you see: guaranteed or unusually high returns; pressure to act immediately before the "offer" closes; payment requested only into a personal wallet or bank account rather than a registered business; no real office, registration, or verifiable company behind the scheme; earnings that depend on recruiting more people; and support that exists only as a WhatsApp number. One red flag can be an accident. Three together are a design.',
          'Before sending money anywhere, do three free checks: search the scheme\u2019s name together with the word "scam" and read what victims say; ask what legal company runs it and verify the name independently; and tell a level-headed friend the full plan out loud — scams often collapse the moment they are described in plain words to someone who is not inside the excitement.',
        ],
      },
      {
        heading: 'If you have already sent money',
        paragraphs: [
          'Act in hours, not days. Call your bank or wallet provider\u2019s official helpline immediately and report the transaction as fraud — fast reports sometimes stop money from moving further. Save every screenshot, number, and receipt. Then report the case to the FIA\u2019s cybercrime wing (NR3C) through its official complaint channels, and warn the group or community where you found the scheme; your warning may save the next person. Do not pay any "recovery agent" who contacts you afterwards — that is the same criminals returning for a second harvest, and it is heartbreakingly common.',
        ],
      },
      {
        heading: 'What real online earning looks like',
        paragraphs: [
          'Real earning is slower and far less dramatic: a skill people pay for, a service a business needs, an audience that trusts you, a product someone is glad to own. It usually pays nothing in the first weeks, which is exactly why the scams — which promise the opposite — find customers. A companion guide on this blog walks through the legitimate routes in detail. Protect your money first; then build the real thing, patiently, on ground that does not disappear overnight.',
        ],
      },
    ],
  },
  {
    slug: 'social-media-privacy-safety-settings-guide',
    title: 'Your social media privacy checklist: the settings to change today',
    description:
      'Most account hacks and privacy disasters come from default settings nobody ever opened. This plain-language checklist walks through the logins, sessions, audience, contact, location and permission settings worth fifteen minutes on every social app you use.',
    date: '2026-10-22',
    readingMinutes: 6,
    sections: [
      {
        heading: null,
        paragraphs: [
          'Every social app arrives with default settings chosen by the company, not by you — and the defaults usually favour sharing over privacy. Most people never open the settings menu until something goes wrong: a stranger commenting on family photos, an old phone still logged into their account, a login code shared with a convincing scammer. Fifteen quiet minutes with this checklist will prevent most of it. The exact menu names differ between apps, but every setting below exists, in some form, on every major platform.',
        ],
      },
      {
        heading: '1. Lock the front door: password and two-step verification',
        paragraphs: [
          'Start where every account takeover starts: the login. Use a long password you do not use anywhere else — a stolen password from one leaked website is routinely tried against every social account with the same email. Then turn on two-step verification (sometimes called two-factor authentication or login verification) in the security settings. Where the app offers an authenticator-app option, prefer it; where only SMS codes are offered, use them anyway — an imperfect lock beats no lock. Save the backup or recovery codes the app gives you somewhere offline, like a notebook at home. And the rule that protects everything else: your login code is yours alone. No company, no "support agent", no prize committee will ever legitimately ask for it.',
        ],
      },
      {
        heading: '2. Review where you are logged in',
        paragraphs: [
          'Most apps keep a list of active sessions or logged-in devices in their security settings. Look at yours. You will often find an old phone, a borrowed laptop, or a browser from months ago still holding a valid login. Remove everything you do not recognise — and anything you simply no longer use. If you see a session from a city you have never visited, change your password immediately after removing it. This single screen is the fastest health check an account can get, and almost nobody looks at it.',
        ],
      },
      {
        heading: '3. Decide who can see your life',
        paragraphs: [
          'Next, walk through the audience settings: who can see your posts, your photos, your stories, your followers and following lists. Decide deliberately instead of accepting defaults. Many people are comfortable with public posts but prefer a private account — where only approved followers see anything — and there is no wrong choice, only an unexamined one. Check also whether search engines and people searching by your phone number or email can find your profile; turning off discovery by phone number is wise if your number circulates widely. While you are there, review old posts: most platforms let you limit past posts or delete the ones that no longer represent you.',
        ],
      },
      {
        heading: '4. Control who can reach you',
        paragraphs: [
          'Open the contact settings: who can send you messages, who can add you to groups, who can mention or tag you, and whether tags appear on your profile only after your approval. Tag approval alone prevents a whole category of embarrassment and spam. Turn on comment filters for offensive words if the app offers them, and learn where the message-request folder is — that is where strangers\u2019 messages land, and it should stay a folder you visit, not a door into your inbox. Blocking is not rude; it is the basic tool the platform gives you, and using it early is always easier than using it late.',
        ],
      },
      {
        heading: '5. Location: the setting people forget',
        paragraphs: [
          'Location leaks quietly. Check whether your posts and photos carry location tags, whether the app adds your city automatically, and whether your phone is attaching GPS coordinates to photos you share. Post the outing after you are home, not while you are there — a public "we are all at a wedding in Karachi" is also a public "our house in Sukkur is empty". If you run a business page, a general area is fine; your home address never is. Children\u2019s locations deserve the strictest rule of all: never in real time, never with a school name attached.',
        ],
      },
      {
        heading: '6. Audit app permissions and connected apps',
        paragraphs: [
          'Two audits, both quick. First, your phone\u2019s permissions for each social app: does it really need your contacts, your microphone when you never record, precise location at all times? Tighten anything you cannot explain. Second, the "connected apps" or "apps and websites" list inside each platform — every quiz, game and "see who visited your profile" tool you ever authorised may still hold access to your account. Remove everything you do not actively use. Those novelty apps are also a common doorway for account theft, which is why no legitimate tool can ever show you your profile visitors: the platforms do not provide that data to anyone.',
        ],
      },
      {
        heading: '7. Public information hygiene',
        paragraphs: [
          'Finally, look at your profile the way a stranger does. Is your personal phone number in your bio? Your exact birth date public? Photos that show your house number, your car plate, your children\u2019s school uniform logo? Creators who need public contact should use a separate work number and email — in Pakistan a second SIM for public contact is cheap and standard practice among careful creators. Your personal number belongs to your family, your bank, and your wallet accounts — not to everyone who can open your profile.',
        ],
      },
      {
        heading: 'A fifteen-minute monthly routine',
        paragraphs: [
          'Privacy is not a one-time setup; accounts drift. Once a month: skim the logged-in devices list, glance at new followers if your account is private, remove one connected app you forgot about, and confirm your recovery email and phone number are still yours — a recycled SIM or an abandoned email is a silent way to lose an account forever. Fifteen minutes a month is the entire price. The account you protect this way is the same one your income, your memories and your community live in — it deserves the routine.',
        ],
      },
    ],
  },
  {
    slug: 'grow-social-media-safely-pakistan',
    title: 'How to grow your social media account safely in Pakistan',
    description:
      'Bought followers, password-hungry "growth apps" and engagement tricks promise fast growth and deliver banned, stolen or hollow accounts. This guide covers the safe road: security first, real content, honest engagement, and growth that is still yours next year.',
    date: '2026-10-22',
    readingMinutes: 6,
    sections: [
      {
        heading: null,
        paragraphs: [
          'Everyone wants the number to go up. Around that desire an entire market has grown in Pakistan: panels selling followers by the thousand, apps promising instant likes, "growth services" asking for your password. They do grow one thing reliably — the list of accounts that end up banned, stolen, or followed by ten thousand ghosts who never watch a single video. Safe growth is not slower growth; it is growth that survives. This guide lays out the road that keeps your account secure, your audience real, and your progress yours to keep.',
        ],
      },
      {
        heading: '1. Secure the account before you grow it',
        paragraphs: [
          'Growth makes an account a target, so do the boring security work first, while you are small: a strong unique password, two-step verification turned on, and a recovery email and phone number that you actually control. Growing creators in Pakistan lose accounts most often not to brilliant hackers but to simple tricks — a message claiming their account will be deleted unless they "verify" through a link, a fake brand deal that asks them to log in on a lookalike page. If a message creates fear or greed and ends with a login page, it is a trap. Always reach your account through the app itself, never through a link someone sent you.',
        ],
      },
      {
        heading: '2. Never buy followers or likes',
        paragraphs: [
          'The sales pitch is everywhere: a thousand followers for the price of a burger. Here is what actually arrives: accounts that are fake, stolen, or operated in bulk, which never watch, comment, or buy anything. Platforms measure how your audience responds to your posts; when a thousand new "followers" ignore everything you publish, the system concludes your content is uninteresting and shows it to fewer real people. Periodically the platforms purge fake accounts in bulk, and the purchased number evaporates publicly. Brands and collaborators can spot a bought audience in seconds by comparing followers to comments. You are not buying growth; you are buying the appearance of growth, at the cost of the real thing.',
        ],
      },
      {
        heading: '3. Never give your password to a "growth" tool',
        paragraphs: [
          'Any app or website that asks for your social media password in exchange for followers, likes, or "who viewed your profile" reports is asking for the keys to your account. Some use your account to follow and spam others without your knowledge, which gets you flagged or banned by the platform\u2019s automated systems. Others simply take the account. Platforms do not share profile-visitor data with anyone, so every such promise is false by design. The same goes for auto-like and auto-comment bots: the platforms detect robotic patterns, and the penalties — reduced reach, restrictions, permanent bans — land on your account, not on the tool that caused them.',
        ],
      },
      {
        heading: '4. Grow the way the system is built to reward',
        paragraphs: [
          'Every feed, whatever the platform, promotes content that holds attention and starts conversation. So the safe strategy is also the effective one: pick a clear subject you can sustain — comedy in your own language, cooking on a budget, cricket analysis, exam help, village life, tech in simple words — and post consistently enough for the system to learn who enjoys you. Use the discovery formats (short video above all), open with the interesting moment rather than a greeting, and write titles and captions in the words your audience actually searches for. Growth built on being genuinely worth following compounds; growth built on tricks has an expiry date printed on it.',
        ],
      },
      {
        heading: '5. Engage like a person, not a strategy',
        paragraphs: [
          'Reply to your comments — all of them, while you are small enough to manage it. Comment thoughtfully on other creators in your niche; their audiences are exactly the people most likely to enjoy you, and genuine comments get visited. Collaborate with creators of similar size: a joint video introduces each of you to a warm audience, which is worth more than any advertisement. What to avoid: copy-pasting the same comment under fifty posts, follow-for-follow chains, and engagement groups that exchange hollow likes. Platforms detect the artificial pattern, audiences feel the emptiness, and the accounts involved quietly stop growing.',
        ],
      },
      {
        heading: '6. Respect copyright before it respects you',
        paragraphs: [
          'New creators often build on other people\u2019s work: full songs, drama scenes, match highlights, film clips. Platforms scan for this automatically, and the consequences range from muted audio and blocked videos to copyright strikes that can end an account. Use the music library the app itself provides, your own recordings, and footage you have permission for. Commentary and review have some room in most policies, but "I added subtitles" does not make a full episode yours. One strike is a warning you never want; three can be the end of an account you spent a year building.',
        ],
      },
      {
        heading: '7. Protect yourself as the account grows',
        paragraphs: [
          'Visibility has a personal cost if you let it. Keep your home address, your family\u2019s routines and your children\u2019s school out of your content. Use a separate public contact — a work email or second SIM — rather than your personal number. Post location after leaving, not while present. And decide in advance how you will handle abuse: mute, restrict and block are tools, not admissions of defeat. Pakistani creators, especially women, grow fastest in the long run when the audience gets the work, not unrestricted access to the person.',
        ],
      },
      {
        heading: 'The long game',
        paragraphs: [
          'Ask any creator with an audience that has lasted five years and you will hear an unglamorous story: steady posting, real replies, no purchased numbers, no borrowed passwords, a few copyright lessons learned early. Their growth looked slow in month two and unstoppable in year two, because real audiences compound — every genuine follower is a person who can share you with people who trust them. Grow like that, and the account remains what it should be: an asset you own, safe from the ban, the purge and the thief.',
        ],
      },
    ],
  },
  {
    slug: 'make-better-reels-with-your-phone',
    title: 'Better reels with just your phone: a beginner\u2019s filming guide',
    description:
      'Expensive cameras are not what separate dull reels from magnetic ones. Light, sound, steadiness and the first two seconds are. A practical filming guide for beginners shooting on the phone they already own.',
    date: '2026-10-21',
    readingMinutes: 6,
    sections: [
      {
        heading: null,
        paragraphs: [
          'Watch a reel that feels professional and one that feels amateur, shot on the same phone, and the difference is almost never the phone. It is light falling the right way, a voice you can hear clearly, a frame that does not shake, and an opening that respects the viewer\u2019s thumb. All four are free. This guide teaches filming — the part that happens before editing — because no editor can rescue footage that was dark, muffled and trembling to begin with.',
        ],
      },
      {
        heading: '1. Set up the phone once, properly',
        paragraphs: [
          'Before filming anything: wipe the lens. It sounds insulting and it is the single highest-value step in this guide — a phone lens lives against fingers, pockets and dust, and a soft greasy smear is the invisible cause of most "my camera is bad" footage. Then open your camera settings: record at 1080p (full HD) rather than 4K, which eats storage and slows uploads, and turn on the grid overlay to help your framing. If your camera offers a frame rate choice, 30 frames per second is the natural look for talking and everyday content. Clean lens, sane settings — now every reel you shoot starts life sharper.',
        ],
      },
      {
        heading: '2. Light: face the window, never fight it',
        paragraphs: [
          'Light is the difference between looking like a creator and looking like a hostage video. The free studio every beginner already owns is a window: stand or sit facing it, so daylight falls evenly on your face, and film during the day whenever the content allows. The classic mistake is the reverse — window behind you — which turns your face into a dark silhouette while the camera happily exposes for the bright background. Outdoors, the softest light comes in the early morning and the hour before sunset; the harsh midday sun of a Pakistani summer creates hard shadows and squinting, so choose shade with bright surroundings instead. At night, any steady lamp placed in front of you and slightly above eye level beats your room\u2019s ceiling light — and a thin white cloth over a harsh bulb softens it for free.',
        ],
      },
      {
        heading: '3. Sound: the audience forgives video, never audio',
        paragraphs: [
          'Viewers will watch slightly grainy footage with clear sound and abandon crystal-clear footage they cannot hear. Film in the quietest room you have — soft things help: curtains, bedding and carpets absorb the echo that makes voices sound like they were recorded in a bathroom. Turn off the fan if you can bear it, or accept its hum knowingly. Stay close to the phone: half an arm\u2019s length sounds intimate and clear, across the room sounds distant. The wired earphones that came with your phone hide a surprisingly decent microphone — clipping the mic near your collar transforms a talking video. Whatever your setup, record ten seconds, play it back with earphones, and listen before filming the real thing. That habit alone puts you ahead of most beginners.',
        ],
      },
      {
        heading: '4. Steadiness without a tripod',
        paragraphs: [
          'Shaky footage screams beginner. Until you buy a small tripod — genuinely cheap, and the first accessory worth buying — your home is full of substitutes: a stack of books, a shelf, a water bottle, a chair against a wall. Prop the phone, set a three-second timer or use your earphone button as a shutter release, and step into frame calmly. If you must hold the phone, hold it with both hands, elbows tucked into your body, and move by turning your whole body slowly rather than waving your arms. For walking shots, shorter steps and a slightly bent knee smooth the bounce more than any software stabiliser.',
        ],
      },
      {
        heading: '5. Framing: give the eye a clean place to rest',
        paragraphs: [
          'Use the grid you switched on: place your eyes roughly on the top third line, leave a little space above your head, and keep the camera at eye level — a low angle looking up at you is nobody\u2019s friend. Look at your background before you film, not after you post: a tidy, simple background keeps attention on you, while a chaotic one steals it. Remove the hanging laundry and the flickering screen behind you, or simply turn the camera toward the plainest wall in the room. For product or food reels, get closer than feels natural — filling the frame with the subject is what makes phone food footage look delicious.',
        ],
      },
      {
        heading: '6. Film for the first two seconds',
        paragraphs: [
          'A reel is decided almost immediately, so plan your opening frame and line before you press record. Start with the result, the question, or the surprise — the finished dish, the bold claim, the "nobody tells beginners this" — and explain afterwards. Film a little extra at the start and end of every take (editors call it handles) so cuts never feel amputated. And shoot each section as its own clip rather than one long take: if you stumble in section three, you refilm ten seconds, not three minutes. This one habit makes filming faster and editing dramatically easier.',
        ],
      },
      {
        heading: '7. A simple practice routine',
        paragraphs: [
          'Skill in filming is reps, not talent. For two weeks, film one short reel daily using exactly the habits above: lens wiped, window light, quiet room, propped phone, planned opening. Watch each one back with a notebook and write down the single most annoying flaw — darkness, echo, shake, a slow start — and fix only that flaw tomorrow. Fourteen days of single fixes will transform your footage more than any new phone would, and the day you finally do upgrade your gear, the skills will already be waiting for it.',
        ],
      },
    ],
  },
  {
    slug: 'video-editing-basics-beginners',
    title: 'Video editing basics: turning raw phone clips into reels people finish',
    description:
      'You filmed the clips — now what? Trimming dead air, adding captions, balancing music under your voice, simple colour fixes, the right export settings, and a repeatable workflow that turns editing from an evening\u2019s struggle into twenty calm minutes.',
    date: '2026-10-21',
    readingMinutes: 6,
    sections: [
      {
        heading: null,
        paragraphs: [
          'Beginners imagine editing is where the magic happens — effects, transitions, animations. Professionals know the truth: editing is mostly removing. Removing the pause before you started speaking, the sentence that went nowhere, the four seconds of you reaching for the phone. A viewer who finishes your reel is a viewer the platform shows your next reel to, and people finish videos that respect their time. This guide covers the handful of editing skills that account for nearly all of that respect, using the free editors already on your phone.',
        ],
      },
      {
        heading: '1. Choose one editor and learn it properly',
        paragraphs: [
          'CapCut, VN and YouCut are the common free choices on Android; any of them is more than capable, and all of them beat switching apps every week. Pick one, and spend a single evening learning its five core moves: split a clip, trim its ends, reorder clips, add text, and adjust volume. Every skill in this article is a combination of those five. Editing speed comes from familiarity, not features — the creator who knows one simple editor deeply will finish a reel in twenty minutes while the app-hopper is still watching a tutorial.',
        ],
      },
      {
        heading: '2. The first edit is always the trim',
        paragraphs: [
          'Lay your clips in order and go through once with one job: cut everything that is not the content. The breath before your first word — cut. The "um, so basically" — cut. The long silence while you demonstrate something the viewer already understood — cut or speed up. These tight cuts, called jump cuts when they happen mid-sentence, feel energetic rather than rude on short video; they are the native language of the format. A useful target: if a stranger would not feel the loss, the seconds should not survive. Most beginner footage improves by a third just from this pass, before a single effect is added.',
        ],
      },
      {
        heading: '3. Captions: because most people watch on mute',
        paragraphs: [
          'A large share of short video is watched silently — in offices, in rickshaws, beside sleeping children. Captions are therefore not an accessibility extra; they are how most of your audience receives your words. Most editors can generate auto-captions; use them, then spend two minutes correcting them, because Urdu, Punjabi, Sindhi and accented English confuse the software in ways that can embarrass you — names and key terms especially. Style them for tired eyes: large, bold, high-contrast text, placed in the lower-middle of the frame where platform buttons and captions from the app itself will not cover them.',
        ],
      },
      {
        heading: '4. Sound in the edit: voice first, music second',
        paragraphs: [
          'Your voice (or the video\u2019s natural sound) is the content; music is the seasoning. The beginner mistake is music at full volume competing with speech, forcing viewers to strain. Bring background music down until it feels almost too quiet — in most editors that means somewhere around a tenth to a fifth of full volume under speech — and let it rise only in parts with no talking. If your editor offers it, a feature called ducking or volume automation does this balancing for you. Also normalise your own clips: if one section was filmed closer to the phone than another, adjust their volumes to match, so the viewer is not reaching for the volume button mid-reel.',
        ],
      },
      {
        heading: '5. Colour and light: small fixes, honestly applied',
        paragraphs: [
          'Editing can rescue mildly dull footage with three gentle adjustments: brightness up a touch if the shot is dark, contrast up slightly to restore depth, and saturation up a little for food and outdoor scenes. The keyword is slightly — heavy filters that turn skin orange and skies electric are the visual equivalent of shouting. Many editors include an "auto enhance" or "adjust" preset; apply it, then dial its strength down to about half. Consistency matters more than perfection: footage that looks similar across all your reels becomes part of your recognisable style.',
        ],
      },
      {
        heading: '6. Pacing: cut on movement and meaning',
        paragraphs: [
          'Pacing is the rhythm of your cuts, and it decides whether a reel feels brisk or exhausting. Change the visual every few seconds — a different clip, a zoom, a text overlay, a cut to the thing you are describing — because the eye wanders when nothing changes. Cut at natural moments: at the end of a sentence, on a gesture, on the beat of the music. Avoid stacking fancy transitions; a clean cut is invisible, while a spinning whirlpool transition announces "beginner" louder than any flaw it hides. One transition used consistently beats ten used randomly.',
        ],
      },
      {
        heading: '7. The cover frame and the title',
        paragraphs: [
          'When your reel appears on your profile grid or in search, its first impression is a still frame and a few words. Choose the cover deliberately inside your editor: the clearest, most expressive frame — a face mid-reaction, the finished dish, the product front and centre — never a blurry mid-blink accident. Add a short title on the cover if your style uses it, in the same large readable text as your captions, and keep it to a handful of words that make a promise the video keeps: "3 mistakes", "under Rs 500", "in 60 seconds". The cover is packaging; the video must still be the product.',
        ],
      },
      {
        heading: '8. Export once, at the right settings',
        paragraphs: [
          'Exporting badly can ruin good editing — every re-export and re-upload shaves quality. Export at 1080 by 1920 (full HD vertical) at the editor\u2019s recommended bitrate, and upload that file directly to the platform rather than sending it to yourself through a messaging app first, which compresses it further. Keep the exported master on your phone or drive; if you ever need the reel again, you will be glad it exists at full quality. And a small discipline that saves careers: before posting, watch the exported file once, fully, with sound — exports occasionally drop audio or captions, and the only good time to discover that is before your audience does.',
        ],
      },
      {
        heading: 'A workflow you can repeat',
        paragraphs: [
          'Put together, a calm editing session looks like this: import and order the clips (five minutes), trim ruthlessly (five minutes), captions on and corrected (five minutes), music under the voice and the three colour touches (three minutes), cover chosen, export, one full watch (two minutes). Twenty minutes, start to finish, once the routine is muscle memory. Editing stops being the hard part of creating — which frees your energy for the part that actually grows accounts: filming something worth editing, again tomorrow.',
        ],
      },
    ],
  },
  {
    slug: 'grow-first-1000-followers',
    title: 'How to grow your first 1,000 followers on Frianzo',
    description:
      'A practical, honest plan for new creators: profile setup, daily posting, reels, timing, comments and hashtags that actually move a new Frianzo account to its first 1,000 followers.',
    date: '2026-10-21',
    readingMinutes: 5,
    sections: [
      {
        heading: null,
        paragraphs: [
          'Starting a new social account can feel like talking to an empty room. On Frianzo, though, a new creator has a real advantage: the community is young, the For You feed is designed to surface fresh voices, and Pakistani audiences are actively looking for local creators to follow. Here is a practical plan to reach your first 1,000 followers.',
        ],
      },
      {
        heading: '1. Finish your profile before you post anything',
        paragraphs: [
          'People decide whether to follow you in about three seconds. A blank avatar and an empty bio tell them to keep scrolling. Upload a clear photo of yourself (or your brand), write one line about what you post — "Funny Sindhi skits every evening" beats "Welcome to my profile" — and pick a username that is easy to spell and remember.',
        ],
      },
      {
        heading: '2. Post every day for the first two weeks',
        paragraphs: [
          "Frianzo's feed rewards consistency, especially for new accounts. Aim for one post or reel a day for your first fourteen days. This is not about perfection; it is about giving the algorithm enough material to learn who likes your content. Creators who post daily in their first two weeks grow several times faster than those who post once and wait.",
        ],
      },
      {
        heading: '3. Lead with reels',
        paragraphs: [
          'Short video is the fastest discovery format on any platform, and Frianzo is no exception. The For You feed is built to show reels from accounts you do not follow yet — which means a single good reel can put you in front of thousands of strangers overnight. If you are camera-shy, start with text-over-video or voiceover formats; many successful creators never show their face.',
        ],
      },
      {
        heading: '4. Hook viewers in the first two seconds',
        paragraphs: [
          'Most people decide whether to keep watching almost instantly. Open with the payoff, not the setup: the punchline first, the question first, the most surprising frame first. "Three things nobody tells you about..." will always beat a slow "Assalam-o-Alaikum guys, welcome back to...".',
        ],
      },
      {
        heading: '5. Post when Pakistan is awake',
        paragraphs: [
          'Timing matters more than most creators think. The busiest windows on Frianzo are roughly 12–2 PM (lunch break), 5–7 PM (evening scroll), and 9–11 PM (night scroll), Pakistan time. If you can only post once a day, the 9 PM slot is the safest bet — that is when the most people are online and sharing.',
        ],
      },
      {
        heading: '6. Reply to every comment early on',
        paragraphs: [
          'When your account is small, every comment is gold. Reply to all of them — it doubles your comment count, it tells the feed your post sparks conversation, and it turns casual viewers into loyal followers. People follow creators who notice them.',
        ],
      },
      {
        heading: '7. Use hashtags that match your niche',
        paragraphs: [
          'Hashtags on Frianzo work like signposts. Tag your posts with 3–5 relevant ones: mix one broad tag (#pakistan, #fyp) with niche tags that describe your actual content (#sindhicomedy, #cricketpk, #desifood). Skip the 30-hashtag spam — it looks desperate and the feed ignores most of them anyway.',
        ],
      },
      {
        heading: '8. Follow and engage with creators in your niche',
        paragraphs: [
          "Growth is a two-way street. Follow 20–30 creators who make content similar to yours, and leave genuine comments on their posts — not \"nice\" but real reactions. Their audiences will notice you, and Frianzo's follow-back culture means many will follow you back and check out your profile.",
        ],
      },
      {
        heading: '9. Share your Frianzo profile outside Frianzo',
        paragraphs: [
          'Your WhatsApp status, your TikTok bio, your Facebook — these are free billboards. Frianzo gives every user a shareable profile link; put it in your WhatsApp status once a week and mention it in your other social bios. Your first few hundred followers will almost always come from people who already know you.',
        ],
      },
      {
        heading: '10. Study your own numbers weekly',
        paragraphs: [
          'Open your profile once a week and ask three questions: which post got the most views, which got the most comments, and which brought the most new followers? Then make more of whatever won. Most creators guess; the ones who grow look at the numbers and adjust.',
        ],
      },
      {
        heading: 'The honest truth',
        paragraphs: [
          'There is no shortcut — accounts that buy followers stall out, because fake followers never watch, like, or comment, and the feed quickly learns the account is hollow. A thousand real followers who actually watch your content are worth more than ten thousand silent ones. Post daily, engage genuinely, and let the For You feed do the rest.',
          'Ready to start? Download Frianzo free on Google Play and post your first reel today.',
        ],
      },
    ],
  },
  {
    slug: 'frianzo-vs-tiktok',
    title: "Frianzo vs TikTok: what makes Pakistan's own social app different",
    description:
      'Both apps do short video and social feeds — but they are built for different audiences. An honest comparison of reach, language, data usage, monetization and community for Pakistani creators.',
    date: '2026-10-20',
    readingMinutes: 5,
    sections: [
      {
        heading: null,
        paragraphs: [
          'If you make videos in Pakistan, you have probably asked this question: should I post on TikTok, or on Pakistan\'s own social app, Frianzo? The honest answer is that the two platforms reward different things. This comparison explains the real differences — no hype — so you can decide where your effort pays off.',
        ],
      },
      {
        heading: 'Audience: the whole world vs your own people',
        paragraphs: [
          'TikTok is global. Your reel competes with creators from Los Angeles to Jakarta, and the algorithm happily shows your Sindhi or Punjabi video to people who will never understand it. Frianzo is built for Pakistan first: the audience speaks your languages, gets your jokes, and lives your daily life — load-shedding humour, bazaar prices, cricket fever and all. For a local creator, a smaller but perfectly matched audience often converts better than a huge random one: comments are real conversations, not drive-by views.',
        ],
      },
      {
        heading: 'Getting discovered as a small account',
        paragraphs: [
          'On TikTok, new creators enter an ocean. Discovery is possible but the competition is brutal, and content in regional languages competes against a firehose of English and global trends. Frianzo\'s For You feed deliberately reserves space for fresh posts — new uploads from the last few hours get an exploration slot, and reels from accounts you do not follow are mixed into every feed. A creator with 50 followers can realistically be seen by thousands in their first week, because the platform is young and hungry for local content.',
        ],
      },
      {
        heading: 'Language and culture',
        paragraphs: [
          'Frianzo supports the way Pakistan actually talks: Urdu, Roman Urdu, Sindhi, Punjabi and English, side by side. Captions, comments and even the built-in AI assistant (ISAI) reply in the language you use. There is no pressure to perform in English for the algorithm — a village comedy skit in pure Sindhi is first-class content here.',
        ],
      },
      {
        heading: 'Data usage: built for Pakistani realities',
        paragraphs: [
          'Mobile data in Pakistan is expensive, and many users do not buy packages at all. Frianzo takes this seriously: videos are compressed on upload, reels use smart preloading, and a Data Saver mode in Settings turns off autoplay and preloading entirely, showing tap-to-play thumbnails instead. TikTok\'s data saver exists too, but Frianzo was designed from day one for low-end phones and expensive data — it is the home-field advantage.',
        ],
      },
      {
        heading: 'Money: followers vs an actual path to earnings',
        paragraphs: [
          'TikTok monetization in Pakistan is famously limited — no official creator fund payouts for most local creators. Frianzo is building its economics locally from the start: a referrals program that counts invites toward a monetization unlock, a monetization dashboard in Settings, leaderboards for top referrers, and a blue tick for established creators who earn the verified badge plus a feed boost. It is early days, but the direction is clear: the platform is designed for Pakistani users, with local realities in mind.',
        ],
      },
      {
        heading: 'Community and safety',
        paragraphs: [
          'A smaller, local platform can actually enforce its rules. Frianzo runs automatic moderation on posts and comments, has clear community guidelines (in plain language, linked from the footer), a strike system for abusive chat behaviour, and a real support address — support@frianzo.online — answered by the team that built the app. On global platforms, a Pakistani user\'s report disappears into a queue on another continent.',
        ],
      },
      {
        heading: 'So which one should you choose?',
        paragraphs: [
          'If your dream is a global audience and you create in English, TikTok\'s scale is unmatched. But if you create for Pakistan — in its languages, about its life — Frianzo gives you a matched audience, faster early discovery, lower data costs for your viewers, and a monetization path that actually includes you. Many creators post on both; increasingly, they tell us their real community — the people who comment, follow and stay — grows on Frianzo. Try it with your next reel and compare the comments, not just the views.',
        ],
      },
    ],
  },
  {
    slug: 'how-for-you-feed-works',
    title: 'How the Frianzo For You feed actually works',
    description:
      'No mystery, no paid boosts for ranking: here is how Frianzo decides what appears in your feed — freshness, engagement, watch time, your interests, and why you rarely see the same post twice.',
    date: '2026-10-19',
    readingMinutes: 5,
    sections: [
      {
        heading: null,
        paragraphs: [
          'Every social app has a feed algorithm, and most keep it a secret. We would rather explain ours. When you open Frianzo, the For You feed is assembled in real time from recent posts and reels across the platform, ranked by a scoring system built around one idea: show people fresh content they are likely to enjoy and interact with — not whatever is oldest, loudest, or paid for.',
        ],
      },
      {
        heading: 'Freshness comes first',
        paragraphs: [
          'Engagement on a post decays with time — in our ranking, a post\'s score roughly halves every 24 hours. A brilliant post from last week will usually lose to a good post from an hour ago. This is deliberate: Frianzo should feel alive, and new creators should not have to fight against month-old viral content for space. The feed also reserves exploration slots for very fresh posts (under three hours old), so new uploads get a fair first audience.',
        ],
      },
      {
        heading: 'Engagement is the main signal',
        paragraphs: [
          'Likes, comments, shares and — for reels — watch time are what lift a post. Comments count heavily because a post that starts conversations is usually more valuable than one that collects silent likes. When a post suddenly starts gathering engagement quickly, the system notices: posts that gain strong engagement within a short window are treated as "going viral", and their followers get a notification so they do not miss it.',
        ],
      },
      {
        heading: 'Your interests shape your mix',
        paragraphs: [
          'In Settings → My Interests you can pick from twelve reel categories — comedy, cricket, food, tech and more. Reels in your chosen categories receive a boost in your personal feed. The feed also adapts to your behaviour: it tracks the balance of posts versus reels you actually watch, like and comment on, and adjusts how often reels appear between posts. Watch mostly reels, and your feed becomes reel-heavy; engage mostly with posts, and you will see more posts.',
        ],
      },
      {
        heading: 'Why you rarely see the same thing twice',
        paragraphs: [
          'Once the feed has shown you a post, its score is heavily reduced on refresh — you asked for new content, so the system goes and finds it. You will also never see two posts from the same author back to back; the feed enforces variety. And when fresh uploads run low, older well-loved posts (algorithmic favourites) fill the gaps rather than the feed simply repeating itself.',
        ],
      },
      {
        heading: 'What does NOT affect ranking',
        paragraphs: [
          'Money does not buy feed position on Frianzo — there are no paid ranking boosts for posts. (Verified accounts do receive a fixed, disclosed boost: the blue tick is partly a trust signal, so verified posts and reels get a modest lift, and verified profiles rank higher in search. That is the only identity-based factor.) Your own newest post appears at the top of your own feed the first time you open it, so you can see it live — after a refresh it competes normally like everyone else\'s.',
        ],
      },
      {
        heading: 'For creators: what this means practically',
        paragraphs: [
          'Post consistently, because freshness decays daily. Make content that invites comments — questions, opinions, relatable moments. Choose the right interest category when you upload a reel, because it routes your video to the people who picked that interest. And do not panic if a post starts slowly: engagement velocity matters, so a post that wakes up a few hours later can still take off. The feed is not a lottery; it is a scoreboard — and now you know exactly what it scores.',
        ],
      },
    ],
  },
  {
    slug: 'first-reel-starter-guide',
    title: 'Your first reel on Frianzo: a 5-minute starter guide',
    description:
      'Everything a beginner needs to record, edit and publish a first reel on Frianzo — the in-app camera, durations, covers, captions, categories and the mistakes to avoid.',
    date: '2026-10-18',
    readingMinutes: 4,
    sections: [
      {
        heading: null,
        paragraphs: [
          'Your first reel does not need a studio, a ring light, or experience. It needs a phone, an idea, and about five minutes. This guide walks you through making and publishing your first reel on Frianzo, step by step, using the tools built into the app.',
        ],
      },
      {
        heading: 'Step 1: Decide one simple idea',
        paragraphs: [
          'The best first reels are single-idea videos: one joke, one tip, one moment, one before-and-after. Scroll your own camera roll — a funny family moment, a street food close-up, a cricket shot from the gully — anything real beats anything staged. If nothing fits, film a 15-second introduction: who you are, what you will post, and why people should follow. Simple is a feature, not a flaw.',
        ],
      },
      {
        heading: 'Step 2: Record with the in-app camera',
        paragraphs: [
          'Tap the + button and choose the camera. Frianzo\'s reel camera gives you a live preview, front/back flip, a flash toggle, and three durations — 15 seconds, 60 seconds, or 3 minutes. Recording auto-stops at your chosen length, so you never ramble past the point. Prefer your own gallery? You can pick an existing video instead. On the Frianzo app, larger videos are compressed automatically on your phone before upload, which saves your data and your viewers\'.',
        ],
      },
      {
        heading: 'Step 3: Pick a cover that earns the tap',
        paragraphs: [
          'In the reels feed, your cover frame is your poster. Choose the most expressive frame — a face mid-reaction, the finished dish, the moment of the catch — not a blurry mid-motion shot. A good cover can double your views before a single second plays.',
        ],
      },
      {
        heading: 'Step 4: Write a caption that adds something',
        paragraphs: [
          'A caption should add context the video does not: the story behind it, a question for viewers, or the punchline in writing. End with a question ("Team green or team blue?") and you will get comments — and comments are what push a reel further. Add 3–5 hashtags that match your content, no more.',
        ],
      },
      {
        heading: 'Step 5: Choose the right interest category',
        paragraphs: [
          'When you upload, Frianzo asks for a category — comedy, cricket, food, technology and more. Always pick the honest one: reels are boosted to people who chose that interest in their settings, so the right category routes your video to viewers already looking for it. The wrong category sends it to people who will swipe away, which hurts the reel.',
        ],
      },
      {
        heading: 'Step 6: Publish — then reply to everyone',
        paragraphs: [
          'Post it, and for the first hour, treat comments like guests at your door: reply to each one. Early engagement tells the feed your reel starts conversations, and people who get a reply are far more likely to follow you. Then share the reel link to your WhatsApp status — your first viewers will probably be people who already know you.',
        ],
      },
      {
        heading: 'Three beginner mistakes to avoid',
        paragraphs: [
          'First, re-uploading videos with TikTok or other watermarks — they look borrowed and perform poorly everywhere. Second, filming in the dark with a shaky hand: daylight near a window beats any filter. Third, deleting a slow first reel — reels often wake up hours later when the right audience comes online. Publish, learn, and post the next one tomorrow. Your tenth reel will embarrass your first, and that is exactly the point.',
        ],
      },
    ],
  },
  {
    slug: 'frianzo-referrals-explained',
    title: 'Frianzo referrals explained: how invites count toward monetization',
    description:
      'How the Frianzo referral program works: your personal link, what counts as a referral, and the 25-referral gate that unlocks monetization. Referrals themselves do not earn cash.',
    date: '2026-10-17',
    readingMinutes: 4,
    sections: [
      {
        heading: null,
        paragraphs: [
          'Frianzo grows through its users, and referrals are how that growth is counted. The referral program is simple: invite people with your personal link, and when they join through it, they are counted as your referrals. Referrals themselves do not earn cash. Here is exactly how it works, including the part most people ask about: what reaching 25 referrals actually unlocks.',
        ],
      },
      {
        heading: 'Your personal referral link',
        paragraphs: [
          'Every Frianzo account has its own referral link, based on the Google Play listing with your username attached. You can find and share it from the app — the "Share Frianzo" option in the menu sends a ready-made WhatsApp message with your link and your live follower count. When someone installs the app through your link, the Play Store passes your username to the app, and the new account is counted as your referral automatically.',
        ],
      },
      {
        heading: 'The 25-referral gate',
        paragraphs: [
          'At 25 referrals, monetization unlocks in the app. Below 25, your invites are still counted toward that gate — nothing is lost — but no referral on its own earns cash, and there is no per-referral payment at or after 25. Your referral count is shown on your monetization page inside the app (Settings → Monetization). The threshold exists for a practical reason: it keeps the program for real inviters instead of fake sign-up farms, which protects the community from abuse.',
        ],
      },
      {
        heading: 'Where to watch your progress',
        paragraphs: [
          'Your monetization page shows your referral progress. There is also a leaderboard ranking the top referrers on the platform — if you are competitive, it is a surprisingly motivating place to climb. The same page hosts the top followers, top likers and top commenters boards.',
        ],
      },
      {
        heading: 'What counts — and what does not',
        paragraphs: [
          'A referral counts when a genuinely new user joins through your link and the app records it. Creating extra accounts yourself, or asking the same person to reinstall repeatedly, does not build a real count — the system is designed to count real, distinct people. Follow and follow-back activity is normal community behaviour and is not treated as spam; only fake or abusive patterns are a problem.',
        ],
      },
      {
        heading: 'Honest tips that actually grow your count',
        paragraphs: [
          'Share your link where your people already are: WhatsApp status (weekly, not hourly), family and university groups, and your other social bios. Pair the link with a reason — "I post my cricket clips here now, follow me" converts far better than a bare link. Show your own profile first: a profile with real posts and a face converts visitors into sign-ups, while an empty profile wastes your clicks. And be patient: most users get their first 25 through two or three group shares, not one giant blast.',
        ],
      },
      {
        heading: 'Why we built it this way',
        paragraphs: [
          'Big platforms spend their marketing money on ads. We would rather grow through the users who bring their friends. Every referral you earn counts toward the 25-referral gate — that is the whole point of the program, and it is not a cash payment for inviting someone. Invite honestly, watch your count grow on the monetization page, and help build Pakistan\'s own social platform while you do it.',
        ],
      },
    ],
  },
  {
    slug: 'data-saver-mode',
    title: 'Data Saver mode: using Frianzo without a data package',
    description:
      'Mobile data is expensive in Pakistan and many people rely on limited bundles. Here is how Frianzo\'s Data Saver mode works, what changes when it is on, and more tips to cut your data use.',
    date: '2026-10-16',
    readingMinutes: 4,
    sections: [
      {
        heading: null,
        paragraphs: [
          'In Pakistan, a data package is a real expense — and plenty of people simply do not buy one, relying on small bundles, shared hotspots, or Wi-Fi when they can get it. A social app that burns data carelessly is an app those users delete. That is why Frianzo has a dedicated Data Saver mode, and why this guide explains exactly what it does.',
        ],
      },
      {
        heading: 'What Data Saver changes',
        paragraphs: [
          'Turn Data Saver on (in the Settings menu) and Frianzo changes how it treats video. Reels stop autoplaying and stop preloading in the background. Instead, you see a poster thumbnail for each reel, and the video downloads only when you tap to play it. Scrolling past twenty reels you never watch costs you almost nothing, because none of them downloaded. Photos are also handled gently, and the app avoids fetching media you have not asked to see.',
        ],
      },
      {
        heading: 'What we already do on our side',
        paragraphs: [
          'Even with Data Saver off, Frianzo works to keep your data bill low. Every uploaded reel is compressed on our servers (capped at 720p with efficient encoding), and large videos recorded in the Android app are compressed on the phone before upload — so creators spend less uploading, and viewers spend less watching. Media is served with long-lived caching, which means content you have already seen does not download again and again.',
        ],
      },
      {
        heading: 'How to turn it on',
        paragraphs: [
          'Open the Settings menu and switch on Data Saver. That is it — no restart, no separate "lite" app to install. The change applies immediately, and you can switch it off any time you are on Wi-Fi and want the full autoplay experience back.',
        ],
      },
      {
        heading: 'More ways to save data on Frianzo',
        paragraphs: [
          'Prefer reading over watching on bundle days: posts and photos cost a fraction of video. Download nothing twice — revisit reels from your history rather than re-searching. If you create content, record inside the app so compression happens before upload instead of sending a huge original file. And if your phone supports it, set a system data warning a little below your bundle size, so a heavy day never surprises you.',
        ],
      },
      {
        heading: 'An honest note about "free" social media',
        paragraphs: [
          'You may hear claims that an app can be made completely free to use without any data at all. Technically, that requires commercial "zero-rating" deals between the app and each mobile network (Jazz, Telenor, Zong, Ufone) — it is a business agreement, not a setting, and no app can switch it on by code alone. We will not pretend otherwise. What we can do — and have done — is make Frianzo as light as an honest app can be: compressed media, no wasteful preloading, and a Data Saver that puts you in control.',
        ],
      },
    ],
  },
  {
    slug: 'blue-tick-verification',
    title: 'Blue tick on Frianzo: what verification means and how it works',
    description:
      'What the blue tick on a Frianzo profile actually signals, the perks verified accounts receive, and who is eligible for the free route.',
    date: '2026-10-15',
    readingMinutes: 4,
    sections: [
      {
        heading: null,
        paragraphs: [
          'The blue tick next to a name is the most recognised symbol on social media: this account is who it claims to be. On Frianzo the tick works the same way — but we want to be transparent about what it does, what it does not do, and how to get one.',
        ],
      },
      {
        heading: 'What the tick signals',
        paragraphs: [
          'A verified badge tells everyone that Frianzo has confirmed the account belongs to a real, notable person or brand — not a copycat. In a feed full of fan pages and parody accounts, that matters: followers can trust the posts, and creators can prove the official account is theirs. The badge appears on the profile and alongside the name across the app, including in comments and search.',
        ],
      },
      {
        heading: 'The perks verified accounts receive',
        paragraphs: [
          'Verification on Frianzo is more than a label. Verified accounts receive a boost in the feed — their posts and reels are ranked higher, so their content reaches more people. They also get priority in search results, appearing above similar unverified names. For a growing creator or a business, that combination — trust plus reach — is exactly what the tick is for.',
        ],
      },
      {
        heading: 'How to earn it: eligibility',
        paragraphs: [
          'Notable accounts can qualify for a free blue tick by meeting the eligibility criteria shown on the verification page in Settings: a complete, genuine profile and a track record of real activity and following. If you qualify, you submit a request from that page and the team reviews it. This route suits established creators, public figures and brands who are already active on the platform.',
        ],
      },
      {
        heading: 'Is there a paid route?',
        paragraphs: [
          'No — not right now. The blue tick is not sold. Verification is earned by established accounts that meet the eligibility criteria above, and a request is reviewed by our team. If a paid option ever opens in the future, it will be announced on the verification page in Settings, with the price and terms shown there first — never through private chats or public posts asking for payment.',
        ],
      },
      {
        heading: 'What the tick does NOT do',
        paragraphs: [
          'Honesty matters here. The blue tick does not exempt anyone from the community guidelines — verified accounts are moderated like everyone else, and a tick can be removed for abuse or impersonation. It also does not guarantee virality; it improves your starting position in feed and search, but your content still has to earn its audience.',
        ],
      },
      {
        heading: 'How to start',
        paragraphs: [
          'Open Settings → Verification in the app. You will see your current status, the perks, and whether you qualify for the free route. If you have questions, message the official @frienzo account in the app — the team replies there.',
        ],
      },
    ],
  },
  {
    slug: 'content-ideas-pakistani-creators',
    title: '10 content ideas for Pakistani creators this month',
    description:
      'Stuck on what to post? Ten proven content ideas tailored to Pakistani audiences — comedy, food, cricket, study, street stories and more — with a practical twist for each.',
    date: '2026-10-14',
    readingMinutes: 5,
    sections: [
      {
        heading: null,
        paragraphs: [
          'Every creator hits the same wall: "What do I post today?" The creators who grow are not the ones with endless inspiration — they are the ones with a list. Here are ten ideas tuned for Pakistani audiences on Frianzo, each with the angle that makes it work. Steal them freely; the execution is what makes them yours.',
        ],
      },
      {
        heading: '1. The relatable household skit',
        paragraphs: [
          'Ammi vs modern kids, the electricity bill reveal, the rishta meeting — Pakistani household comedy never dies because everyone lives it. Keep it under 30 seconds, one joke, filmed at home. Post in the evening slot when families are scrolling together.',
        ],
      },
      {
        heading: '2. Street food, close up',
        paragraphs: [
          'Film the sizzle, not the shop. A 15-second close-up of chargha steam, gol gappay being filled, or chai being pulled costs nothing to make and stops thumbs reliably. Add the area name in the caption — locals share what is theirs.',
        ],
      },
      {
        heading: '3. Cricket, but personal',
        paragraphs: [
          'Match reactions are crowded; personal cricket is not. Your gully team\'s last over, your father\'s commentary during a Pakistan match, a "rate my cover drive" clip — real people beat studio analysis for engagement.',
        ],
      },
      {
        heading: '4. One useful thing in 30 seconds',
        paragraphs: [
          'Teach one tiny thing: a phone setting nobody knows, a matric exam trick, three English phrases for a job interview, how to check a bike\'s mileage. Usefulness gets saved and shared — the two strongest signals a post can earn.',
        ],
      },
      {
        heading: '5. Then vs now in your city',
        paragraphs: [
          'An old photo of your street, bazaar or school against the same place today. Nostalgia is Pakistan\'s favourite emotion online, and these posts pull comments from everyone who ever lived there.',
        ],
      },
      {
        heading: '6. A day in my life — honestly',
        paragraphs: [
          'Student, shopkeeper, rider, nurse, farmer — real routines fascinate people whose lives differ. Film five short clips through your day and stitch them with one line each. No glamour needed; honesty is the hook.',
        ],
      },
      {
        heading: '7. Duet the comment section',
        paragraphs: [
          'Take the funniest or most common question from your last post\'s comments and answer it on camera. Your audience literally wrote your script, and the commenter you feature will share the reel everywhere.',
        ],
      },
      {
        heading: '8. Regional language pride',
        paragraphs: [
          'Say the same phrase in Sindhi, Punjabi, Pashto, Balochi, Saraiki and Urdu. Language content unites rather than divides here — everyone watches to hear their own and learns the others. Captions make it accessible to all.',
        ],
      },
      {
        heading: '9. The honest review',
        paragraphs: [
          'Review something local without a sponsor: a dhaba, a bus route, a Rs 500 gadget, a government office experience. Pakistani audiences can smell paid praise instantly; one honest review builds more trust than fifty sponsored ones.',
        ],
      },
      {
        heading: '10. Ask your city a question',
        paragraphs: [
          '"Best biryani in Sukkur — fight in the comments." City-versus-city and this-versus-that questions are comment machines, and comments are what the feed rewards most. Keep it friendly, pin the funniest answer, and make the sequel next week.',
        ],
      },
      {
        heading: 'How to use this list',
        paragraphs: [
          'Do not post all ten in a rush. Pick three that fit your life, post one every other day, and watch which earns comments rather than just views. Then make that format a weekly series — series are how casual viewers become followers. Consistency with a format beats variety without one, every single month.',
        ],
      },
    ],
  },
  {
    slug: 'staying-safe-community-guidelines',
    title: 'Staying safe on Frianzo: our community guidelines in plain words',
    description:
      'What is allowed on Frianzo, what gets removed, how automated moderation and the strike system work, and how to report problems — the community guidelines without the legal language.',
    date: '2026-10-13',
    readingMinutes: 5,
    sections: [
      {
        heading: null,
        paragraphs: [
          'Every community has rules; the problem is usually how they are written. This article explains Frianzo\'s community guidelines the way we would explain them to a friend. The full official text lives on our Community Guidelines page — this is the plain-words version of the same rules.',
        ],
      },
      {
        heading: 'The simple principle',
        paragraphs: [
          'Post like the person reading it is real — because they are. Disagreement is welcome, debate is welcome, strong opinions are welcome. What is not welcome is content that harms people: abuse, threats, hate, sexual exploitation, dangerous behaviour, and spam or fraud. If you would not say it in a crowded bazaar to someone\'s face, do not post it here.',
        ],
      },
      {
        heading: 'What gets removed',
        paragraphs: [
          'Hate speech and harassment targeting people, sexual content involving or directed at anyone inappropriately, threats and encouragement of violence, and genuinely dangerous content are removed when found. Spam is handled firmly too — and note what spam means on Frianzo: flooding people with external links. Our automatic systems review new posts and comments, and links are the clearest spam signal we act on. Ordinary swearing in frustration is treated like ordinary life; targeted abuse is not. One more thing, because people ask: calling someone an "idiot" in an argument is not, by itself, a violation — we moderate harm, not vocabulary tests.',
        ],
      },
      {
        heading: 'How moderation actually works',
        paragraphs: [
          'Your post goes live immediately — we never hold content in a queue waiting for approval. In the background, automated checks review new posts and comments; if something clearly breaks the rules, it is removed and the author is told why, with the reason stated. Human review backs the system up, and if your profile collects violations, a warning banner appears on your profile so you always know where you stand.',
        ],
      },
      {
        heading: 'Chat has its own protections',
        paragraphs: [
          'Private messages are held to the same standard as public posts, with a strike system for abuse. A first serious offence brings a temporary messaging restriction (48 hours); a second brings a longer one (7 days); severe abuse brings 30 days; and the worst categories — threats and anything involving child safety — mean permanent suspension. Flooding chats with links also triggers automatic short restrictions. If someone is restricted, their conversations with the offender are cleaned up and the offender is notified with the reason.',
        ],
      },
      {
        heading: 'Reporting and appeals',
        paragraphs: [
          'See something that breaks the rules? Report it, or message the official @frienzo account or support@frianzo.online. Wrong call by us? Say so — accounts suspended in error have been reinstated on review, and an admin can clear a warning that should not be there. We would rather fix a mistake than defend one.',
        ],
      },
      {
        heading: 'The short version',
        paragraphs: [
          'Be real, be decent, do not spam links, do not abuse people, and keep the worst stuff off the platform entirely. Follow that, and you will never hear from moderation at all — which is exactly how we want it.',
        ],
      },
    ],
  },
  {
    slug: 'frianzo-messenger-guide',
    title: 'Frianzo Messenger: chats, voice notes and privacy controls',
    description:
      'A complete tour of messaging on Frianzo: starting chats, voice notes, reactions, group conversations, who can message you, and how to keep your inbox calm and private.',
    date: '2026-10-12',
    readingMinutes: 4,
    sections: [
      {
        heading: null,
        paragraphs: [
          'For many users, the chat is the app. Frianzo\'s messenger is built for the way Pakistan actually communicates — quick text, lots of voice notes, family groups, and a healthy suspicion of strangers. Here is everything it does and the controls that keep it yours.',
        ],
      },
      {
        heading: 'Starting a conversation',
        paragraphs: [
          'Tap the messages icon, search for the person, and write. Chats open instantly and stay in sync between the web and the Android app, so a conversation started on your laptop continues on your phone. Unread counts are shown clearly, and conversations are sorted by the most recent activity so the people who matter stay on top.',
        ],
      },
      {
        heading: 'Voice notes: the Pakistani way',
        paragraphs: [
          'Typing long messages in Urdu script or Roman Urdu is slow; talking is not. Hold the mic, speak, release — your voice note sends instantly. Voice notes are perfect for the things text flattens: tone, humour, and the exact way your mother says your name when you are in trouble. They are also kind to your data compared to video calls for everyday check-ins.',
        ],
      },
      {
        heading: 'Reactions, replies and the small things',
        paragraphs: [
          'React to a message with an emoji instead of typing "ok" for the fifth time. Reply to a specific message so long threads stay understandable. Edit a message when autocorrect betrays you. These small things are most of daily messaging, and they all work the way you expect from a modern messenger.',
        ],
      },
      {
        heading: 'Groups and community chats',
        paragraphs: [
          'Create groups for family, class, office or your cricket team. Group chats keep everyone in one thread instead of twelve separate ones, and Frianzo\'s outreach and community accounts are part of the same ecosystem — you will find official updates and friendly community members reachable in the same inbox.',
        ],
      },
      {
        heading: 'Privacy: you decide who reaches you',
        paragraphs: [
          'Your inbox is not public property. You can block any account — blocked users cannot message you, full stop. Abusive chat behaviour is policed by the strike system described in our community guidelines, which restricts offenders\' messaging automatically. And your private conversations are yours: they are not posts, they are not shown to followers, and they are never used as content.',
        ],
      },
      {
        heading: 'A calmer inbox, by design',
        paragraphs: [
          'Two habits make any messenger peaceful: mute threads that are busy but not urgent, and leave groups that no longer serve you. Frianzo will not punish you for either. Your attention is the product of your life, not ours — the messenger is a tool for the people you choose, and everything in this guide exists to keep it that way.',
        ],
      },
    ],
  },
  {
    slug: 'write-captions-people-read',
    title: 'How to write captions people actually read',
    description:
      'A practical guide to writing social media captions: start with the point, say one thing at a time, write the way you talk, and finish with a reason to reply.',
    date: '2026-11-01',
    readingMinutes: 6,
    sections: [
      {
        heading: null,
        paragraphs: [
          'Most captions fail in the first line. People scroll fast, and they decide in a second or two whether the rest is worth their time. A caption does not need to be clever, long, or full of emojis to work. It needs to be clear: what is this post about, why should anyone care, and what should they do next? If a stranger cannot answer those three questions after reading your first two sentences, rewrite the opening before you worry about anything else.',
        ],
      },
      {
        heading: 'Start with the point, not the greeting',
        paragraphs: [
          'Openings like a long greeting, a weather report, or a vague teaser waste the only moment you are guaranteed. Put the interesting part first. Instead of building up to the news, state it plainly: what happened, what you made, what you learned, or what changed. You can add context after that. Readers who are interested will keep going, and readers who are not were never going to read a slow build-up anyway.',
          'This does not mean every caption must be dramatic. A plain, honest first line often beats a dramatic one. If you cooked something, say what it is and why it mattered to you. If you travelled somewhere, say where and what surprised you. Specific detail is what stops a scroll; general excitement is easy to ignore because every post claims to be exciting.',
        ],
      },
      {
        heading: 'One caption, one idea',
        paragraphs: [
          'A caption that tries to announce three things, tell a life story, and sell something at the same time usually communicates none of them well. Pick the single idea that matters for this post and let the rest go. If you have more to say, that is what the next post is for. Readers remember one clear message far better than a paragraph that wanders through several topics.',
          'A useful test is to read your caption back and ask what a friend would repeat about it afterwards. If the answer is vague, the caption is trying to do too much. Cut it down until the answer is one sentence. Short does not mean shallow: a short caption can still carry a real thought, a real feeling, or a useful detail. It simply refuses to bury that thought under extra words.',
        ],
      },
      {
        heading: 'Write the way you actually talk',
        paragraphs: [
          'The best captions sound like a person, not like an advertisement or a textbook. Write in the language and style you use with friends, whether that is Urdu, Roman Urdu, English, or a mix of both. Short sentences help. So do line breaks: a wall of text looks like work, while a few short paragraphs look like a message worth reading.',
          'Avoid words you would never say out loud. If a sentence sounds stiff when you read it back, rewrite it in simpler words. You do not need impressive vocabulary to sound serious, and you do not need slang in every line to sound friendly. The goal is a voice a reader recognises as yours, so that over time your posts feel like they come from a real person rather than a page posting for the sake of posting.',
        ],
      },
      {
        heading: 'Give people a reason to reply',
        paragraphs: [
          'A caption that only describes a photo gives readers nothing to do. A question, an honest opinion, or a small choice gives them a reason to stop and respond. Ask something you genuinely want to know, not a question you already answered in the post. If you post a photo of a meal, asking which version people prefer at home is a real question. Asking people to comment a word for no reason is not.',
          'Replies matter because they turn a post into a conversation. When someone answers, answer them back. A creator who replies to early comments builds a habit in their audience: people learn that commenting leads somewhere, so they comment again. A creator who never replies teaches the opposite lesson, no matter how good the caption was.',
        ],
      },
      {
        heading: 'A quick editing checklist',
        paragraphs: [
          'Before you post, read the caption once out loud. Fix anything you stumble over. Check that the first line makes sense on its own, that there is only one main idea, and that spelling mistakes have not changed the meaning of a word. Remove hashtags that have nothing to do with the post: a few relevant ones help people find it, while a long block of unrelated ones makes the whole post look careless.',
          'Finally, check the caption against the photo or video. If the caption promises something the post does not show, readers feel tricked and will not trust the next one. Honest captions build slowly, post by post, into an audience that actually reads. That audience is worth far more than a single post that got attention by overpromising.',
        ],
      },
    ],
  },
  {
    slug: 'free-phone-storage-without-losing-photos',
    title: 'Phone storage full? Free space without losing your photos',
    description:
      'A careful, step-by-step way to free space on an Android phone: find what is actually using storage, clean up safely, and keep your photos and chats intact.',
    date: '2026-11-01',
    readingMinutes: 6,
    sections: [
      {
        heading: null,
        paragraphs: [
          'A phone that says storage is full usually does not need to be replaced. It needs a clean-up done in the right order. The mistake most people make is deleting photos in a panic, or clearing data from an app and then discovering they have been logged out of everything. A slower, careful clean-up frees more space and loses nothing important. Start by finding out what is actually taking the space, then work through the biggest items one at a time.',
        ],
      },
      {
        heading: 'First, see what is using the space',
        paragraphs: [
          'Open your phone settings and look for storage. It will show how much space photos, videos, apps, and system files are using. This step matters because the fix depends on the cause. A phone full of videos needs a different clean-up from a phone full of apps, and a phone full of chat media needs a different one again. Do not guess, and do not delete at random: check the breakdown first, then start with the largest category you can safely reduce.',
          'While you are there, note which apps are largest. A social app, a game, or a maps app can grow large over time because of saved files and cache. That does not automatically mean you should delete the app. Often the app itself is small and its stored files are large, which leads to the next, safer step.',
        ],
      },
      {
        heading: 'Photos and videos: back up before you delete',
        paragraphs: [
          'Photos and videos are usually the biggest category, and they are also the hardest to get back once deleted. Before deleting anything, make a copy somewhere else: a cloud backup, a computer, or a memory card, depending on what you use. Wait until the copy is actually complete before you remove the originals from the phone. A backup that is still uploading is not a backup yet.',
          'Once the copy is confirmed, you can remove duplicates, blurry shots, and videos you recorded by accident. Keep the photos that matter to you, even if they are not perfect. A useful habit is to review new photos once a week and delete the obvious failures straight away. That small habit prevents the storage warning from coming back every month.',
        ],
      },
      {
        heading: 'Chat media: the hidden storage eater',
        paragraphs: [
          'Messaging apps often hold far more media than people expect. Every forwarded video, meme, and family group photo can be saved to your phone even if you only glanced at it once. Open your messaging app settings and look for storage or data usage: many apps let you see which chats use the most space and delete only the media from a chat while keeping the messages themselves.',
          'Be careful with group chats. Deleting media from a group does not delete the conversation, but it does remove those files from your phone, so only do it after you have saved anything you want to keep. If a chat contains important documents, photos of family, or receipts, save those first. The rest — repeated forwards and old jokes — is usually safe to remove.',
        ],
      },
      {
        heading: 'Cache is safe to clear; app data usually is not',
        paragraphs: [
          'Every app has two different kinds of stored data, and confusing them causes most clean-up accidents. Cache is temporary data an app can rebuild, like thumbnails and recently loaded images. Clearing cache is generally safe and frees space without logging you out. App data, on the other hand, can include your login, settings, and saved content inside the app. Clearing that can log you out or delete things the app was storing only on your phone.',
          'So the rule is simple: clear cache when you want space, and only clear app data when you understand exactly what that app will lose. If you are unsure, leave app data alone and look for space somewhere else. A few minutes of patience here saves hours of recovering accounts later.',
        ],
      },
      {
        heading: 'Downloads, old files, and apps you no longer use',
        paragraphs: [
          'Check your downloads folder. It often contains files you downloaded once for a single purpose — forms, images, documents, installation files — and never opened again. Delete what you no longer need, but pause on anything that looks like an identity document, a ticket, or a receipt until you are sure you have it elsewhere.',
          'Then look at your apps. Uninstall the ones you have not opened in months, starting with games and large apps. You can always install an app again later; you cannot easily recover a photo you deleted in a hurry. If an app is large because of files inside it, check whether the app itself offers a way to clear downloads or offline content before you uninstall it completely.',
        ],
      },
      {
        heading: 'Keep it from filling up again',
        paragraphs: [
          'After the clean-up, set up two habits. First, turn on automatic backup for photos if you use one, so deleting from the phone stops feeling risky. Second, review chat media and downloads once in a while instead of waiting for the storage warning. A phone with some free space also runs better: apps update more smoothly, photos save without errors, and you are not forced to delete something important in the middle of recording a video that matters.',
        ],
      },
    ],
  },
  {
    slug: 'protect-accounts-passwords-two-factor-phishing',
    title: 'Protect your accounts: passwords, two-factor checks, and phishing messages',
    description:
      'Plain-language account security: unique passwords, two-factor verification, how to recognise phishing messages, and what to do if you clicked or shared something by mistake.',
    date: '2026-11-01',
    readingMinutes: 7,
    sections: [
      {
        heading: null,
        paragraphs: [
          'Most account theft does not start with a clever hacker breaking into a system. It starts with a normal person being tricked: a familiar-looking message, a fake login page, or a password reused across many sites. Good account security is therefore less about technology and more about habits. A few steady habits — different passwords, a second check when signing in, and a pause before clicking — protect far more than any single app or setting.',
        ],
      },
      {
        heading: 'One account, one password',
        paragraphs: [
          'Reusing the same password everywhere is the single most common weakness. If one website leaks its passwords, every other account using the same password becomes easy to open. That is why security advice keeps repeating the same rule: use a different password for each important account, especially email, banking, and social accounts. Your email matters most of all, because a person who controls your email can often reset the passwords of your other accounts.',
          'A password does not need to be impossible to remember to be strong. A longer phrase made of unrelated words is generally better than a short password with a few symbols tacked on. If remembering many different passwords feels hard, use a password manager — an app designed to store them securely behind one strong master password — or write them in a private notebook kept at home, never as a photo in your phone or a note shared with anyone. Never send a password to anyone who asks for it in a message, even if they claim to work for the service.',
        ],
      },
      {
        heading: 'Turn on the second check',
        paragraphs: [
          'Two-factor verification means that signing in needs something extra besides your password, such as a code from an authenticator app or a prompt on your own phone. Even if someone learns your password, they still cannot get in without that second step. Turn it on for email and for any account that holds money, photos, or private messages.',
          'Keep your recovery options up to date as well: a recovery email and phone number you actually control. If you change your number, update it everywhere important before you lose access to the old one. Losing both your password and your recovery method at the same time is how accounts become very hard to recover, even for their real owners.',
        ],
      },
      {
        heading: 'How to recognise a phishing message',
        paragraphs: [
          'Phishing messages pretend to be from a bank, a delivery company, a social app, or a government office. They usually create urgency: your account will be closed, your parcel is stuck, you have won something, or you must verify now. The message then asks you to click a link, download a file, or share a code. Real services do not ask for your password or one-time code in a message, and they do not threaten to close your account in the next hour unless you click immediately.',
          'Before clicking, look carefully. Check the sender address, not just the displayed name. Hover over or long-press a link to see where it really goes, without opening it. Watch for misspelled company names, strange domains, and links that do not match the service they claim to be. If a message claims a problem with an account, open the official app or website yourself and check there, instead of following the link in the message. That one habit defeats most phishing attempts.',
        ],
      },
      {
        heading: 'Codes are secrets, even from helpful strangers',
        paragraphs: [
          'A one-time code sent to your phone or email is the key to your account for a few minutes. Never share it with anyone, including someone who says they are helping you, fixing your account, or verifying your identity. No legitimate support agent needs your code to help you. The same rule applies to the codes shown by an authenticator app and to password-reset links: if someone else gets them, they can act as you.',
          'Be especially careful with calls and messages that claim to be from your bank or a platform and ask you to read out a code. If you are unsure, hang up and call the official number yourself. A real company will not be offended by that caution, and a scammer will try hard to stop you from doing it.',
        ],
      },
      {
        heading: 'If you clicked or shared something by mistake',
        paragraphs: [
          'Mistakes happen, and acting quickly matters more than feeling embarrassed. If you entered your password on a suspicious page, change that password immediately from the official app or website, and change it anywhere else you used the same password. If you shared a code, change the password and check your account for new devices, changed settings, or messages you did not send, and sign out of sessions you do not recognise.',
          'If money is involved, contact your bank or payment provider straight away and tell them exactly what happened. If an account was taken over, use the official recovery process for that service and report the message that tricked you. Reporting helps protect other people too, because the same message is usually sent to many people at once. After the urgent steps, turn on two-factor verification if it was not already on, and treat the incident as a reminder to slow down before the next urgent-looking message.',
        ],
      },
      {
        heading: 'A calm habit that covers almost everything',
        paragraphs: [
          'Account security becomes much easier if you adopt one rule: pause before acting on any message that asks for a password, a code, a payment, or an urgent click. Open the service yourself, check the facts there, and only then act. Scammers rely on speed and panic; legitimate services can wait a few minutes while you verify. Combined with unique passwords and a second sign-in check, that pause protects almost every everyday account far better than worrying about rare, sophisticated attacks.',
        ],
      },
    ],
  },
  {
    slug: 'how-frianzo-moderation-works',
    title: 'How moderation works on Frianzo: keeping a social platform safe',
    description:
      'A social platform is only as good as its safety work. Here is exactly how Frianzo handles reports, reviews content, applies warnings and strikes, removes posts, suspends accounts, and lets people appeal — explained plainly.',
    date: '2026-11-22',
    readingMinutes: 6,
    sections: [
      {
        heading: null,
        paragraphs: [
          'Every social platform faces the same problem: millions of people can post anything, instantly, and a small minority will post things that harm others — spam, scams, harassment, stolen content, or material that should never be public at all. The difference between a platform people trust and one they abandon is not whether bad content ever appears; it is how quickly and fairly the platform responds. This article explains, in plain terms, how moderation works on Frianzo: what the rules are, how problems are reported, what happens after a report, and how people who disagree with a decision can ask for another look.',
        ],
      },
      {
        heading: 'The rules come first: community guidelines',
        paragraphs: [
          'Moderation starts with written rules, not personal opinions. Frianzo publishes community guidelines that cover the main categories: no harassment or hate directed at people, no spam or scams, no stolen or copyrighted material presented as your own, no graphic or adult content, no content that endangers children, and no impersonation of other people or organisations. The guidelines are public — anyone can read them before posting — because a rule people cannot see is a rule they cannot follow. When the team reviews a post, the question is always the same: which written rule does this break, if any? Content that breaks no rule stays up, even if some viewers dislike it.',
        ],
      },
      {
        heading: 'Reports: every user is part of the safety system',
        paragraphs: [
          'No review team, however large, sees everything on a growing platform. That is why reporting exists on every post, reel and comment: any user can flag content and choose a reason. Reports go into a review queue that the team works through, and reporting is anonymous — the person reported is never told who flagged them, which keeps people willing to report honestly. Reports matter beyond the single post, too: patterns of reports are how repeat offenders are found, including accounts that spread scams or coordinate spam across many small posts that each look harmless alone.',
        ],
      },
      {
        heading: 'What happens after a report',
        paragraphs: [
          'Reviewed content has three possible outcomes. If it breaks no rule, it stays and the matter ends. If it breaks a rule, it is removed, and the account that posted it is notified with the reason — people deserve to know which rule applied, because a removal without an explanation teaches nothing. For serious or repeated violations, the response escalates: formal warnings, restrictions on specific features such as messaging, and suspension of the account. Frianzo operates a strike system in which violations are recorded against the account; a warning clears after a sustained clean period, which gives people a genuine path back to good standing instead of a permanent stain for one early mistake.',
          'The escalation is deliberate. A first-time, minor violation usually earns a removal and a warning, not a ban — most people adjust once they understand the line. Accounts that keep violating after warnings, or that exist purely to scam or spam, are suspended. In practice this is not theoretical: accounts with repeated removals for scams, spam and abuse have been suspended under exactly this process, and accounts suspended in error have been reactivated after review.',
        ],
      },
      {
        heading: 'Blocking and personal controls',
        paragraphs: [
          'Moderation by the platform is only half of safety; the other half is control in each person\u2019s own hands. Any user can block any other user, which cuts off contact and visibility between the two accounts. Privacy settings let people lock individual profile details — such as a phone number or email address — so those details are never shown to other viewers at all. These controls work instantly and do not depend on a review queue, which makes them the right first step whenever someone simply does not want to interact with a particular account.',
        ],
      },
      {
        heading: 'Appeals: decisions can be questioned',
        paragraphs: [
          'Any human process makes mistakes, so a moderation system without an appeal route is not finished. A user who believes a removal or suspension was wrong can contact Frianzo support with their username and the details of the decision. Appeals are reviewed against the same written guidelines, and decisions that do not hold up are reversed — removed content restored or accounts reactivated — with the record corrected. The appeal route is also a quality check on the moderators themselves: a decision that cannot be defended in an appeal should not have been taken in the first place.',
        ],
      },
      {
        heading: 'Why this matters more as Frianzo grows',
        paragraphs: [
          'Frianzo was built in Pakistan for audiences across Pakistan, India and Bangladesh, and its users post in many languages and styles. That diversity is the platform\u2019s strength, and it is exactly why the safety system has to be rules-based and consistent rather than dependent on any one reviewer\u2019s taste. As the community grows, the work grows with it: more reports, faster review, clearer rules. If you use Frianzo, the most helpful things you can do are simple — report what genuinely breaks the rules, use your block and privacy controls freely, and read the guidelines once so you know where the lines are. A platform stays welcoming because its community and its moderators pull in the same direction.',
        ],
      },
    ],
  },
  {
    slug: 'spot-misinformation-before-you-share',
    title: 'How to spot misinformation before you share it',
    description:
      'Forwarded messages and viral posts are wrong more often than most people realise. These simple checks — source, date, evidence, emotion — take under a minute and stop false stories travelling through your family and friends.',
    date: '2026-11-22',
    readingMinutes: 6,
    sections: [
      {
        heading: null,
        paragraphs: [
          'Every day, millions of messages are forwarded in good faith by people who would never deliberately spread a lie: a miracle cure, a shocking video, a warning about a danger that does not exist, a screenshot of news that was never published. Misinformation travels because sharing takes one tap and checking feels like work. It does not have to be. Almost every false story fails one of four quick checks that together take less than a minute — and the minute matters, because a forwarded message carries your credibility with it. When you share something false, your family and friends do not blame the original author; they remember that you sent it.',
        ],
      },
      {
        heading: 'Check 1: Who actually published this?',
        paragraphs: [
          'Look for the original source, not the person who forwarded it. Real news comes from an organisation with a name, a website and a reputation it can lose. Misinformation usually arrives as a screenshot, a cropped video or a block of text with no link — formats chosen precisely because they cannot be traced or checked. A screenshot of a headline is not a headline; anyone can fabricate one in a minute. If a post claims a major event happened, open a search engine or a known news outlet and look for the same story. If a dramatic event is real, more than one independent outlet will be covering it. If only one anonymous message is reporting it, treat it as unproven.',
        ],
      },
      {
        heading: 'Check 2: When is this from?',
        paragraphs: [
          'A large share of viral misinformation is not fake — it is old. A real video of a flood from three years ago is reposted as today\u2019s flood in another city; a genuine announcement from last year circulates as new policy. Old content in a new context misleads exactly as much as invented content. Before sharing, look for a date: on the post, in the video, or by searching a distinctive phrase from the text. Weather, clothing, number plates and shop signs in videos are all clues. If you cannot establish when something happened, that alone is a reason not to forward it as current news.',
        ],
      },
      {
        heading: 'Check 3: What is the actual evidence?',
        paragraphs: [
          'Strong claims need more than a confident tone. Ask what the post actually shows: a claim that a product cures a disease needs a study or a health authority, not a testimonial; a claim that a public figure said something needs the full recording or an official transcript, not a quote in a graphic. Cropped quotes and short clips are the oldest trick in the book — the sentence before or after often reverses the meaning. Also watch for numbers without sources: "90% of people" and "doctors confirm" are decorations, not evidence. If the evidence would not convince you in an argument, it should not convince you in a feed.',
        ],
      },
      {
        heading: 'Check 4: How does it make you feel?',
        paragraphs: [
          'This check surprises people, but it may be the most reliable one. Content engineered to spread is engineered to provoke: outrage, fear, disgust, or triumphant pride about your own group. If a post makes you feel a sudden, strong emotion and an urge to share immediately, that reaction was probably designed. Genuine information informs; manipulation activates. When you notice that spike of feeling, pause. The pause is not weakness — it is the exact moment checking works best, because ten minutes later the same post will look very different, and the urge to forward it will have faded on its own.',
        ],
      },
      {
        heading: 'What to do when you are not sure',
        paragraphs: [
          'Uncertainty has a simple rule: do not forward. You are never obliged to share breaking news; nothing bad happens if your family hears a true story an hour later from a verified source, while real harm can follow from a false one — panics, boycotts of innocent businesses, and medical decisions based on invented cures all start as forwards. If a message warns of immediate danger to specific people you know, verify it with one phone call to someone actually there. And if you shared something earlier that turned out to be false, correct it in the same place you shared it. People respect the correction far more than they judge the mistake — everyone has forwarded something false, and the honest few who say so become the people whose shares everyone trusts.',
        ],
      },
    ],
  },
  {
    slug: 'parents-guide-teen-safety-social-media',
    title: 'A parent\u2019s guide to keeping teenagers safe on social media',
    description:
      'Teenagers will use social media — the realistic goal is not banning it but making it safer. Practical steps for parents: privacy settings, conversations that work, warning signs, and what to do when something goes wrong.',
    date: '2026-11-22',
    readingMinutes: 6,
    sections: [
      {
        heading: null,
        paragraphs: [
          'Most parents did not grow up with social media, and most teenagers cannot imagine life without it. That gap produces two common reactions — fear that bans the apps entirely, or resignation that ignores them completely — and neither protects a teenager for long. Bans move usage to friends\u2019 phones and borrowed accounts, beyond any supervision at all, while ignoring the subject leaves teenagers to handle strangers, pressure and mistakes alone. The approach that works is the middle one: understand the handful of real risks, set up the accounts properly together, and keep a conversation open so that when something does go wrong, your teenager tells you early instead of hiding it.',
        ],
      },
      {
        heading: 'The real risks, in plain terms',
        paragraphs: [
          'The serious risks are specific, not mysterious. Strangers contacting teenagers directly, sometimes pretending to be teenagers themselves. Personal information leaking — a school name in a photo background, a phone number on a public profile — that makes a child findable offline. Pressure to share images that can never be fully taken back once sent. Bullying that follows a child home because the phone never switches off. And scams and challenges that dress risky behaviour as entertainment. Notice that every one of these risks is reduced by the same few habits: private settings, care with personal details, and an adult the teenager actually talks to.',
        ],
      },
      {
        heading: 'Set up the account together',
        paragraphs: [
          'When a teenager joins a platform, spend fifteen minutes on setup together — framed as help, not inspection. Lock down personal details: phone number and email should never be publicly visible on a profile, and on Frianzo each profile detail can individually be set to private so it is not shown to other viewers. Review who can message the account and who can see posts, and turn off precise location sharing. Agree on a simple rule for followers and friends: people they actually know. A teenager who has watched you take these settings seriously once will usually keep them — the settings lesson lasts longer than any lecture.',
        ],
      },
      {
        heading: 'Conversations that actually work',
        paragraphs: [
          'Teenagers shut down when every conversation about phones is an accusation, and open up when parents show genuine curiosity. Ask what they enjoy watching and who they follow, the way you would ask about a sport or a show. Share your own examples — a scam message you received, a false story you almost forwarded — because modelling caution teaches more than demanding it. Most importantly, make one promise and keep it: if they come to you with a problem from social media, your first response will be help, not punishment. Teenagers hide incidents — a threatening message, an image shared further than intended — mainly from fear of losing the phone or facing anger. The incidents where parents learn early are the ones that end well.',
        ],
      },
      {
        heading: 'Warning signs worth noticing',
        paragraphs: [
          'No single sign proves a problem, but patterns deserve a gentle conversation: a teenager who becomes secretive specifically about one contact or one app; sudden distress after checking the phone; messages arriving at all hours from someone whose name you never hear in normal conversation; requests for gift cards, top-ups or photos being mentioned; or a new, much older "friend" who gives compliments and gifts. Raise what you have noticed without reading the phone in secret if you can avoid it — secret surveillance, once discovered, destroys the trust that makes teenagers report problems voluntarily, which is the strongest protection they have.',
        ],
      },
      {
        heading: 'If something goes wrong',
        paragraphs: [
          'Act quickly and calmly. If someone is pressuring or threatening your child, do not delete anything — screenshots and the account name are evidence. Block the account on the platform and report it through the app\u2019s reporting tools, which exist on every post, profile and message; on Frianzo, reports go to a review team and accounts that target children are removed. If images have been shared, report them on every platform where they appear — platforms act fastest on material involving minors. If there is any suggestion of an adult arranging to meet a child, or of blackmail, contact the police as well; these are crimes, not app disputes. Then support the teenager: the fault lies with the person who exploited them, and a child who feels blamed will not come to you next time.',
        ],
      },
      {
        heading: 'The goal is judgement, not just rules',
        paragraphs: [
          'Rules and settings are scaffolding. The real protection is a teenager who pauses before sharing personal details, recognises flattery from a stranger as a warning sign rather than a compliment, and tells an adult early when something feels wrong. That judgement is built the slow way — through conversations, through watching how you handle your own accounts, and through small mistakes handled with help instead of fury. You do not need to understand every app. You need your teenager to understand that you are on their side of the screen.',
        ],
      },
    ],
  },
  {
    slug: 'healthy-social-media-habits',
    title: 'Healthy social media habits: use the apps without losing your day',
    description:
      'Social apps are designed to hold attention. These practical habits — notifications, sessions, feed choices and phone-free times — put you back in charge of how much of your day they get.',
    date: '2026-11-22',
    readingMinutes: 5,
    sections: [
      {
        heading: null,
        paragraphs: [
          'Almost everyone has had the same experience: pick up the phone to check one message, surface forty minutes later from a feed they never intended to open, and feel vaguely worse than when they started. This is not a personal failure. Social apps are built by large teams whose job is to extend every session — endless feeds, autoplay, and notifications timed to pull you back. Willpower against that design is a losing strategy, but habits are not: a few small changes to how the apps are set up and when you use them can return hours a week, without giving up the genuine pleasures of staying in touch and being entertained.',
        ],
      },
      {
        heading: 'Turn off notifications that are not from people',
        paragraphs: [
          'The single highest-value change is notification discipline. A message from a friend is a reason to pick up the phone; a notification that a stranger posted, that a video is trending, or that you have not opened the app in a while is the app advertising itself inside your pocket. Go through each app\u2019s notification settings and keep only direct human contact: messages, mentions, and replies to you. Turn off suggestions, reminders and promotional alerts. Most people find their phone goes quiet in a way that feels strange for two days and peaceful ever after — and they open the apps when they choose to, rather than when summoned.',
        ],
      },
      {
        heading: 'Give sessions a beginning and an end',
        paragraphs: [
          'The endless feed has no natural stopping point, so create your own. Decide before opening an app what you are opening it for — reply to a message, post a photo, watch one creator\u2019s new video — and close it when that is done. If you want open-ended browsing, give it a container: a tea break, a bus ride, twenty minutes after dinner. Phones have built-in timers for apps, and setting one is not an admission of weakness; it is the same common sense as setting an alarm clock. What matters is that the session ends by your decision, not by exhaustion or a dead battery.',
        ],
      },
      {
        heading: 'Curate the feed the way you would curate a room',
        paragraphs: [
          'You would not invite people who make you angry or envious into your home every day, yet many people keep them in their feed for years. Unfollow or mute accounts that reliably leave you irritated, inadequate or anxious — including, especially, accounts you follow only to argue with. Follow more of what genuinely serves you: people you know, teachers of skills you are learning, creators who make you laugh without making you feel small. Platforms, Frianzo included, learn from what you watch and engage with, so your attention is literally training your own future feed. Spend it like it matters, because to the algorithm it is the only vote you have.',
        ],
      },
      {
        heading: 'Protect the edges of the day',
        paragraphs: [
          'Two periods deserve special protection: the first and last half-hours. Starting the day inside a feed means starting it with other people\u2019s priorities, emergencies and opinions before your own thoughts have formed. Ending the day there does the opposite damage — bright, stimulating content pushes sleep later and makes it lighter. Charge the phone outside arm\u2019s reach of the bed if you can, and let mornings begin with washing, breakfast and daylight first. People who change only this habit often report the largest effect on mood of anything in this article, which is why it is the one to try first if you try only one.',
        ],
      },
      {
        heading: 'Keep the good parts on purpose',
        paragraphs: [
          'The aim is not to quit social media — for many people in Pakistan, India and Bangladesh it is where family groups live, where small businesses find customers, where creators build an income, and where friends who have moved abroad stay present. The aim is to keep those real benefits while refusing the designed excess. Audit yourself once a month with one question: did these apps this month mostly connect me, teach me and entertain me — or mostly consume me? Adjust one setting or one habit in response, and repeat. Attention is the raw material of a life; the apps will take exactly as much of it as you let them, and not one minute more.',
        ],
      },
    ],
  },
  {
    slug: 'getting-started-with-frianzo',
    title: 'Getting started on Frianzo: set up your account and make your first post',
    description:
      'A calm, step-by-step start on Frianzo: create your account, complete your profile with the details you choose to share, follow people, understand the Home feed and Reels, and make your first post and reel.',
    date: '2026-11-22',
    readingMinutes: 6,
    sections: [
      {
        heading: null,
        paragraphs: [
          'Starting a new social app can feel like walking into a room where everyone already knows each other. It does not need to. Frianzo is built around the familiar basics — a profile, a feed of posts from people you follow, short reels, and chats — and you can be set up and posting within a few minutes. This guide walks through the first steps in order: creating your account, completing your profile properly, finding people to follow, and making your first post and your first reel.',
          'You do not need to do everything at once. A profile photo, a short bio and a handful of follows are enough to make the app feel like yours. Everything else can be filled in as you go.',
        ],
      },
      {
        heading: 'Create your account',
        paragraphs: [
          'You can join Frianzo in two ways: with your Google account, or with an email address. Google sign-in is the fastest route — one tap, no new password to remember. If you prefer email, register with an address you actually check, because account messages and recovery information go there. Either way, pick a username that represents you: it is how people will find and mention you, so something close to your real name or your creator name works best.',
          'Once you are in, your account exists but your profile is still mostly blank. That is normal — the next step is what turns an account into a presence.',
        ],
      },
      {
        heading: 'Complete your profile',
        paragraphs: [
          'Open your profile and choose Edit Profile. Add a clear profile photo — a real photo of your face, or a clean logo if the account represents a business. Write a short bio that says who you are and what you post about; one or two honest lines beat a list of slogans. Frianzo also has a Personal Details section where you can add things like your category (for example Video Creator or Business), your city, your date of birth, a website, and links to your other social accounts.',
          'Every one of these details is under your control. Each field can be set to Public, so visitors see it, or locked, so it stays private — and some details, like your phone number and email, start out locked. Fill in only what you are comfortable sharing, and remember you can change or lock any of it later. Your profile also shows a "Joined" line with the month and year your account was created, so people can see how long you have been part of the community.',
        ],
      },
      {
        heading: 'Find people and follow them',
        paragraphs: [
          'A feed is only as good as the people in it. Start by following people you know — friends, family, creators you already watch elsewhere — and a few accounts posting about things you genuinely care about: your city, your trade, your sport, your studies. Following is free and reversible, so do not overthink it; you can unfollow anyone at any time.',
          'As you follow people and interact with posts, your Home feed fills with their updates, and Frianzo learns what you engage with. Give it a week of honest use — like what you actually like, skip what you do not — and the feed becomes noticeably more relevant.',
        ],
      },
      {
        heading: 'Your Home feed and Reels',
        paragraphs: [
          'The Home feed is where posts from people you follow appear, along with posts Frianzo thinks you will find interesting. You can like, comment on and share what you see, and save things you want to return to. Reels are the short vertical videos — the quickest way to discover new creators, and the format most new accounts grow with.',
          'Watching reels is also a quiet education. Before you ever post one, you will absorb what works: a strong first second, clear sound, one idea per video. That instinct is worth more than any equipment.',
        ],
      },
      {
        heading: 'Make your first post and reel',
        paragraphs: [
          'For your first post, keep it simple and human: introduce yourself, say what you will be posting about, and add a photo if you have one. First posts are not auditions — people follow people, not performances. Write the caption the way you would say it to a friend, and post it. Done is better than perfect, because an empty profile gives nobody a reason to follow you.',
          'Your first reel can be just as modest: a short introduction, a look at your work, your shop, your city, or a skill you have. Film in good light, hold the phone steady, and speak clearly. Then keep going — on every platform, the accounts that grow are the ones that post consistently and reply to the people kind enough to comment. Welcome to Frianzo.',
        ],
      },
    ],
  },
  {
    slug: 'how-boost-works-frianzo',
    title: 'How Boost works on Frianzo: promote a post or reel',
    description:
      'Frianzo Boost explained plainly: who can boost, the goals, budgets and durations you choose, how manual payment and approval work, where boosted posts appear with their Sponsored label, and how you track results in My Boosts.',
    date: '2026-11-22',
    readingMinutes: 6,
    sections: [
      {
        heading: null,
        paragraphs: [
          'Posting good content is the foundation of growing on Frianzo, but sometimes a post deserves a push — a business announcement, a video you are proud of, a page you are trying to launch. Boost is Frianzo\u2019s built-in way to pay for extra reach for a post or reel you have already published. This article explains exactly how it works: what you choose, what it costs, how payment and approval happen, and how you see the results. No surprises is the point — you should know every step before you spend a rupee.',
        ],
      },
      {
        heading: 'Who can boost, and what you choose',
        paragraphs: [
          'Boost is available inside the Frianzo app on your own posts and reels, for users in Pakistan. You start from the post or reel itself by tapping Boost, and the first thing you pick is a goal: gain followers, gain views, or promote a business. The goal matters because it shapes how your boosted post is presented and to whom it is shown first.',
          'Next you set a daily budget between Rs 100 and Rs 1,000, and a duration of 1, 3, 7 or 14 days. Your total cost is simply the daily budget multiplied by the days. If it is your first-ever boost, there is a starter price: one day costs Rs 79. You can run up to 3 boosts at the same time.',
        ],
      },
      {
        heading: 'Estimates before you pay',
        paragraphs: [
          'Before any payment, the Boost page shows estimated results for the budget and duration you picked — the kind of reach and response a boost like yours is expected to produce. Read that word carefully: estimated. These are honest projections based on how boosts perform, not promises. No platform can guarantee exact numbers, because real people decide what to watch and whom to follow. Use the estimates to compare budgets — what a Rs 300 day is expected to do versus a Rs 100 day — and then choose what your goal is actually worth to you.',
        ],
      },
      {
        heading: 'How payment and approval work',
        paragraphs: [
          'Payment on Frianzo is manual, through the mobile wallets most Pakistanis already use: EasyPaisa or JazzCash. The Boost page inside the app shows the current payment details and the exact steps — you send the payment, share the confirmation as instructed, and submit your boost request. Nothing runs yet at this point.',
          'Every boost request is reviewed by a member of the Frianzo team before it starts. This human check exists to confirm the payment and to make sure the boosted content follows the platform rules. Once approved, your boost goes live for the duration you bought and then ends on its own — there is no auto-renewal and no surprise second charge.',
        ],
      },
      {
        heading: 'Where boosted posts appear, and how you track them',
        paragraphs: [
          'An approved boost appears inside the normal Frianzo feeds, mixed with regular posts and reels, and it carries a small "Sponsored" label so viewers can tell it is promoted. That honesty is deliberate: people trust a platform that labels its advertising. Depending on your goal, the post is shown first to the viewers most likely to respond to it, and it continues to rotate through the feeds while the boost is active.',
          'You can follow everything under My Boosts, which lists your boosts and their status, and shows the results each one produced — the views it gathered and the new followers it brought in. When a boost ends, its numbers stay there, so over time you build a real record of what a rupee of promotion actually buys you on Frianzo — far more useful than any estimate.',
        ],
      },
    ],
  },
  {
    slug: 'frianzo-monetization-how-it-works',
    title: 'Frianzo monetization: how earning works, in plain words',
    description:
      'How Frianzo monetization works today, without hype: the 25-referral requirement, what the Monetization page shows, the $25 minimum payout, how the team pays you, and the payout methods available in Pakistan, India and the United States.',
    date: '2026-11-22',
    readingMinutes: 6,
    sections: [
      {
        heading: null,
        paragraphs: [
          'Every creator platform eventually has to answer one question: how does a creator actually get paid? This article explains Frianzo monetization exactly as it works today — the requirement to become eligible, what you see on your Monetization page, when money is paid out, and which payout methods are supported. It also says clearly what monetization is not: it is not a salary, not a lottery, and not a promise. It is a system that shares value with creators who build a real audience, starting with the people they bring to the platform.',
        ],
      },
      {
        heading: 'The 25-referral requirement',
        paragraphs: [
          'A creator becomes eligible for monetization by inviting 25 people who join Frianzo through their personal referral link. That is the whole gate, and it is deliberately simple. Your link is yours alone — when someone signs up through it, that join is credited to you, and your Monetization page counts it.',
          'Why referrals? Because a new platform grows through its creators, and the fairest first reward goes to the people who helped build the audience everyone else benefits from. Twenty-five real people is an achievable target for anyone with a genuine circle — classmates, colleagues, customers, community — and it filters out accounts that exist only on paper.',
        ],
      },
      {
        heading: 'What the Monetization page shows',
        paragraphs: [
          'Your Monetization page lives in Settings, and it is designed to answer your questions at a glance. At the top you see your total earnings and a progress bar showing how close your unpaid balance is to the $25 minimum payout. Below that is your referral link, with a Copy Link button and share buttons so you can send it straight to WhatsApp, Facebook or anywhere else your people are.',
          'The page also lists your referrals — the people who joined through your link — so you can watch the count toward 25 grow. Further down you will find your payout methods, where you set how you want to be paid, and your payout history, the record of payments already sent to you. Everything about your earning lives on this one page; if a number ever confuses you, it is the page to check first.',
        ],
      },
      {
        heading: 'Getting paid at $25',
        paragraphs: [
          'When your unpaid earnings reach $25, you become due for a payout. The Frianzo team sends the money to the payout method saved on your account — there is no maze of forms at that point, because you set the method up in advance on the same Monetization page. The payment then appears in your payout history, so both sides have the same record.',
          'The $25 threshold exists for a practical reason: sending many tiny payments costs more in fees and effort than the payments are worth, for you and for the platform. A clear, reachable threshold keeps the system honest and sustainable.',
        ],
      },
      {
        heading: 'Payout methods by country',
        paragraphs: [
          'Supported payout methods depend on your country. In Pakistan, you can receive payment by EasyPaisa, JazzCash or bank transfer. In India, the options are UPI, Paytm or bank transfer. In the United States, payouts go by bank transfer or PayPal. Set your method carefully and keep it current — a payout can only go where your saved details point.',
        ],
      },
      {
        heading: 'The honest part',
        paragraphs: [
          'Three things deserve to be said plainly. First, earnings depend on real audience activity — real people watching, engaging and joining. Nothing is guaranteed, and anyone who promises you fixed income from any platform is selling you something. Second, fake or bought engagement is against the rules: purchased followers, bot activity and referral farming do not build earnings, they endanger your account. Third, monetization rewards grow with the platform itself — the creators who do best are the ones who treat it as a long game: post consistently, invite honestly, and build an audience that is actually theirs.',
        ],
      },
    ],
  },
  {
    slug: 'frianzo-privacy-controls',
    title: 'Your privacy controls on Frianzo: what you can lock, block and control',
    description:
      'A plain tour of Frianzo\u2019s privacy controls: locking individual profile details, why phone and email start locked, blocking and managing blocked users, reporting content and accounts, and disappearing messages in chats.',
    date: '2026-11-22',
    readingMinutes: 5,
    sections: [
      {
        heading: null,
        paragraphs: [
          'A social profile is a window into your life, and you should decide how wide it opens. Frianzo gives you controls at three levels: what your profile shows, who can reach you, and what happens inside your conversations. This article walks through each control in plain words, so you can set your account up the way you actually want it — whether that is wide open as a public creator, or quiet and mostly private.',
        ],
      },
      {
        heading: 'Lock individual profile details',
        paragraphs: [
          'Your profile has a Personal Details section: your category, gender, the city you live in, your date of birth, a website, links to your social accounts, your phone number and your email. The important part is that these are not all-or-nothing. Every single field can be set individually to Public, so everyone can see it, or locked, so it stays hidden — you might happily show your city and your YouTube link while keeping your date of birth to yourself.',
          'Your phone number and email start out locked by default, and a locked detail is never shown to other people. That default is deliberate: contact details are the fields most often abused, so on Frianzo they are private unless you personally choose otherwise. You can review and change every field\u2019s setting whenever you like from Edit Profile.',
        ],
      },
      {
        heading: 'Block people you do not want contact with',
        paragraphs: [
          'If someone is bothering you, you do not have to argue with them — you can block them. Blocking is complete: a blocked user cannot see your profile or your posts, and cannot contact you. It is the right tool for harassment, spam, or simply for a person you are finished with.',
          'You can review everyone you have blocked in Settings, under your blocked users list, and unblock someone there if circumstances change. Blocking is private — the other person is not sent an announcement that you blocked them.',
        ],
      },
      {
        heading: 'Report content and accounts',
        paragraphs: [
          'Blocking protects you; reporting protects everyone. You can report posts, reels, comments and whole accounts that break the rules — spam, scams, abuse, impersonation, or content that should not be on the platform. Reports go to the Frianzo team, who review them and act on what they find.',
          'Use reports honestly. A report is a request for a human review, not a dislike button, and filing false reports to annoy someone wastes the review time that keeps the platform safe for everyone, including you.',
        ],
      },
      {
        heading: 'Disappearing messages in chats',
        paragraphs: [
          'Some conversations are meant to be permanent and some are not. In Frianzo chats, you can turn on disappearing messages for a conversation, so messages are automatically removed after a set time. The choices are 24 hours, 7 days or 90 days — or you can leave disappearing messages off entirely, so the conversation keeps its full history.',
          'The setting is per conversation, which is the sensible way to offer it: your family chat can keep everything forever, while a quick conversation about a one-time purchase can clean up after itself. Set it per chat, according to what that conversation is for.',
        ],
      },
      {
        heading: 'You stay in control',
        paragraphs: [
          'None of these controls are buried treasure — profile details live in Edit Profile, blocked users in Settings, reporting on every post, reel, comment and profile, and disappearing messages inside each chat. Spend two minutes setting them the way you want, and then forget about them. Good privacy controls are like good locks: mostly invisible, and there the one time you need them.',
        ],
      },
    ],
  },
  {
    slug: 'frianzo-dashboard-for-creators',
    title: 'The Frianzo Dashboard: understand your views, engagement and growth',
    description:
      'The Frianzo Dashboard in plain words: the Analytics cards for Views, Earnings, Engagement and Follows, the daily views chart, your top performing content, and the Other tools section — plus how a creator actually uses these numbers.',
    date: '2026-11-22',
    readingMinutes: 6,
    sections: [
      {
        heading: null,
        paragraphs: [
          'Posting on instinct works for a while, but creators who grow steadily share one habit: they look at their numbers. The Frianzo Dashboard, which you will find in Settings, gathers your account\u2019s performance into one place — how many people watched, how they responded, whether your audience is growing, and which of your posts did the heavy lifting. This article explains each part of the Dashboard in plain words, and finishes with how to actually use it without becoming obsessed with it.',
        ],
      },
      {
        heading: 'The four cards and the ranges',
        paragraphs: [
          'At the top of the Analytics view sit four cards: Views, Earnings, Engagement and Follows. Views counts how much your content was watched; Engagement covers how people responded to it; Follows shows the new followers the period brought you; Earnings shows what your activity earned. Each card carries a change indicator — an upward or downward arrow against the previous period — so you can see direction, not just totals.',
          'Above the cards you choose the range: the last 7 days, 30 days or 90 days. Short ranges show you the effect of recent changes; longer ranges show the real trend underneath the daily noise. Under the cards, a smaller row gives your totals for Likes, Comments, Shares and Content posted, which together explain the Engagement card — a rise driven by shares means something different from a rise driven by likes.',
        ],
      },
      {
        heading: 'The daily views chart',
        paragraphs: [
          'Below the cards is a chart of your views day by day across the selected range. Its real value appears when you tap a day: you see that day\u2019s exact number, and you can connect it to what you actually did — the reel you posted that morning, the day you posted nothing, the weekend your audience is most active.',
          'Creators who use this well stop guessing about timing. Post for a few weeks, then read the chart: the pattern of your own audience\u2019s busy days is sitting there, and it is more reliable than any generic advice about the best time to post.',
        ],
      },
      {
        heading: 'Top performing content',
        paragraphs: [
          'The Content section of the Dashboard shows your top performing posts and reels — the pieces your audience responded to most. This is the most actionable list on the page. Look for the pattern across your top items: a topic, a format, a length, a style of opening. Whatever repeats there is what your audience is telling you they want more of.',
          'The reverse lesson matters too. If a type of post you enjoy making never appears in your top content, that is information, not failure — make it less often, or remake it in the style of the things that do perform. Your Dashboard cannot tell you what to create, but it is very good at telling you what your audience already loves.',
        ],
      },
      {
        heading: 'Other tools in one place',
        paragraphs: [
          'The Dashboard also gathers the rest of your creator tools in an Other tools section, so you are not hunting through menus: Ads Manager, where your boosts live; Monetization, for your earnings and referrals; Referrals themselves; the Leaderboard; Account Status, where you can check your account\u2019s standing; Achievements; and Weekly Goals. Think of the Dashboard as the front desk of your account — the numbers up top, and every office you might need down the hall.',
        ],
      },
      {
        heading: 'How to actually use these numbers',
        paragraphs: [
          'A workable rhythm: check the Dashboard once or twice a week, not once an hour. Compare ranges — this 30 days against the previous 30 — rather than mourning single slow days, which happen to everyone. Post consistently for a few weeks before judging any change, because one viral reel or one quiet week will lie to you in opposite directions.',
          'Above all, let the numbers inform the work, not replace it. The Dashboard tells you what happened; your job is still to make things worth watching. Creators who grow do both — they create with heart and review with clear eyes — and the Dashboard exists to make the reviewing part take five minutes instead of a spreadsheet.',
        ],
      },
    ],
  },
];

export function getArticle(slug: string): BlogArticle | undefined {
  return articles.find((a) => a.slug === slug);
}
