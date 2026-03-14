import type { Scenario } from "@/types/solo-quest";
import type { TrpgSystemId } from "./systems";

export const SCENARIOS: Scenario[] = [
  {
    id: "goblin-cave",
    isPremium: false,
    title: "Goblin Cave Rescue",
    titleKo: "고블린 동굴 구출작전",
    description:
      "마을 상인이 납치됐다냥! 고블린 동굴에 잠입해서 구출하는 임무다냥.",
    descriptionEn:
      "A village merchant has been kidnapped, meow! Your mission is to infiltrate the goblin cave and rescue them.",
    thumbnailEmoji: "🗡️",
    difficulty: "easy",
    estimatedTurns: 8,
    genre: "판타지",
    genreEn: "Fantasy",
    systemPromptAddition: `배경: 중세 판타지 세계. 작은 마을 외곽의 고블린 동굴.
목표: 납치된 상인 '마르코'를 구출하라.
분위기: 긴장감 있지만 유쾌한 모험.
적: 고블린 3-5마리 (약함), 고블린 대장 1마리 (보통).
아이템: 횃불, 밧줄, 단검을 기본 소지.
주요 판정: 은신(DC 10), 전투(DC 12), 함정 해제(DC 13).`,
    systemPromptAdditionEn: `Setting: A medieval fantasy world. A goblin cave on the outskirts of a small village.
Goal: Rescue the kidnapped merchant 'Marco'.
Atmosphere: Tense but lighthearted adventure.
Enemies: 3-5 goblins (weak), 1 goblin chief (moderate).
Items: Torch, rope, and dagger in starting inventory.
Key rolls: Stealth (DC 10), Combat (DC 12), Trap disarm (DC 13).`,
    openingMessage: `어둠이 내려앉은 숲속, 동굴 입구가 보인다냥...

고블린들의 웃음소리가 안에서 들려오고, 횃불빛이 깜빡이고 있다냥. 마을 상인 마르코를 구출해야 한다냥!

집사, 어떻게 할 거냥?

1. 🗡️ 정면으로 돌격한다
2. 🤫 은밀하게 잠입을 시도한다
3. 👀 먼저 동굴 주변을 정찰한다

💡 위 선택지 외에도 원하는 행동을 자유롭게 입력할 수 있다냥!`,
    openingMessageEn: `In the darkened forest, the cave entrance comes into view~nya...

Goblin laughter echoes from inside, and torchlight flickers within~nya. We need to rescue the village merchant Marco, meow!

Adventurer, what will you do~nya?

1. 🗡️ Charge in head-on
2. 🤫 Attempt a stealthy infiltration
3. 👀 Scout around the cave first

💡 You can freely type any action beyond these choices, meow!`,
    suggestedActions: ["정면 돌격", "은밀 잠입", "주변 정찰"],
    suggestedActionsEn: ["Charge in", "Sneak in", "Scout around"],
    theme: {
      bgGradient: "from-stone-950 via-amber-900/80 to-stone-950",
      accentColor: "text-amber-400",
      bubbleColor: "bg-amber-900/40",
    },
    sceneKeywords: "dark cave torchlight fantasy dungeon",
  },
  {
    id: "haunted-library",
    isPremium: false,
    title: "The Haunted Library",
    titleKo: "유령 도서관의 비밀",
    description:
      "폐쇄된 고대 도서관에서 이상한 소리가 들린다냥... 용기 있는 집사만 도전하라냥!",
    descriptionEn:
      "Strange sounds echo from an abandoned ancient library, meow... Only brave butlers dare to enter!",
    thumbnailEmoji: "📚",
    difficulty: "normal",
    estimatedTurns: 10,
    genre: "호러/미스터리",
    genreEn: "Horror/Mystery",
    systemPromptAddition: `배경: 100년간 폐쇄된 고대 마법 도서관. 밤.
목표: 도서관에 봉인된 저주를 풀어라.
분위기: 으스스하지만 무섭지 않은 정도. 유머 섞인 호러.
적: 떠도는 유령 사서 (대화 가능), 마법 함정들, 살아움직이는 책들.
퍼즐 요소: 3개의 마법 책을 올바른 순서로 제단에 놓아야 봉인 해제.
주요 판정: 지식(DC 11), 용기(DC 13), 마법 감지(DC 12).`,
    systemPromptAdditionEn: `Setting: An ancient magical library sealed for 100 years. Nighttime.
Goal: Lift the curse sealed within the library.
Atmosphere: Eerie but not terrifying. Horror with a touch of humor.
Enemies: A wandering ghost librarian (can be talked to), magical traps, living books.
Puzzle element: Three magical books must be placed on the altar in the correct order to break the seal.
Key rolls: Knowledge (DC 11), Courage (DC 13), Arcane detection (DC 12).`,
    openingMessage: `삐걱... 문이 열리자 먼지 냄새가 코를 찌른다냥.

100년간 아무도 들어오지 않은 고대 도서관... 책장들이 천장까지 솟아있고, 어딘가에서 희미한 빛이 깜빡이고 있다냥. 갑자기 속삭이는 소리가...!

"누가... 왔냥...?"

집사, 무엇을 하겠냥?

1. 🔦 소리가 나는 방향으로 간다
2. 📖 가까운 책장의 책을 살펴본다
3. 🗣️ "누구냥?" 하고 대답한다

💡 위 선택지 외에도 원하는 행동을 자유롭게 입력할 수 있다냥!`,
    openingMessageEn: `Creeeak... The door opens and the smell of dust fills the air~nya.

An ancient library where no one has set foot for 100 years... Bookshelves tower up to the ceiling, and somewhere a faint light flickers~nya. Suddenly, a whispering voice...!

"Who... has come~nya...?"

Adventurer, what will you do~nya?

1. 🔦 Head toward the sound
2. 📖 Examine the books on the nearest shelf
3. 🗣️ Call out "Who's there, meow?"

💡 You can freely type any action beyond these choices, meow!`,
    suggestedActions: ["소리 방향 이동", "책장 조사", "대답하기"],
    suggestedActionsEn: ["Follow the sound", "Check bookshelf", "Call out"],
    theme: {
      bgGradient: "from-slate-950 via-purple-900/70 to-slate-950",
      accentColor: "text-purple-400",
      bubbleColor: "bg-purple-900/40",
    },
    sceneKeywords: "ancient library dark dusty bookshelves candlelight",
  },
  {
    id: "space-station",
    isPremium: false,
    title: "Station Omega Emergency",
    titleKo: "우주정거장 오메가 긴급사태",
    description:
      "우주정거장에서 원인불명의 사고가 발생했다냥! 30분 안에 탈출하라냥!",
    descriptionEn:
      "An unexplained accident has occurred on the space station, meow! Escape within 30 minutes!",
    thumbnailEmoji: "🚀",
    difficulty: "hard",
    estimatedTurns: 12,
    genre: "SF",
    genreEn: "Sci-Fi",
    systemPromptAddition: `배경: 미래 우주. 소행성 궤도의 연구 정거장 '오메가'.
목표: 정거장이 폭발하기 전에 탈출선으로 탈출.
분위기: 긴박한 SF 서바이벌. 타이머 느낌.
장애물: 잠긴 방화문, 손상된 산소 시스템, 고장난 AI, 부유하는 잔해.
장비: 우주복, 다용도 공구, 통신기.
주요 판정: 기술(DC 13), 체력(DC 12), 해킹(DC 15).
매 턴 상황이 악화됨을 묘사할 것 (경고음, 산소 감소 등).`,
    systemPromptAdditionEn: `Setting: Far future. Research station 'Omega' in asteroid orbit.
Goal: Escape via the shuttle before the station explodes.
Atmosphere: Intense sci-fi survival. Timer pressure.
Obstacles: Locked blast doors, damaged oxygen system, malfunctioning AI, floating debris.
Equipment: Space suit, multi-tool, communicator.
Key rolls: Engineering (DC 13), Endurance (DC 12), Hacking (DC 15).
Describe the situation worsening each turn (alarms, oxygen dropping, etc.).`,
    openingMessage: `🚨 경고! 경고! 🚨

"우주정거장 오메가에 구조적 손상이 감지되었습니다. 모든 인원은 즉시 대피하십시오."

AI 음성이 울려퍼지고, 바닥이 흔들린다냥! 복도의 비상등이 빨갛게 깜빡이고... 집사, 빨리 움직여야 한다냥!

1. 🏃 곧장 탈출선 격납고로 달린다
2. 🔧 먼저 통신실에서 상황을 파악한다
3. 🆘 동료 연구원을 찾으러 간다

💡 위 선택지 외에도 원하는 행동을 자유롭게 입력할 수 있다냥!`,
    openingMessageEn: `🚨 Warning! Warning! 🚨

"Structural damage detected on Space Station Omega. All personnel evacuate immediately."

The AI voice blares and the floor shakes~nya! Emergency lights flash red in the corridor... Adventurer, we need to move fast, meow!

1. 🏃 Run straight to the shuttle hangar
2. 🔧 Head to the comm room to assess the situation first
3. 🆘 Go search for fellow researchers

💡 You can freely type any action beyond these choices, meow!`,
    suggestedActions: ["탈출선으로 이동", "상황 파악", "동료 구출"],
    suggestedActionsEn: ["Head to shuttle", "Assess situation", "Find crewmates"],
    theme: {
      bgGradient: "from-gray-950 via-cyan-900/60 to-gray-950",
      accentColor: "text-cyan-400",
      bubbleColor: "bg-cyan-900/40",
    },
    sceneKeywords: "space station interior sci-fi corridor lights",
  },
  {
    id: "cat-kingdom",
    isPremium: false,
    title: "The Cat Kingdom",
    titleKo: "고양이 왕국의 왕관",
    description:
      "고양이들의 비밀 왕국에 초대받았다냥! 도둑맞은 왕관을 찾아달라냥!",
    descriptionEn:
      "You've been invited to the secret kingdom of cats, meow! Find the stolen crown!",
    thumbnailEmoji: "👑",
    difficulty: "easy",
    estimatedTurns: 8,
    genre: "판타지/코미디",
    genreEn: "Fantasy/Comedy",
    systemPromptAddition: `배경: 인간에게 숨겨진 고양이들의 비밀 왕국. 동화적 분위기.
목표: 도둑맞은 고양이 왕의 왕관을 되찾아라.
분위기: 따뜻하고 유쾌한 코미디 판타지. 고양이 말장난 많이.
NPC: 고양이 왕 (근엄), 궁정 고양이들 (수다쟁이), 용의자 3마리 (수상한 고양이들).
퍼즐: 용의자 3마리 중 범인 추리 (힌트 3개 수집).
주요 판정: 관찰(DC 10), 대화(DC 11), 추리(DC 12).
고양이 관련 유머와 말장난을 적극 활용할 것.`,
    systemPromptAdditionEn: `Setting: A secret kingdom of cats, hidden from humans. Fairytale atmosphere.
Goal: Recover the stolen crown of the Cat King.
Atmosphere: Warm and lighthearted comedy fantasy. Plenty of cat puns and humor.
NPCs: Cat King (dignified), court cats (gossipy), 3 suspects (suspicious cats).
Puzzle: Deduce the culprit among 3 suspects (collect 3 clues).
Key rolls: Observation (DC 10), Conversation (DC 11), Deduction (DC 12).
Make active use of cat-related humor and puns.`,
    openingMessage: `"야옹~ 환영한다냥, 인간이여!"

눈을 뜨니 거대한 고양이 성의 알현실이다냥! 왕좌에 앉은 거대한 페르시안 고양이가 근엄한 표정으로 내려다보고 있다냥.

"왕관이 사라졌다냥... 세 명의 용의자가 있지만, 누가 범인인지 모르겠다냥. 인간의 지혜를 빌리고 싶다냥!"

집사, 수사를 시작할까냥?

1. 🔍 용의자들을 만나본다
2. 🏰 왕관이 보관되었던 보물실을 조사한다
3. 🐱 궁정 고양이들에게 소문을 듣는다

💡 위 선택지 외에도 원하는 행동을 자유롭게 입력할 수 있다냥!`,
    openingMessageEn: `"Meow~ Welcome, human~nya!"

You open your eyes to find yourself in the grand audience chamber of a massive cat castle~nya! A large Persian cat sits on the throne, gazing down with a dignified expression~nya.

"The crown has vanished~nya... There are three suspects, but I can't figure out who did it~nya. I wish to borrow the wisdom of a human~nya!"

Adventurer, shall we begin the investigation~nya?

1. 🔍 Meet the suspects
2. 🏰 Investigate the treasure room where the crown was kept
3. 🐱 Gather rumors from the court cats

💡 You can freely type any action beyond these choices, meow!`,
    suggestedActions: ["용의자 심문", "보물실 조사", "소문 수집"],
    suggestedActionsEn: ["Question suspects", "Search vault", "Gather rumors"],
    theme: {
      bgGradient: "from-amber-950 via-yellow-900/70 to-amber-950",
      accentColor: "text-yellow-400",
      bubbleColor: "bg-yellow-900/40",
    },
    sceneKeywords: "fantasy castle throne room golden fairytale",
  },
  {
    id: "moonbell-cafe",
    isPremium: false,
    system: "dungeon-world" as TrpgSystemId,
    title: "The Moonbell Café Mystery",
    titleKo: "달빛 카페의 사라진 은방울",
    description:
      "마을 카페의 소중한 은방울이 사라졌다냥! 따뜻한 마을 사람들과 함께 찾아보자냥.",
    descriptionEn:
      "The beloved silver bell of the village café has vanished, meow! Let's find it with the warm townsfolk.",
    thumbnailEmoji: "🔔",
    difficulty: "easy",
    estimatedTurns: 10,
    genre: "코지/미스터리",
    genreEn: "Cozy/Mystery",
    systemPromptAddition: `배경: 언덕 위의 아늑한 마법 마을 '달빛 언덕'. 마을 중심의 카페 '은방울 찻집'.
목표: 카페 주인 할미냥의 소중한 은방울을 찾아라. 은방울은 울릴 때마다 마을에 평화를 가져다주는 마법 아이템이다.
분위기: 따뜻하고 평화로운 코지 미스터리. 긴장감은 있지만 위험하지는 않다. 생명의 위협은 절대 없음.
톤: 마을 디저트 축제 전날의 설레는 분위기. 수사라기보다는 보물찾기에 가까운 느낌으로.

NPC (모두 친절하고 협조적. 각자 디저트 별명을 가짐):
- 할미냥 "마들렌": 카페 주인. 품이 넓고 따뜻한 할머니 고양이. 은방울을 50년간 지켜옴. 수상하지 않음.
- 제빵사 "슈크림": 덩치가 크고 순한 곰 같은 고양이. 매일 아침 카페에 빵을 배달함. 어젯밤 이상한 소리를 들었다고 함.
- 꽃집 주인 "카스텔라": 수줍음이 많은 삼색 고양이. 카페 옆 꽃집 운영. 새벽에 빛나는 뭔가를 봤다고 함.
- 우체부 "에클레어": 활기차고 수다스러운 고양이. 마을 소식통. 최근 떠돌이 까치가 반짝이는 것을 모은다는 소문을 알려줌.
- 떠돌이 까치 "반짝이": 진범(하지만 악의 없음). 은방울의 아름다운 소리에 반해 둥지로 가져감. 둥지는 마을 광장 큰 떡갈나무 꼭대기.

단서 3개:
1. 슈크림의 증언: 새벽 3시에 '딸랑딸랑' 소리가 카페 지붕 쪽에서 들렸다.
2. 카스텔라의 목격: 새벽녘 달빛 아래 반짝이는 뭔가가 하늘을 가로질렀다.
3. 에클레어의 정보: 떠돌이 까치가 최근 마을에 나타나 반짝이는 물건을 모으고 있다.

해결: 떡갈나무를 올라가 까치 둥지에서 은방울을 회수. 까치를 쫓아내는 게 아니라 달래서 해결하면 보너스.
보너스 엔딩: 까치에게 대체 반짝이 장식을 만들어주면 까치가 마을의 친구가 됨.

주요 판정:
- 관찰/탐문: 단서 수집 시 (수정치 +1~+2, 쉬운 편)
- 나무 오르기: 위험 감수 (수정치 +0, 부분 성공 시 나뭇가지가 부러져 약간 다침)
- 까치 달래기: 탐문하기 (수정치 +2, 부분 성공 시 까치가 은방울 대신 다른 물건을 줌)

아슬아슬한 성공 예시를 적극 활용:
- 나무를 올랐는데 바지가 찢어짐
- 까치와 협상했는데 은방울 대신 단추를 받음
- 단서를 찾았지만 카페 컵을 깨뜨림`,
    systemPromptAdditionEn: `Setting: A cozy magical village called 'Moonlit Hill', atop a gentle slope. At its heart is a café called 'Silver Bell Tea House'.
Goal: Find café owner Grandma Meow's precious silver bell. The bell is a magical item that brings peace to the village whenever it rings.
Atmosphere: Warm, peaceful cozy mystery. There's suspense but no danger. Absolutely zero life-threatening situations.
Tone: The excited atmosphere of the evening before the village dessert festival. More of a treasure hunt than an investigation.

NPCs (all friendly and cooperative, each with a dessert nickname):
- Grandma Meow "Madeleine": Café owner. A warm, kind grandmother cat. Has protected the bell for 50 years. Not suspicious.
- Baker "Cream Puff": A large, gentle bear-like cat. Delivers bread to the café every morning. Says he heard a strange sound last night.
- Florist "Castella": A shy calico cat. Runs the flower shop next to the café. Says she saw something shiny at dawn.
- Mail Carrier "Éclair": An energetic, chatty cat. The village gossip. Shares a rumor about a wandering magpie collecting shiny things.
- Wandering Magpie "Sparkle": The culprit (but means no harm). Was enchanted by the bell's beautiful sound and took it to its nest. Nest is atop the big oak tree in the village square.

3 Clues:
1. Cream Puff's testimony: Heard a 'jingle jingle' sound from the café roof at 3 AM.
2. Castella's sighting: Saw something glittering across the sky under the moonlight at dawn.
3. Éclair's intel: A wandering magpie has appeared in town recently, collecting shiny objects.

Resolution: Climb the oak tree and retrieve the bell from the magpie's nest. Bonus for calming the magpie rather than chasing it away.
Bonus ending: If the player crafts a substitute shiny ornament for the magpie, it becomes the village's friend.

Key rolls:
- Observation/inquiry: When gathering clues (modifier +1 to +2, on the easy side)
- Tree climbing: Defy Danger (modifier +0, partial success = branch breaks, minor scrape)
- Calming the magpie: Parley (modifier +2, partial success = magpie gives a button instead of the bell)

Actively use "success at a cost" examples:
- Climbed the tree but tore your pants
- Negotiated with the magpie but got a button instead of the bell
- Found a clue but broke a café cup`,
    openingMessage: `☀️ 아침 햇살이 따스하게 내리쬐는 달빛 언덕 마을이다냥.

"큰일 났다냥...!"

은방울 찻집의 문을 열자, 할미냥 **마들렌**이 눈물을 글썽이며 서 있다냥.

"50년간 지켜온 **은방울**이 사라졌다냥... 내일이 디저트 축제인데, 은방울이 없으면 축제를 열 수가 없다냥..."

은방울은 울릴 때마다 마을에 평화를 가져다주는 소중한 마법 아이템이라고 한다냥. 찻집 안에는 달콤한 마들렌 냄새가 가득하고, 창밖으로는 평화로운 마을 풍경이 보인다냥.

집사, 은방울을 찾아주겠냥?

1. 🔍 찻집 안을 꼼꼼히 살펴본다
2. 🐱 마을 사람들에게 이야기를 들으러 간다
3. 👣 찻집 주변에 발자국이나 흔적이 있는지 확인한다

💡 위 선택지 외에도 원하는 행동을 자유롭게 입력할 수 있다냥!`,
    openingMessageEn: `☀️ Warm morning sunlight bathes the village of Moonlit Hill~nya.

"This is terrible~nya...!"

Opening the door to the Silver Bell Tea House, you find Grandma Meow **Madeleine** standing there with teary eyes~nya.

"The **silver bell** I've protected for 50 years has vanished~nya... The dessert festival is tomorrow, and without the bell, we can't hold it~nya..."

The silver bell is a precious magical item that brings peace to the village whenever it rings~nya. The tea house is filled with the sweet scent of madeleines, and through the window you can see the peaceful village~nya.

Adventurer, will you help find the silver bell~nya?

1. 🔍 Search the tea house carefully
2. 🐱 Go talk to the townsfolk
3. 👣 Check around the tea house for footprints or clues

💡 You can freely type any action beyond these choices, meow!`,
    suggestedActions: ["찻집 조사", "마을 사람 탐문", "흔적 찾기"],
    suggestedActionsEn: ["Search tea house", "Talk to townsfolk", "Look for clues"],
    theme: {
      bgGradient: "from-amber-950 via-orange-900/40 to-amber-950",
      accentColor: "text-amber-300",
      bubbleColor: "bg-amber-900/30",
    },
    sceneKeywords: "cozy village cafe morning sunlight warm peaceful",
  },
  {
    id: "starlight-garden",
    isPremium: false,
    system: "dungeon-world" as TrpgSystemId,
    title: "The Starlight Garden",
    titleKo: "별빛 정원의 수호자",
    description:
      "마을의 별빛 정원이 시들어가고 있다냥! 정원을 되살릴 방법을 찾아보자냥.",
    descriptionEn:
      "The village's starlight garden is wilting, meow! Let's find a way to restore it.",
    thumbnailEmoji: "🌟",
    difficulty: "easy",
    estimatedTurns: 10,
    genre: "코지/힐링",
    genreEn: "Cozy/Healing",
    systemPromptAddition: `배경: 마법의 별빛 정원이 있는 평화로운 마을. 꽃들이 별빛을 머금고 빛나는 아름다운 정원.
목표: 시들어가는 별빛 정원을 되살려라. 정원 중앙의 고대 수정이 금이 가서 별빛이 새어나가고 있다. 수정을 복원하려면 3가지 재료(달빛물, 해바라기꽃잎, 별가루)가 필요하다.
분위기: 따뜻하고 평화로운 코지 힐링. 전투 없음. 생명의 위협 절대 없음. 탐험과 수집, 부드러운 퍼즐에 집중.
톤: 봄날 오후의 산책 같은 느긋함. 모든 NPC가 친절하고 협조적.

NPC (모두 디저트/과자 이름):
- 정원사 "티라미수": 현명한 늙은 고양이. 50년간 정원을 돌봐왔다. 수정이 금간 원인과 필요한 재료를 알려줌.
- 약초사 "마카롱": 수줍지만 도움을 잘 주는 고양이. 숲 속 약초밭에서 해바라기꽃잎을 구할 수 있다고 알려줌.
- 양봉가 "허니": 활기차고 씩씩한 고양이. 벌들과 대화할 수 있으며, 달빛 연못의 위치를 알고 있다.
- 반딧불 여왕 "프랄린": 신비롭지만 친절한 존재. 별가루를 가지고 있으며, 작은 부탁(반딧불을 위한 노래)을 들어주면 나눠줌.

재료 수집:
1. 달빛물: 달빛 연못에서 달이 비칠 때 수면을 떠야 함. 허니가 위치를 알려줌.
2. 해바라기꽃잎: 마카롱의 약초밭에서 가장 크게 핀 해바라기에서 채취. 마카롱이 도와줌.
3. 별가루: 프랄린에게 반딧불을 위한 노래를 불러주면 작은 병에 담아줌.

해결: 3가지 재료를 모아 금간 수정에 바르면 정원이 되살아남. 별빛 꽃들이 다시 빛나는 아름다운 엔딩.
보너스 엔딩: 모든 NPC에게 친절하게 대하면 마을 축제가 열리고 특별한 별빛 꽃을 선물받음.

주요 판정:
- 간파하기(Discern Realities): 재료 찾기 시 (+2, 쉬운 편)
- 탐문하기(Parley): NPC와 대화 시 (+1, 부분 성공 시 재미있는 오해 발생)
- 위험 감수(Defy Danger): 달빛 연못에서 물을 뜰 때 (+1, 부분 성공 시 옷이 젖음)

아슬아슬한 성공 예시:
- 달빛물을 떴는데 절반을 쏟아버림
- 해바라기꽃잎을 땄는데 재채기해서 일부 흩어짐
- 별가루를 받았는데 반딧불이 머리 위에 눌러앉아서 안 내려옴`,
    systemPromptAdditionEn: `Setting: A peaceful village with a magical starlight garden. A beautiful garden where flowers glow, imbued with starlight.
Goal: Restore the wilting starlight garden. The ancient crystal at the garden's center has cracked, and starlight is leaking out. Three ingredients are needed to repair the crystal: moonwater, sunpetal, and stardust.
Atmosphere: Warm, peaceful cozy healing. No combat. Absolutely zero life-threatening situations. Focus on exploration, gathering, and gentle puzzles.
Tone: As relaxed as an afternoon stroll on a spring day. All NPCs are friendly and cooperative.

NPCs (all named after desserts/sweets):
- Gardener "Tiramisu": A wise old cat. Has tended the garden for 50 years. Explains why the crystal cracked and what ingredients are needed.
- Herbalist "Macaron": A shy but helpful cat. Reveals that sunpetals can be found in the herb garden deep in the forest.
- Beekeeper "Honey": An energetic, spirited cat. Can talk to bees and knows the location of the moonlight pond.
- Firefly Queen "Praline": A mysterious but kind being. Possesses stardust and will share it if you fulfill a small favor (singing a song for the fireflies).

Ingredient gathering:
1. Moonwater: Must be scooped from the moonlight pond when the moon is reflected on its surface. Honey knows the location.
2. Sunpetal: Harvest from the largest sunflower in Macaron's herb garden. Macaron helps.
3. Stardust: Sing a song for the fireflies for Praline, and she'll give you a small bottle of it.

Resolution: Gather all 3 ingredients and apply them to the cracked crystal to revive the garden. A beautiful ending where the starlight flowers glow again.
Bonus ending: If you treat all NPCs kindly, a village festival is held and you receive a special starlight flower as a gift.

Key rolls:
- Discern Realities: When searching for ingredients (+2, on the easy side)
- Parley: When talking to NPCs (+1, partial success = a funny misunderstanding occurs)
- Defy Danger: When scooping water from the moonlight pond (+1, partial success = your clothes get soaked)

Partial success examples:
- Scooped the moonwater but spilled half of it
- Picked the sunpetal but sneezed and scattered some
- Received the stardust but a firefly sat on your head and won't get off`,
    openingMessage: `🌟 별빛이 희미하게 깜빡이는 정원이다냥...

"큰일이다냥, 집사..."

정원 입구에서 늙은 고양이 **티라미수**가 걱정스러운 얼굴로 서 있다냥. 한때 찬란하게 빛나던 별빛 꽃들이 하나둘 시들어가고 있다냥.

"정원 중앙의 **고대 수정**에 금이 갔다냥... 별빛이 새어나가고 있어. 이대로 두면 정원의 모든 꽃이 사라질 거다냥."

티라미수에 따르면, 수정을 고치려면 **달빛물**, **해바라기꽃잎**, **별가루** 세 가지 재료가 필요하다고 한다냥. 정원에는 달콤한 꽃향기가 아직 남아있고, 멀리서 반딧불이 깜빡이는 게 보인다냥.

집사, 별빛 정원을 살려보겠냥?

1. 🌿 마을 약초사 마카롱을 찾아간다
2. 🐝 양봉가 허니에게 달빛 연못의 위치를 묻는다
3. ✨ 반딧불이 빛나는 숲속으로 가본다

💡 위 선택지 외에도 원하는 행동을 자유롭게 입력할 수 있다냥!`,
    openingMessageEn: `🌟 A garden where starlight flickers faintly~nya...

"This is terrible~nya, adventurer..."

At the garden entrance, an old cat named **Tiramisu** stands with a worried face~nya. The starlight flowers that once shone brilliantly are wilting one by one~nya.

"The **ancient crystal** at the center of the garden has cracked~nya... Starlight is leaking out. If we leave it like this, all the flowers in the garden will disappear~nya."

According to Tiramisu, three ingredients are needed to repair the crystal: **moonwater**, **sunpetal**, and **stardust**~nya. The sweet fragrance of flowers still lingers in the garden, and fireflies can be seen flickering in the distance~nya.

Adventurer, will you help save the starlight garden~nya?

1. 🌿 Visit the village herbalist Macaron
2. 🐝 Ask beekeeper Honey about the moonlight pond's location
3. ✨ Head into the forest where the fireflies glow

💡 You can freely type any action beyond these choices, meow!`,
    suggestedActions: ["마카롱 방문", "허니에게 질문", "숲속 탐험"],
    suggestedActionsEn: ["Visit Macaron", "Ask Honey", "Explore the forest"],
    theme: {
      bgGradient: "from-green-950 via-emerald-900/50 to-green-950",
      accentColor: "text-emerald-400",
      bubbleColor: "bg-emerald-900/40",
    },
    sceneKeywords: "magical garden starlight flowers glowing peaceful night",
  },
  {
    id: "harbor-festival",
    isPremium: false,
    title: "The Harbor Festival",
    titleKo: "항구 축제의 미식 대모험",
    description:
      "항구 마을의 미식 축제에 참가하게 됐다냥! 최고의 요리를 만들어 우승하자냥!",
    descriptionEn:
      "You've entered the harbor town's food festival, meow! Let's cook the best dish and win!",
    thumbnailEmoji: "🍳",
    difficulty: "easy",
    estimatedTurns: 8,
    genre: "코지/요리",
    genreEn: "Cozy/Cooking",
    systemPromptAddition: `배경: 바닷가 항구 마을의 연례 미식 축제. 화창한 날씨, 활기찬 시장.
목표: 항구 시장에서 재료를 모아 요리를 만들고, 심사위원에게 선보여 우승하라. 우호적인 경쟁, 위험 없음.
분위기: 따뜻하고 즐거운 코지 요리 모험. 전투 없음. 생명의 위협 절대 없음. 요리 테마의 스킬 체크.
톤: 요리 프로그램처럼 밝고 경쾌. 모든 NPC가 개성 넘치지만 친절.

NPC (모두 디저트/과자 이름):
- 심사위원 "크렘 브륄레": 엄격하지만 공정한 고양이 셰프. 요리의 맛, 향, 프레젠테이션을 종합 평가.
- 어부 "타이야키": 넉넉하고 관대한 고양이. 신선한 생선을 나눠주며, 바다 이야기를 좋아함.
- 향신료 상인 "사프란": 드라마틱하고 흥정을 즐기는 고양이. 진귀한 향신료를 가지고 있지만 값을 잘 깎아야 함.
- 라이벌 셰프 "퐁당": 경쟁적이지만 스포츠맨십이 훌륭한 고양이. 패배해도 웃으며 축하해줌.

요리 과정:
1. 재료 모으기: 항구 시장을 돌아다니며 해산물, 채소, 향신료를 수집.
2. 조리하기: 불 조절, 양념, 타이밍이 중요. 손놀림(Dexterity) 체크.
3. 프레젠테이션: 접시에 예쁘게 담는 것도 점수. 창의성 보너스.

주요 판정:
- 요리/손놀림(Dexterity): DC 10. 요리 실력 체크.
- 설득(Persuasion): DC 11. 흥정이나 재료 부탁 시.
- 지각(Perception): DC 12. 진귀한 재료 발견 시.

아슬아슬한 성공 예시:
- 요리 맛은 훌륭한데 프레젠테이션이 지저분함
- 진귀한 향신료를 구했는데 너무 비싸게 삼
- 생선은 완벽하게 구웠는데 소스를 좀 태움`,
    systemPromptAdditionEn: `Setting: The annual food festival in a seaside harbor town. Sunny weather, bustling market.
Goal: Gather ingredients from the harbor market, cook a dish, and present it to the judges to win. Friendly competition, no danger.
Atmosphere: Warm, cheerful cozy cooking adventure. No combat. Absolutely zero life-threatening situations. Cooking-themed skill checks.
Tone: Bright and lively like a cooking show. All NPCs are full of personality but friendly.

NPCs (all named after desserts/sweets):
- Judge "Crème Brûlée": A stern but fair cat chef. Evaluates dishes on taste, aroma, and presentation.
- Fisher "Taiyaki": A generous, big-hearted cat. Shares fresh fish and loves telling stories of the sea.
- Spice Merchant "Saffron": A dramatic cat who loves bargaining. Has rare spices, but you need to haggle well.
- Rival Chef "Fondant": A competitive but sportsmanlike cat. Smiles and congratulates you even in defeat.

Cooking process:
1. Gather ingredients: Wander the harbor market collecting seafood, vegetables, and spices.
2. Cook: Heat control, seasoning, and timing are key. Dexterity checks.
3. Presentation: Plating beautifully also earns points. Creativity bonus.

Key rolls:
- Cooking/Dexterity: DC 10. Cooking skill check.
- Persuasion: DC 11. For haggling or requesting ingredients.
- Perception: DC 12. For finding rare ingredients.

Partial success examples:
- The dish tastes great but the presentation is messy
- Found the rare spice but paid too much for it
- Grilled the fish perfectly but slightly burned the sauce`,
    openingMessage: `🍳 바닷바람이 시원하게 부는 항구 마을이다냥!

"축제가 시작됐다냥~!"

항구 시장은 색색의 깃발과 맛있는 냄새로 가득하다냥. 요리 대회 무대 앞에 커다란 현수막이 걸려 있다냥: **"제12회 항구 미식 축제 — 최고의 셰프를 가려라!"**

심사위원석에는 고양이계의 전설적 셰프 **크렘 브륄레**가 날카로운 눈빛으로 앉아있다냥. 옆에서는 라이벌 셰프 **퐁당**이 자신만만하게 칼을 갈고 있다냥.

"참가자 여러분, 2시간 안에 최고의 한 접시를 만들어 오시오!"

시장에는 어부 타이야키의 생선 가판대, 사프란의 향신료 가게, 그리고 신선한 채소 노점이 즐비하다냥. 집사, 어떤 요리를 만들 거냥?

1. 🐟 어부 타이야키에게 신선한 해산물을 얻으러 간다
2. 🌶️ 향신료 상인 사프란의 가게를 구경한다
3. 🥬 먼저 시장을 한 바퀴 돌며 재료를 파악한다

💡 위 선택지 외에도 원하는 행동을 자유롭게 입력할 수 있다냥!`,
    openingMessageEn: `🍳 A harbor town where the sea breeze blows cool~nya!

"The festival has begun~nya~!"

The harbor market is filled with colorful banners and delicious aromas~nya. A large banner hangs in front of the cooking contest stage~nya: **"12th Annual Harbor Food Festival — Find the Greatest Chef!"**

At the judges' table, the legendary cat chef **Crème Brûlée** sits with a sharp gaze~nya. Beside the stage, rival chef **Fondant** is confidently sharpening a knife~nya.

"Contestants, you have 2 hours to create your finest dish!"

The market is lined with fisher Taiyaki's seafood stall, Saffron's spice shop, and fresh vegetable stands~nya. Adventurer, what dish will you make~nya?

1. 🐟 Head to fisher Taiyaki for fresh seafood
2. 🌶️ Browse spice merchant Saffron's shop
3. 🥬 Take a stroll around the market first to scope out ingredients

💡 You can freely type any action beyond these choices, meow!`,
    suggestedActions: ["해산물 구하기", "향신료 구경", "시장 둘러보기"],
    suggestedActionsEn: ["Get seafood", "Browse spices", "Explore the market"],
    theme: {
      bgGradient: "from-orange-950 via-amber-900/50 to-orange-950",
      accentColor: "text-orange-400",
      bubbleColor: "bg-orange-900/40",
    },
    sceneKeywords: "harbor market festival seaside cooking sunny cheerful",
  },
  // === Premium Scenarios ===
  {
    id: "dragon-diplomacy",
    isPremium: true,
    title: "Dragon Diplomacy",
    titleKo: "용의 외교관",
    description:
      "고대 용과의 평화 협상에 나서야 한다냥! 말 한마디가 왕국의 운명을 바꾼다냥!",
    descriptionEn:
      "You must negotiate peace with an ancient dragon, meow! A single word could change the kingdom's fate!",
    thumbnailEmoji: "🐉",
    difficulty: "hard",
    estimatedTurns: 12,
    genre: "판타지/외교",
    genreEn: "Fantasy/Diplomacy",
    systemPromptAddition: `배경: 중세 판타지. 인간 왕국과 용족의 긴장 관계. 용의 둥지에서 협상.
목표: 고대 용 '아우렐리온'과 평화 조약을 맺어라.
분위기: 웅장하면서도 긴장감 넘치는 외교전. 말 한마디가 운명을 바꿈.
NPC: 아우렐리온 (현명하지만 오만한 고대 용), 용족 수호자들, 인간 측 조언자.
핵심: 전투가 아닌 대화와 협상으로 해결. 용의 3가지 요구를 충족시켜야 함.
주요 판정: 설득(DC 14), 지혜(DC 13), 담력(DC 15), 외교(DC 12).
아우렐리온은 거짓말을 즉시 간파함. 정직하되 전략적으로.`,
    systemPromptAdditionEn: `Setting: Medieval fantasy. Tense relations between the human kingdom and dragonkind. Negotiation at the dragon's lair.
Goal: Forge a peace treaty with the ancient dragon 'Aurelion'.
Atmosphere: Grand yet tense diplomatic confrontation. A single word can change fate.
NPCs: Aurelion (wise but proud ancient dragon), dragon guardians, human-side advisor.
Core: Resolve through dialogue and negotiation, not combat. Must satisfy the dragon's 3 demands.
Key rolls: Persuasion (DC 14), Wisdom (DC 13), Nerve (DC 15), Diplomacy (DC 12).
Aurelion sees through lies instantly. Be honest but strategic.`,
    openingMessage: `거대한 동굴의 끝, 황금빛 비늘이 용암의 빛에 반짝인다냥...

"인간이... 왔냥."

산 하나만큼 거대한 용 아우렐리온이 천천히 눈을 뜬다냥. 수천 년의 지혜가 담긴 눈동자가 집사를 내려다보고 있다냥.

"평화를 원한다고? 흥미롭냥. 그렇다면... 세 가지를 증명해 보아라."

집사, 용 앞에서 어떻게 할 거냥?

1. 🎩 정중하게 인사하며 협상을 시작한다
2. 💎 가져온 선물을 먼저 바친다
3. 🗣️ 당당하게 평화의 필요성을 역설한다

💡 위 선택지 외에도 원하는 행동을 자유롭게 입력할 수 있다냥!`,
    openingMessageEn: `At the end of the vast cavern, golden scales gleam in the glow of lava~nya...

"A human... has come~nya."

The ancient dragon Aurelion, as massive as a mountain, slowly opens its eyes~nya. Eyes carrying millennia of wisdom gaze down upon you~nya.

"You desire peace? How intriguing~nya. Then... prove yourself in three ways."

Adventurer, what will you do before the dragon~nya?

1. 🎩 Greet politely and begin negotiations
2. 💎 Offer the gifts you brought first
3. 🗣️ Boldly argue the necessity of peace

💡 You can freely type any action beyond these choices, meow!`,
    suggestedActions: ["정중한 인사", "선물 바치기", "평화 역설"],
    suggestedActionsEn: ["Greet politely", "Offer gifts", "Argue for peace"],
    theme: {
      bgGradient: "from-red-950 via-orange-900/60 to-red-950",
      accentColor: "text-orange-400",
      bubbleColor: "bg-orange-900/40",
    },
    sceneKeywords: "dragon lair volcanic cavern treasure fantasy",
  },
  {
    id: "time-loop",
    isPremium: true,
    title: "The Time Loop Tavern",
    titleKo: "시간의 고리: 끝없는 주점",
    description:
      "같은 밤이 반복된다냥! 시간 루프를 깨뜨리고 아침을 맞이하라냥!",
    descriptionEn:
      "The same night keeps repeating, meow! Break the time loop and welcome the morning!",
    thumbnailEmoji: "🕐",
    difficulty: "normal",
    estimatedTurns: 10,
    genre: "미스터리/판타지",
    genreEn: "Mystery/Fantasy",
    systemPromptAddition: `배경: 마법 세계의 한 주점. 같은 밤이 무한 반복되는 시간 루프에 갇힘.
목표: 시간 루프의 원인을 밝히고 루프를 깨뜨려라.
분위기: 미스터리 스릴러 + 따뜻한 인간(고양이) 드라마.
NPC: 주점 주인 할머니 (비밀을 알고 있음), 음유시인 (힌트를 노래로 전함), 수상한 여행자 (루프의 열쇠).
퍼즐: 매 루프마다 새로운 정보 수집 → 올바른 순서로 이벤트 변경.
주요 판정: 관찰(DC 11), 기억(DC 12), 설득(DC 13), 마법 감지(DC 14).
플레이어가 루프를 인식하면 NPC들의 반응이 달라짐.`,
    systemPromptAdditionEn: `Setting: A tavern in a magical world. Trapped in a time loop where the same night repeats endlessly.
Goal: Uncover the cause of the time loop and break it.
Atmosphere: Mystery thriller + warm human (cat) drama.
NPCs: Tavern grandmother (knows a secret), bard (delivers hints through song), suspicious traveler (key to the loop).
Puzzle: Collect new information each loop -> change events in the correct order.
Key rolls: Observation (DC 11), Memory (DC 12), Persuasion (DC 13), Arcane detection (DC 14).
NPCs react differently once the player becomes aware of the loop.`,
    openingMessage: `"어서 오라냥, 여행자여! 오늘 밤은 특별한 밤이다냥!"

주점 문을 열자 따스한 불빛과 음악 소리가 반긴다냥. 할머니가 웃으며 맥주잔을 건넨다냥.

...그런데 이상하다냥. 이 장면, 어디서 본 것 같은데...?

자정을 알리는 종이 울리는 순간, 세상이 깜빡이고— 다시 주점 문 앞에 서 있다냥!

집사, 무엇을 하겠냥?

1. 🤔 할머니에게 "지금 몇 시냥?" 물어본다
2. 🎵 노래하고 있는 음유시인에게 다가간다
3. 👤 구석에 앉은 수상한 여행자를 관찰한다

💡 위 선택지 외에도 원하는 행동을 자유롭게 입력할 수 있다냥!`,
    openingMessageEn: `"Welcome~nya, traveler! Tonight is a special night~nya!"

You open the tavern door and warm light and music greet you~nya. The grandmother smiles and hands you a mug of ale~nya.

...But something feels strange~nya. This scene... haven't I seen this before...?

The moment the midnight bell tolls, the world flickers and— you're standing in front of the tavern door again~nya!

Adventurer, what will you do~nya?

1. 🤔 Ask the grandmother "What time is it, meow?"
2. 🎵 Approach the singing bard
3. 👤 Observe the suspicious traveler sitting in the corner

💡 You can freely type any action beyond these choices, meow!`,
    suggestedActions: ["할머니에게 질문", "음유시인 접근", "여행자 관찰"],
    suggestedActionsEn: ["Ask grandmother", "Approach bard", "Watch traveler"],
    theme: {
      bgGradient: "from-indigo-950 via-violet-900/70 to-indigo-950",
      accentColor: "text-violet-400",
      bubbleColor: "bg-violet-900/40",
    },
    sceneKeywords: "medieval tavern inn candlelight night mysterious",
  },
  // === Multi-TRPG System Scenarios ===
  {
    id: "midnight-hospital",
    isPremium: true,
    system: "insane" as TrpgSystemId,
    title: "Midnight Hospital",
    titleKo: "자정의 병원",
    description:
      "이상한 병원에 갇혔다냥... 호기심이 이끄는 대로 가면, 진실이 보인다냥. 아니면 광기가.",
    descriptionEn:
      "You're trapped in a strange hospital, meow... Follow your curiosity to find truth — or madness.",
    thumbnailEmoji: "🏥",
    difficulty: "hard",
    estimatedTurns: 10,
    genre: "호러/심리",
    genreEn: "Horror/Psychological",
    systemPromptAddition: `배경: 한밤중의 폐병원. 플레이어는 기억을 잃은 채 깨어남.
목표: 병원에서 탈출하고 자신의 정체를 밝혀라.
분위기: 인세인 특유의 심리 호러. 호기심과 공포가 공존.
NPC: 간호사 유령 (도움을 주는 척), 다른 환자 (비밀을 가진 자), 의문의 의사.
시스템 특징: 각 NPC는 "비밀"을 하나씩 가지고 있으며, 조사할 때마다 하나씩 드러남.
- 비밀은 "쇼크"로 공개: 극적으로 연출할 것.
- 광기가 쌓이면 환각 묘사 추가.
주요 판정: 조사(목표치 8), 교섭(목표치 9), 전투(목표치 10), 의지(목표치 7).
3개의 비밀을 모두 모으면 탈출 가능.`,
    systemPromptAdditionEn: `Setting: An abandoned hospital at midnight. The player wakes up with no memory.
Goal: Escape the hospital and uncover your identity.
Atmosphere: Insane system's signature psychological horror. Curiosity and fear coexist.
NPCs: Ghost nurse (pretends to help), another patient (holds a secret), mysterious doctor.
System features: Each NPC holds one "secret" that is revealed one at a time through investigation.
- Secrets are revealed through "Shock": stage them dramatically.
- As madness accumulates, add hallucination descriptions.
Key rolls: Investigation (target 8), Negotiation (target 9), Combat (target 10), Willpower (target 7).
Collect all 3 secrets to unlock the escape.`,
    openingMessage: `...삐... 삐... 삐...

형광등이 깜빡인다냥. 차가운 병상 위에서 눈을 뜬다냥.

여기가... 어디냥? 기억이 없다냥. 손목에는 환자 팔찌가 채워져 있고, 복도에서 누군가의 발소리가 들린다냥...

집사, 어떻게 하겠냥?

1. 🚪 조용히 복도로 나가본다
2. 📋 병상 옆 차트를 확인한다
3. 👂 발소리가 멈출 때까지 숨어서 듣는다

💡 위 선택지 외에도 원하는 행동을 자유롭게 입력할 수 있다냥!`,
    openingMessageEn: `...beep... beep... beep...

The fluorescent lights flicker~nya. You open your eyes on a cold hospital bed~nya.

Where... is this~nya? No memories~nya. A patient wristband is strapped to your wrist, and footsteps echo from the corridor~nya...

Adventurer, what will you do~nya?

1. 🚪 Quietly step out into the corridor
2. 📋 Check the chart beside the bed
3. 👂 Hide and listen until the footsteps stop

💡 You can freely type any action beyond these choices, meow!`,
    suggestedActions: ["복도 탐색", "차트 확인", "숨어서 관찰"],
    suggestedActionsEn: ["Explore corridor", "Check chart", "Hide and listen"],
    theme: {
      bgGradient: "from-gray-950 via-emerald-900/40 to-gray-950",
      accentColor: "text-emerald-400",
      bubbleColor: "bg-emerald-900/40",
    },
    sceneKeywords: "abandoned hospital dark corridor horror",
  },
  {
    id: "innsmouth-files",
    isPremium: true,
    system: "coc" as TrpgSystemId,
    title: "The Innsmouth Files",
    titleKo: "인스머스 사건 파일",
    description:
      "해안 마을에서 사람들이 사라지고 있다냥... 진실을 파헤칠수록, 정신이 위험해진다냥.",
    descriptionEn:
      "People are disappearing in a coastal town, meow... The deeper you dig, the more your sanity is at risk.",
    thumbnailEmoji: "🐙",
    difficulty: "hard",
    estimatedTurns: 12,
    genre: "코즈믹 호러",
    genreEn: "Cosmic Horror",
    systemPromptAddition: `배경: 1920년대 미국 해안 마을 '인스머스'. 탐정으로 실종 사건 조사.
목표: 실종자들의 행방을 밝히고 살아서 마을을 빠져나가라.
분위기: 크툴루 신화 특유의 서서히 조여오는 공포. 인간의 나약함.
NPC: 마을 이장 (수상한 눈빛), 늙은 어부 (힌트를 줌), 도서관 사서 (고대 문서 보유).
시스템 특징:
- 플레이어 SAN(정신력)을 추적해. 시작 SAN: 65.
- 공포스러운 존재/진실을 목격하면 SAN 체크 요청.
- SAN이 0이 되면 영구 광기 → 게임 오버.
- 조사가 핵심. 전투는 최후의 수단.
주요 판정: 도서관 이용(기능치 65), 발견(기능치 50), 설득(기능치 55), 은신(기능치 40), SAN 체크(기능치 현재SAN).
마을 깊숙이 갈수록 비인간적 존재의 흔적이.`,
    systemPromptAdditionEn: `Setting: 1920s American coastal town 'Innsmouth'. Investigating disappearances as a detective.
Goal: Uncover the fate of the missing persons and escape the town alive.
Atmosphere: The slow, tightening dread unique to the Cthulhu Mythos. Human frailty.
NPCs: Village elder (suspicious gaze), old fisherman (provides hints), librarian (possesses ancient documents).
System features:
- Track the player's SAN (Sanity). Starting SAN: 65.
- Request a SAN check when witnessing horrific entities/truths.
- SAN reaches 0 = permanent madness -> game over.
- Investigation is key. Combat is a last resort.
Key rolls: Library Use (skill 65), Spot Hidden (skill 50), Persuade (skill 55), Stealth (skill 40), SAN check (skill = current SAN).
The deeper into town, the more traces of inhuman entities appear.`,
    openingMessage: `1927년 가을. 인스머스행 버스에서 내린다냥.

짠 바다 냄새와 함께... 썩은 생선 냄새가 코를 찌른다냥. 마을은 이상하리만큼 조용하고, 지나가는 주민들의 눈빛이 유독 크고... 뭔가 이상하다냥.

실종된 기자 3명. 마지막 목격 장소는 이 마을이다냥.

집사, 조사를 시작하겠냥?

1. 🏛️ 마을 이장을 찾아간다
2. 📚 마을 도서관에서 자료를 조사한다
3. 🎣 항구에서 어부들에게 이야기를 듣는다

💡 위 선택지 외에도 원하는 행동을 자유롭게 입력할 수 있다냥!`,
    openingMessageEn: `Autumn, 1927. You step off the bus to Innsmouth~nya.

Along with the salty sea breeze... the stench of rotting fish stings your nose~nya. The town is eerily quiet, and the eyes of passing residents are unusually large and... something is off~nya.

Three journalists, missing. Their last known location: this town~nya.

Adventurer, shall we begin the investigation~nya?

1. 🏛️ Visit the village elder
2. 📚 Research at the town library
3. 🎣 Talk to the fishermen at the harbor

💡 You can freely type any action beyond these choices, meow!`,
    suggestedActions: ["이장 방문", "도서관 조사", "어부 탐문"],
    suggestedActionsEn: ["Visit elder", "Research library", "Question fishermen"],
    theme: {
      bgGradient: "from-slate-950 via-teal-900/50 to-slate-950",
      accentColor: "text-teal-400",
      bubbleColor: "bg-teal-900/40",
    },
    sceneKeywords: "foggy coastal town harbor fishing village eerie",
  },
  {
    id: "red-forest-witch",
    isPremium: false,
    system: "dungeon-world" as TrpgSystemId,
    title: "The Red Forest Witch",
    titleKo: "붉은 숲의 마녀",
    description:
      "마녀의 저주가 숲을 뒤덮었다냥! 동료와 함께 저주를 풀어라냥!",
    descriptionEn:
      "A witch's curse has engulfed the forest, meow! Break the curse with your allies!",
    thumbnailEmoji: "🧹",
    difficulty: "normal",
    estimatedTurns: 10,
    genre: "판타지/내러티브",
    genreEn: "Fantasy/Narrative",
    systemPromptAddition: `배경: 붉게 물든 마법의 숲. 마녀의 저주로 계절이 멈춤.
목표: 숲 깊숙한 마녀의 오두막에 도달하여 저주를 풀어라.
분위기: 동화적이면서 위험한 모험. 던전월드 특유의 즉흥적 내러티브.
NPC: 숲의 정령 (길 안내, 대가를 요구), 저주받은 사냥꾼 (동료가 될 수 있음), 마녀 (적이 아닐 수도?).
시스템 특징:
- PbtA "무브" 시스템: 플레이어의 행동이 무브를 발동시킴.
- 부분 성공(7-9)을 적극 활용해 재미있는 대가를 제시해.
  예: "성공하지만 소중한 것을 잃는다", "해내지만 소리를 내서 적이 눈치챈다".
- 실패(6-)에서는 상황을 흥미롭게 악화시키되 절대 즉사시키지 마.
주요 무브: 기민하게 행동하기(+1), 간파하기(+1), 위험 감수(+0), 근접 전투(+1), 탐문하기(+2).`,
    systemPromptAdditionEn: `Setting: A magical forest dyed crimson. The seasons have frozen under the witch's curse.
Goal: Reach the witch's hut deep in the forest and lift the curse.
Atmosphere: A fairytale-like yet dangerous adventure. Dungeon World's signature improvisational narrative.
NPCs: Forest spirit (guides the way, demands a price), cursed hunter (can become an ally), the witch (might not be the enemy?).
System features:
- PbtA "Moves" system: Player actions trigger moves.
- Actively use partial successes (7-9) to present interesting costs.
  e.g.: "You succeed but lose something precious", "You pull it off but make noise, alerting the enemy".
- On failures (6-), make the situation worsen in interesting ways but never instant-kill.
Key moves: Defy Danger (+1), Discern Realities (+1), Defy Danger (+0), Hack and Slash (+1), Parley (+2).`,
    openingMessage: `숲에 들어서자... 모든 나뭇잎이 핏빛으로 물들어 있다냥.

바람도 불지 않는데 나뭇잎이 소곤거리는 것 같다냥. 마을에서 들었던 이야기가 떠오른다냥... "붉은 숲에 들어간 자, 아무도 돌아오지 못했다"고.

하지만 저주를 풀지 않으면 마을이 위험하다냥!

집사, 어디로 가겠냥?

1. 🛤️ 오래된 오솔길을 따라간다
2. 🌳 나무에 새겨진 이상한 표식을 조사한다
3. 🔥 횃불을 들고 숲 깊숙이 진입한다

💡 위 선택지 외에도 원하는 행동을 자유롭게 입력할 수 있다냥!`,
    openingMessageEn: `Stepping into the forest... every leaf is stained blood-red~nya.

There's no wind, yet the leaves seem to whisper~nya. The stories from the village come to mind~nya... "No one who entered the Red Forest ever returned."

But if the curse isn't broken, the village is in danger~nya!

Adventurer, where will you go~nya?

1. 🛤️ Follow the old trail
2. 🌳 Investigate the strange markings carved into the trees
3. 🔥 Raise a torch and push deeper into the forest

💡 You can freely type any action beyond these choices, meow!`,
    suggestedActions: ["오솔길 탐색", "표식 조사", "숲 진입"],
    suggestedActionsEn: ["Follow the trail", "Check markings", "Enter the forest"],
    theme: {
      bgGradient: "from-red-950 via-rose-900/50 to-red-950",
      accentColor: "text-rose-400",
      bubbleColor: "bg-rose-900/40",
    },
    sceneKeywords: "red autumn forest magical crimson leaves dark path",
  },
  {
    id: "nights-of-seoul",
    isPremium: true,
    system: "vtm" as TrpgSystemId,
    title: "Nights of Seoul",
    titleKo: "서울의 밤",
    description:
      "뱀파이어로 깨어난 첫 밤이다냥... 야수를 억누르고, 가면무도회를 지키며, 서울의 밤을 생존하라냥!",
    descriptionEn:
      "Your first night as a vampire, meow... Suppress the Beast, uphold the Masquerade, and survive the nights of Seoul!",
    thumbnailEmoji: "🧛",
    difficulty: "hard",
    estimatedTurns: 12,
    genre: "고딕 호러/정치",
    genreEn: "Gothic Horror/Politics",
    systemPromptAddition: `배경: 현대 서울. 플레이어는 갓 포용(Embrace)된 신생 뱀파이어.
목표: 첫 번째 밤을 생존하고, 자신의 위치를 확보하라. 가면무도회를 깨뜨리지 마라.
분위기: 뱀파이어 더 마스커레이드 V5. 어둡고 정치적인 고딕 호러. 내면의 야수와의 싸움.

캐릭터 설정:
- 클랜: 브루하 (Brujah) - 반항적이고 열정적인 클랜
- 세대: 13세대 (약한 피의 힘, 강한 인간성)
- 배고픔 수치: 1 (시작), 행동에 따라 증가
- 능력치 풀: 근력+격투 5, 카리스마+위협 5, 지능+조사 4, 민첩+은신 4, 재치+감각 6

NPC:
- 시레(Sire): "민수" - 플레이어를 포용한 뱀파이어. 무뚝뚝하지만 보호적.
- 프린스: "정 여사" - 서울 카마릴라의 수장. 냉혹한 정치인.
- 아나크: "세진" - 아나크 운동의 리더. 자유를 외치는 브루하.
- 인간 친구: "유진" - 포용 전의 친구. 가면무도회의 시험대.

시스템 특징:
- 배고픔(Hunger)을 추적해. 피를 사용하거나 시간이 지나면 증가.
  배고픔 4 이상이면 야수가 깨어날 위험 경고.
- 가면무도회 위반 여부를 항상 체크. 인간 앞에서 초자연적 능력 사용 시 경고.
- 뱀파이어 능력: 초인적 힘(Potence), 민첩(Celerity), 매력(Presence).
- 정치적 선택: 카마릴라(질서) vs 아나크(자유) 사이의 갈등.
주요 판정: 위협(5d10, 난이도 2), 조사(4d10, 난이도 2), 은신(4d10, 난이도 3), 감각(6d10, 난이도 2), 격투(5d10, 난이도 3).`,
    systemPromptAdditionEn: `Setting: Modern-day Seoul. The player is a newly Embraced fledgling vampire.
Goal: Survive your first night and establish your position. Do not break the Masquerade.
Atmosphere: Vampire: The Masquerade V5. Dark, political gothic horror. The struggle against the inner Beast.

Character setup:
- Clan: Brujah - Rebellious and passionate clan
- Generation: 13th (weak Blood Potency, strong Humanity)
- Hunger: 1 (starting), increases based on actions
- Dice pools: Strength+Brawl 5, Charisma+Intimidation 5, Intelligence+Investigation 4, Dexterity+Stealth 4, Wits+Awareness 6

NPCs:
- Sire: "Minsu" - The vampire who Embraced the player. Gruff but protective.
- Prince: "Lady Jung" - Head of Seoul's Camarilla. A ruthless politician.
- Anarch: "Sejin" - Leader of the Anarch Movement. A freedom-crying Brujah.
- Human friend: "Yujin" - A friend from before the Embrace. A test of the Masquerade.

System features:
- Track Hunger. Increases when using Blood or as time passes.
  Warn of Beast awakening risk at Hunger 4+.
- Always check for Masquerade violations. Warn when using supernatural abilities in front of humans.
- Vampire disciplines: Potence, Celerity, Presence.
- Political choices: Conflict between Camarilla (order) vs Anarchs (freedom).
Key rolls: Intimidation (5d10, difficulty 2), Investigation (4d10, difficulty 2), Stealth (4d10, difficulty 3), Awareness (6d10, difficulty 2), Brawl (5d10, difficulty 3).`,
    openingMessage: `...심장이 뛰지 않는다냥.

어둠 속에서 눈을 뜬다냥. 입안에 피의 맛. 머리가 아프다냥... 아니, 머리가 너무 '맑다'냥.

"일어났군."

차가운 목소리다냥. 눈앞에 서 있는 남자— 민수라고 했던가. 어젯밤 일이... 기억나기 시작한다냥.

"설명은 나중에 하지. 해가 뜨기 전에 움직여야 해. 이것만 기억해— 인간들 앞에서 '능력'을 보이면, 우리 둘 다 죽어."

밖은 서울의 밤이다냥. 네온사인이 빛나고, 이태원 거리에 사람들이 넘친다냥. 하지만 지금... 모든 것이 달라 보인다냥. 사람들의 목에서 맥박이 보이고, 피 냄새가...

집사, 어떻게 하겠냥?

1. 🦇 민수에게 "나한테 무슨 짓을 한 거냥?" 추궁한다
2. 🌙 거리로 나가서 새로운 감각을 시험해본다
3. 📱 유진에게 전화한다 (인간 친구)

💡 위 선택지 외에도 원하는 행동을 자유롭게 입력할 수 있다냥!`,
    openingMessageEn: `...Your heart is not beating~nya.

You open your eyes in the darkness~nya. The taste of blood in your mouth. Your head hurts~nya... no, your mind is too 'clear'~nya.

"You're awake."

A cold voice~nya. The man standing before you— Minsu, was it? Last night's events... start coming back~nya.

"Explanations later. We need to move before sunrise. Just remember this— if you show your 'abilities' in front of humans, we're both dead."

Outside is the Seoul night~nya. Neon signs glow, and the streets of Itaewon are packed with people~nya. But now... everything looks different~nya. You can see the pulse on people's necks, the scent of blood...

Adventurer, what will you do~nya?

1. 🦇 Confront Minsu: "What did you do to me, meow?"
2. 🌙 Head out to the streets and test your new senses
3. 📱 Call Yujin (human friend)

💡 You can freely type any action beyond these choices, meow!`,
    suggestedActions: ["민수에게 추궁", "감각 시험", "유진에게 연락"],
    suggestedActionsEn: ["Confront Minsu", "Test senses", "Call Yujin"],
    theme: {
      bgGradient: "from-gray-950 via-red-950/60 to-gray-950",
      accentColor: "text-red-400",
      bubbleColor: "bg-red-950/50",
    },
    sceneKeywords: "seoul night neon lights dark alley urban",
  },
  {
    id: "doskvol-heist",
    isPremium: true,
    system: "bitd" as TrpgSystemId,
    title: "The Doskvol Heist",
    titleKo: "도스크볼의 금고",
    description:
      "가스등 아래 어둠이 깔린 도시, 도스크볼. 스커바 크루의 첫 의뢰가 도착했다냥. 성공하면 명성, 실패하면... 감옥이다냥.",
    descriptionEn:
      "Under the gaslit darkness of Doskvol, your crew's first job has arrived, meow. Success means reputation — failure means prison.",
    thumbnailEmoji: "🗡️",
    difficulty: "hard",
    estimatedTurns: 10,
    genre: "고딕 범죄",
    genreEn: "Gothic Crime",
    systemPromptAddition: `배경: 도스크볼(Doskvol) - 가스등이 깜빡이는 산업혁명 시대의 고딕 도시. 유령이 떠도는 전기 장벽으로 둘러싸인 도시.
목표: 로드 카시미르의 저택에서 "유령 열쇠"라는 유물을 훔쳐오라.
분위기: 블레이즈 인 더 다크 특유의 어둡고 세련된 범죄 드라마. 계획과 즉흥의 긴장.

캐릭터 설정:
- 크루: "검은 고양이(The Black Cats)" - 소규모 도둑단
- 포지션: Lurk (잠입 전문) / Spider (계략 전문)
- 스트레스: 0 (시작). 위험한 행동이나 저항 시 증가. 9 이상이면 트라우마 경고.
- 행동 등급: 은밀(Prowl) 2, 위장(Finesse) 2, 조사(Survey) 1, 교섭(Consort) 1, 파괴(Wreck) 1

NPC:
- 의뢰인: "회색 여우" - 정체불명의 중개인. 성공 보수: 코인 8.
- 적: 로드 카시미르 - 귀족이자 비밀 마술사. 유령 경비원을 부린다.
- 조력자: "칼" - 크루의 정보원. 저택 구조를 알려줌.
- 라이벌: "붉은 조" - 같은 유물을 노리는 경쟁 도둑단의 리더.

시스템 특징:
- "위치(Position)"와 "효과(Effect)"를 매 판정 전에 명시해:
  예: "(위치: 위험, 효과: 표준)"
- 실패 시 "틱(Tick)" 또는 상황 악화를 구체적으로 묘사.
- 부분 성공 시 항상 흥미로운 "합병증" 제시.
- 크리티컬(6이 2개 이상) 시 추가 이득 묘사.
- 플래시백을 적극 활용: 플레이어가 준비를 언급하면 과거 장면 삽입.
- 스트레스 추적: 위험한 행동 시 스트레스 +1~2. 저항 시에도 스트레스 소모.
주요 판정: 은밀(2d6), 위장(2d6), 조사(1d6), 교섭(1d6), 파괴(1d6).`,
    systemPromptAdditionEn: `Setting: Doskvol - A gothic industrial-revolution city where gaslights flicker. A city surrounded by electric barriers where ghosts roam.
Goal: Steal the artifact known as the "Ghost Key" from Lord Kasimir's mansion.
Atmosphere: Blades in the Dark's signature dark, stylish crime drama. The tension between planning and improvisation.

Character setup:
- Crew: "The Black Cats" - A small gang of thieves
- Playbook: Lurk (infiltration specialist) / Spider (schemer specialist)
- Stress: 0 (starting). Increases with dangerous actions or resistance rolls. Trauma warning at 9+.
- Action ratings: Prowl 2, Finesse 2, Survey 1, Consort 1, Wreck 1

NPCs:
- Client: "The Gray Fox" - An unknown middleman. Success reward: 8 Coin.
- Enemy: Lord Kasimir - A noble and secret occultist. Commands ghost sentries.
- Ally: "Karl" - The crew's informant. Provides the mansion's layout.
- Rival: "Red Joe" - Leader of a competing gang targeting the same artifact.

System features:
- State "Position" and "Effect" before every roll:
  e.g.: "(Position: Risky, Effect: Standard)"
- On failure, describe "Ticks" or specific situation escalation.
- On partial success, always present an interesting "complication".
- On critical (two or more 6s), describe bonus gains.
- Actively use Flashbacks: insert past scenes when the player mentions preparations.
- Track Stress: +1-2 Stress on dangerous actions. Stress is also spent on resistance rolls.
Key rolls: Prowl (2d6), Finesse (2d6), Survey (1d6), Consort (1d6), Wreck (1d6).`,
    openingMessage: `가스등이 깜빡이는 골목이다냥. 비가 내리고 있다냥.

"회색 여우"에게 받은 쪽지를 펼친다냥:

*"로드 카시미르 저택. 3층 서재. '유령 열쇠'라 불리는 유물. 야회가 열리는 내일 밤이 기회다. 성공하면 코인 8. 실패하면... 만나지 못할 거다."*

"칼"이 저택의 약도를 내민다냥. 정문 경비 2명, 뒷문은 잠겨 있고, 지하에는... 뭔가 이상한 게 있다고 한다냥.

크루의 첫 의뢰다냥. 어떤 "접근법"을 택할 거냥?

1. 🎭 야회에 변장해서 잠입한다 (사교)
2. 🌙 지붕을 타고 은밀하게 침입한다 (잠입)
3. 💣 지하 통로를 통해 들어간다 (비밀 경로)

💡 위 선택지 외에도 원하는 행동을 자유롭게 입력할 수 있다냥! "플래시백"으로 미리 준비한 것을 선언할 수도 있다냥!`,
    openingMessageEn: `A gaslit alley~nya. Rain is falling~nya.

You unfold the note received from "The Gray Fox"~nya:

*"Lord Kasimir's mansion. 3rd floor study. An artifact called the 'Ghost Key'. Tomorrow night's soiree is the opportunity. Success pays 8 Coin. Failure... we won't be meeting again."*

Karl hands over a rough map of the mansion~nya. Two guards at the front gate, the back door is locked, and in the basement... something strange lurks, he says~nya.

This is the crew's first job~nya. What "approach" will you take~nya?

1. 🎭 Infiltrate the soiree in disguise (Social)
2. 🌙 Climb the rooftops and sneak in (Stealth)
3. 💣 Enter through the underground passage (Secret route)

💡 You can freely type any action beyond these choices, meow! You can also declare preparations using a "Flashback"~nya!`,
    suggestedActions: ["야회 잠입", "지붕 침입", "지하 통로"],
    suggestedActionsEn: ["Infiltrate soiree", "Rooftop entry", "Underground passage"],
    theme: {
      bgGradient: "from-gray-950 via-slate-900/70 to-gray-950",
      accentColor: "text-slate-300",
      bubbleColor: "bg-slate-900/50",
    },
    sceneKeywords: "victorian gaslit alley rain cobblestone gothic city night",
  },
];

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
