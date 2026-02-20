<p align="center">
  <img src="https://nyanquest.vercel.app/icon-512.png" alt="nyanQuest" width="120" />
</p>

<h1 align="center">nyanQuest</h1>

<p align="center">
  <b>주사위 굴리는 고양이와 떠나는 TRPG 모험</b><br/>
  <i>A dice-rolling cat adventure — TRPG party finder & AI solo quest platform</i>
</p>

<p align="center">
  <a href="https://nyanquest.vercel.app">Live Demo</a> ·
  <a href="https://nyanquest.vercel.app/en">English</a> ·
  <a href="https://nyanquest.vercel.app/ko">한국어</a>
</p>

---

## What is nyanQuest?

nyanQuest는 **TRPG(탁상 롤플레잉 게임)** 플레이어를 위한 올인원 플랫폼입니다.

- **AI 솔로 퀘스트** — AI GM이 이끄는 1인 TRPG 모험. 주사위를 굴리고, 스토리를 선택하고, 경험치를 쌓으세요.
- **파티 찾기** — 함께할 파티원을 모집하거나 참가하세요. GM/PL 역할, 온·오프라인 지원.
- **AI GM 멀티플레이** — 파티 세션에서 AI가 GM 역할을 대신합니다.
- **커뮤니티** — 세션 후기, 팁, 자유 게시판.
- **캐릭터 성장** — EXP, 칭호, 고양이 레벨 시스템.

> 🐱 "집사, 오늘 어떤 모험을 떠나볼 거냥?"

---

## Features

| Feature | Description |
|---------|-------------|
| **Solo Quest** | 6개 시나리오 (판타지, 호러, SF, 코미디, 외교, 미스터리) |
| **Dice System** | d4 ~ d100 주사위, DC 판정, 성공/실패 시스템 |
| **Party Finder** | 모집 → 수락 → 세션 → 리뷰 전체 플로우 |
| **AI GM** | Gemini 기반 AI가 실시간 스트리밍으로 GM 역할 수행 |
| **Growth** | 15개 칭호, 5단계 고양이 레벨, 매너온도 |
| **i18n** | 한국어 / English 완벽 지원 |
| **Premium** | 무제한 퀘스트, 고급 AI 모델, 2.5배 턴, 1.5배 EXP |

---

## Screenshots

<table>
  <tr>
    <td align="center"><b>Home</b></td>
    <td align="center"><b>Solo Quest</b></td>
    <td align="center"><b>Party Detail</b></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/home.png" width="240" alt="Home" /></td>
    <td><img src="docs/screenshots/solo.png" width="240" alt="Solo Quest" /></td>
    <td><img src="docs/screenshots/party.png" width="240" alt="Party" /></td>
  </tr>
</table>

> Screenshots는 `docs/screenshots/` 폴더에 추가 후 표시됩니다.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Auth | Supabase Auth + Discord OAuth |
| Database | Supabase (PostgreSQL) |
| AI | OpenRouter (Gemini 2.5 Flash) |
| i18n | next-intl 4 (ko / en) |
| Payment | PortOne (구 아임포트) |
| Deploy | Vercel |
| Testing | Vitest + React Testing Library |

---

## Getting Started

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local
# Fill in: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
#          OPENROUTER_API_KEY, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET

# Run development server
npm run dev

# Run tests
npm test

# Production build
npm run build
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
├── app/
│   ├── [locale]/          # i18n pages (ko / en)
│   │   ├── page.tsx       # Home — party list
│   │   ├── solo/          # AI solo quest
│   │   ├── create/        # Create party
│   │   ├── party/[id]/    # Party detail, edit, manage, play
│   │   ├── community/     # Community board
│   │   ├── my/            # My profile, titles
│   │   ├── user/[id]/     # Public profile
│   │   └── premium/       # Premium subscription
│   └── api/               # API routes
│       ├── solo-quest/    # AI solo quest chat (streaming)
│       ├── party-session/ # AI GM multiplayer chat
│       └── payment/       # PortOne payment flow
├── components/            # Shared UI components
├── lib/                   # Utilities, Supabase clients, configs
├── i18n/                  # next-intl routing & navigation
├── types/                 # TypeScript type definitions
└── __tests__/             # Vitest test suites
messages/
├── ko.json                # Korean translations
└── en.json                # English translations
```

---

## Solo Quest Scenarios

| Emoji | Scenario | Difficulty | Genre |
|-------|----------|------------|-------|
| 🗡️ | Goblin Cave Rescue | Easy | Fantasy |
| 📚 | The Haunted Library | Normal | Horror/Mystery |
| 🚀 | Station Omega Emergency | Hard | Sci-Fi |
| 👑 | The Cat Kingdom | Easy | Fantasy/Comedy |
| 🐉 | Dragon Diplomacy | Hard | Fantasy/Diplomacy |
| 🕐 | The Time Loop Tavern | Normal | Mystery/Fantasy |

---

## Links

- **Live**: [nyanquest.vercel.app](https://nyanquest.vercel.app)
- **Twitter/X**: (coming soon)

---

<p align="center">
  🐱 Built with Next.js, Supabase, and a lot of cat puns.<br/>
  <sub>&copy; 2026 hundredcorekorea</sub>
</p>
