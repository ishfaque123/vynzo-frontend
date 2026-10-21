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
          'TikTok monetization in Pakistan is famously limited — no official creator fund payouts for most local creators. Frianzo is building its economics locally from the start: a referrals program that credits your balance when people join through your link, a monetization dashboard in Settings, leaderboards for top referrers, and a paid blue tick for creators who want the verified badge plus a feed boost. It is early days, but the direction is clear: the money side is designed for Pakistani users, with local payment methods in mind.',
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
    title: 'Frianzo referrals explained: how every invite earns you credit',
    description:
      'How the Frianzo referral program works: your personal link, what counts as a referral, the 25-referral unlock, where your earnings appear, and honest tips to grow your count.',
    date: '2026-10-17',
    readingMinutes: 4,
    sections: [
      {
        heading: null,
        paragraphs: [
          'Frianzo grows through its users — so Frianzo pays its users for growing it. The referral program is simple: invite people with your personal link, and when they join through it, they are counted as your referrals. Here is exactly how it works, including the part most people ask about: when the credit actually lands.',
        ],
      },
      {
        heading: 'Your personal referral link',
        paragraphs: [
          'Every Frianzo account has its own referral link, based on the Google Play listing with your username attached. You can find and share it from the app — the "Share Frianzo" option in the menu sends a ready-made WhatsApp message with your link and your live follower count. When someone installs the app through your link, the Play Store passes your username to the app, and the new account is credited to you automatically.',
        ],
      },
      {
        heading: 'The 25-referral unlock',
        paragraphs: [
          'Referral earnings unlock at 25 referrals. Below 25, your invites are still counted — nothing is lost — but the credit is released once you cross the threshold, and every referral after that earns immediately. The current rate is shown on your monetization page inside the app (Settings → Monetization), along with your referral count and balance. The threshold exists for a practical reason: it keeps the program for real inviters instead of fake sign-up farms, which protects the earnings of everyone honest.',
        ],
      },
      {
        heading: 'Where to watch your progress',
        paragraphs: [
          'Your monetization page shows your earnings balance and your referral progress. There is also a leaderboard ranking the top referrers on the platform — if you are competitive, it is a surprisingly motivating place to climb. The same page hosts the top followers, top likers and top commenters boards.',
        ],
      },
      {
        heading: 'What counts — and what does not',
        paragraphs: [
          'A referral counts when a genuinely new user joins through your link and the app records it. Creating extra accounts yourself, or asking the same person to reinstall repeatedly, does not build a real count — the system is designed to credit real, distinct people. Follow and follow-back activity is normal community behaviour and is not treated as spam; only fake or abusive patterns are a problem.',
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
          'Big platforms spend their marketing money on ads. We would rather spend it on the users who bring their friends. Every referral you earn is Frianzo saying thank you in the only language that matters — credit in your balance. Invite honestly, watch your count grow on the monetization page, and help build Pakistan\'s own social platform while you do it.',
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
      'What the blue tick on a Frianzo profile actually signals, the perks verified accounts receive, who is eligible for the free route, and how the paid route works.',
    date: '2026-10-15',
    readingMinutes: 4,
    sections: [
      {
        heading: null,
        paragraphs: [
          'The blue tick next to a name is the most recognised symbol on social media: this account is who it claims to be. On Frianzo the tick works the same way — but we want to be transparent about what it does, what it does not do, and the two routes to getting one.',
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
        heading: 'Route 1: earn it free through eligibility',
        paragraphs: [
          'Notable accounts can qualify for a free blue tick by meeting the eligibility criteria shown on the verification page in Settings: a complete, genuine profile and a track record of real activity and following. If you qualify, you submit a request from that page and the team reviews it. This route suits established creators, public figures and brands who are already active on the platform.',
        ],
      },
      {
        heading: 'Route 2: the paid blue tick',
        paragraphs: [
          'Newer creators who do not meet the free eligibility criteria yet can get verified through the paid route — a simple subscription (currently Rs 400 for 30 days; watch the verification page for launch offers) arranged directly with the Frianzo team. A member of our team confirms your identity, activates the tick on your account, and your verification runs for the paid period. No forms disappear into a black hole: a real person handles your request and confirms it in chat.',
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
          'Open Settings → Verification in the app. You will see your current status, the perks, and whether you qualify for the free route. If you want the paid route or have questions, message the official @frienzo account in the app — the team replies there, and payment details are only ever shared in that private chat, never in public posts.',
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
];

export function getArticle(slug: string): BlogArticle | undefined {
  return articles.find((a) => a.slug === slug);
}
