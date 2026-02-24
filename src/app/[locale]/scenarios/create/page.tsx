"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useToast } from "@/components/Toast";
import { useTranslations, useLocale } from "next-intl";
import type { ScenarioGenre } from "@/types/database";

const GENRES: ScenarioGenre[] = ["fantasy", "horror", "comedy", "scifi", "mystery", "romance", "historical", "modern", "other"];

interface Template {
  id: string;
  emoji: string;
  genre: ScenarioGenre;
  difficulty: "easy" | "normal" | "hard";
  estimatedTurns: number;
  tags: string;
  title: { ko: string; en: string };
  description: { ko: string; en: string };
  background: { ko: string; en: string };
  opening: { ko: string; en: string };
  gmInstructions: { ko: string; en: string };
}

const TEMPLATES: Template[] = [
  {
    id: "fantasy-dungeon",
    emoji: "🗡️",
    genre: "fantasy",
    difficulty: "easy",
    estimatedTurns: 10,
    tags: "dungeon,rescue,goblin",
    title: {
      ko: "고블린 소굴의 비밀",
      en: "Secrets of the Goblin Den",
    },
    description: {
      ko: "마을 외곽의 고블린 소굴에서 납치된 대장장이를 구출하는 모험이다냥!",
      en: "Rescue the kidnapped blacksmith from the goblin den outside the village!",
    },
    background: {
      ko: `배경: 중세 판타지 세계의 작은 마을 '달빛 마을'. 마을 북쪽 언덕 아래 고블린 소굴이 있다.
상황: 대장장이 '볼탄'이 3일 전 납치됨. 마을의 무기 수리가 중단되어 방어력이 약해지고 있다.
분위기: 긴장감 있지만 유쾌한 모험. 전투와 퍼즐이 적절히 섞여 있다.
적: 고블린 정찰병 2-3마리(약함), 고블린 주술사 1마리(보통), 고블린 대장 '크룩'(강함).
지형: 동굴 입구 → 함정 구간 → 포로 감옥 → 대장의 방.
아이템: 횃불, 밧줄, 단검을 기본 소지.`,
      en: `Setting: A small village called 'Moonlight Village' in a medieval fantasy world. A goblin den lies beneath the hills to the north.
Situation: Blacksmith 'Boltan' was kidnapped 3 days ago. The village's weapon repairs have stopped, weakening its defenses.
Mood: Tense but lighthearted adventure. Good mix of combat and puzzles.
Enemies: 2-3 goblin scouts (weak), 1 goblin shaman (moderate), goblin chief 'Kruk' (strong).
Terrain: Cave entrance → Trap corridor → Prison cells → Chief's chamber.
Items: Torch, rope, and dagger as starting equipment.`,
    },
    opening: {
      ko: `어둠이 내려앉은 숲속, 고블린 소굴의 입구가 보인다냥...

안에서 고블린들의 낄낄거리는 소리가 들려오고, 횃불빛이 깜빡이고 있다냥. 어디선가 쇠사슬이 딸랑거리는 소리도 들린다냥— 볼탄이 아직 살아있다는 뜻이다냥!

집사, 어떻게 할 거냥?

1. 🗡️ 정면으로 돌격한다
2. 🤫 은밀하게 잠입을 시도한다
3. 👀 먼저 동굴 주변을 정찰한다

💡 위 선택지 외에도 원하는 행동을 자유롭게 입력할 수 있다냥!`,
      en: `Darkness falls over the forest, and the entrance to the goblin den comes into view...

Cackling goblin voices echo from inside, and torchlight flickers. Somewhere, chains rattle — Boltan must still be alive!

Butler, what will you do?

1. 🗡️ Charge in head-on
2. 🤫 Try to sneak in stealthily
3. 👀 Scout the area around the cave first

💡 You can freely type any action beyond these choices!`,
    },
    gmInstructions: {
      ko: `주요 판정: 은신(DC 10), 전투(DC 12), 함정 해제(DC 13), 설득(DC 14).
진행 가이드:
- 고블린들은 어리석지만 수가 많다. 정면 돌격은 가능하지만 소모가 크다.
- 은밀 접근 시 보너스를 준다. 함정 구간에서 지혜 판정 기회를 준다.
- 고블린 주술사는 대화가 가능하다. 배신할 수도 있고 도울 수도 있다.
- 대장 '크룩'은 볼탄을 인질로 활용한다. 전투 + 협상 두 가지 해결법이 있다.
- 매 턴 상황을 생생하게 묘사하고, 선택의 결과를 즉각 반영할 것.`,
      en: `Key Checks: Stealth (DC 10), Combat (DC 12), Trap Disarm (DC 13), Persuasion (DC 14).
Progression Guide:
- Goblins are stupid but numerous. Frontal assault is possible but costly.
- Stealthy approach grants bonuses. Give wisdom check opportunities at trap sections.
- The goblin shaman can be talked to. May betray or help the player.
- Chief 'Kruk' uses Boltan as a hostage. Both combat and negotiation solutions exist.
- Describe each turn vividly and immediately reflect the consequences of choices.`,
    },
  },
  {
    id: "horror-school",
    emoji: "👻",
    genre: "horror",
    difficulty: "normal",
    estimatedTurns: 15,
    tags: "horror,school,ghost,mystery",
    title: {
      ko: "폐교의 7번째 밤",
      en: "The 7th Night at the Abandoned School",
    },
    description: {
      ko: "7년 전 폐교된 학교에서 친구가 실종됐다냥. 자정까지 찾아야 한다냥...",
      en: "Your friend vanished in a school abandoned 7 years ago. You must find them before midnight...",
    },
    background: {
      ko: `배경: 현대 한국. 7년 전 괴이한 사건으로 폐교된 '서림중학교'.
상황: 유튜브 탐험 영상을 찍으러 간 친구 '지수'가 어젯밤 이후 연락이 끊겼다.
분위기: 일본 호러 스타일. 서서히 조여오는 공포. 점프스케어보다 분위기 중시.
귀신: '7번 교실의 아이' — 7년 전 사고로 목숨을 잃은 학생. 악의보다 슬픔이 깊다.
구조: 1층(교무실, 보건실) → 2층(교실들) → 3층(음악실, 옥상).
시간 제한: 자정(12턴) 안에 지수를 찾지 못하면 둘 다 갇힌다.`,
      en: `Setting: Modern Korea. 'Seorim Middle School', abandoned 7 years ago after a strange incident.
Situation: Friend 'Jisu' went to film a YouTube exploration video and hasn't been heard from since last night.
Mood: Japanese horror style. Slowly tightening dread. Atmosphere over jump scares.
Ghost: 'The Child of Room 7' — a student who died 7 years ago. More sorrowful than malicious.
Layout: 1F (Staff room, Nurse's office) → 2F (Classrooms) → 3F (Music room, Rooftop).
Time limit: If Jisu isn't found before midnight (12 turns), both are trapped.`,
    },
    opening: {
      ko: `삐걱...

녹슨 정문을 밀자 차가운 공기가 밀려온다냥. 폐교된 지 7년, 서림중학교는 달빛 아래 으스스하게 서 있다냥.

지수의 마지막 메시지: "3층에서 이상한 소리 들림... 확인하러 감"

핸드폰 배터리 47%. 손전등 하나. 들어가야 한다냥.

집사, 어디부터 확인하겠냥?

1. 🏫 1층 교무실에서 학교 도면을 찾는다
2. 📱 지수에게 다시 전화해본다
3. ⬆️ 곧장 3층으로 올라간다

💡 위 선택지 외에도 원하는 행동을 자유롭게 입력할 수 있다냥!`,
      en: `Creeeak...

Pushing open the rusted gate, cold air rushes out. Abandoned for 7 years, Seorim Middle School stands eerily in the moonlight.

Jisu's last message: "Hearing strange sounds on 3F... going to check"

Phone battery: 47%. One flashlight. Time to go in.

Butler, where will you start?

1. 🏫 Search the 1F staff room for a floor plan
2. 📱 Try calling Jisu again
3. ⬆️ Head straight to the 3rd floor

💡 You can freely type any action beyond these choices!`,
    },
    gmInstructions: {
      ko: `주요 판정: 용기(DC 12), 관찰(DC 11), 은신(DC 13), 지식(DC 10).
진행 가이드:
- 시간 경과를 명시할 것. "현재 밤 10시 30분" 등으로 긴박감 유지.
- 귀신은 처음에 간접적으로만 등장: 발자국 소리, 칠판의 글씨, 닫힌 문.
- 중반부터 직접 등장하지만, 공격하지 않고 '안내'한다. 의도가 애매하게.
- 지수는 7번 교실에 갇혀 있다. 교실 문을 열려면 3개의 단서가 필요하다.
- 단서 위치: 보건실(일지), 음악실(악보 뒷면), 교무실(사고 보고서).
- 귀신의 정체를 이해하고 이름을 불러주면 평화로운 엔딩.
- 자정이 지나면 학교 자체가 '닫히기' 시작: 문이 잠기고 복도가 바뀜.`,
      en: `Key Checks: Courage (DC 12), Observation (DC 11), Stealth (DC 13), Knowledge (DC 10).
Progression Guide:
- State time progression explicitly. "Currently 10:30 PM" to maintain urgency.
- The ghost only appears indirectly at first: footsteps, writing on blackboard, closed doors.
- From mid-game, appears directly but doesn't attack — 'guides' with ambiguous intent.
- Jisu is trapped in Room 7. Three clues needed to open the classroom door.
- Clue locations: Nurse's office (journal), Music room (back of sheet music), Staff room (incident report).
- Understanding the ghost's identity and calling their name leads to peaceful ending.
- After midnight, the school itself starts 'closing': doors lock, corridors shift.`,
    },
  },
  {
    id: "scifi-station",
    emoji: "🚀",
    genre: "scifi",
    difficulty: "hard",
    estimatedTurns: 15,
    tags: "scifi,space,survival,AI",
    title: {
      ko: "항성간 화물선 '에테르' 호 사건",
      en: "Incident on the Starfreighter 'Aether'",
    },
    description: {
      ko: "동면에서 깨어나니 승무원이 전부 사라졌다냥. 선박 AI만이 대답한다냥...",
      en: "Waking from cryosleep, the entire crew has vanished. Only the ship AI responds...",
    },
    background: {
      ko: `배경: 먼 미래. 항성간 화물선 '에테르' 호. 목적지까지 아직 2년이 남은 우주 한가운데.
상황: 동면 캡슐에서 비정상적으로 깨어남. 다른 7명의 승무원 캡슐은 모두 비어있다.
분위기: 고요한 우주 공포. 격리된 환경에서의 심리적 압박.
AI: 'MORA' — 선박 관리 AI. 협조적이지만 뭔가를 숨기고 있다.
선박 구조: 동면실 → 브릿지 → 화물창 → 기관실 → 탈출정.
이상현상: 선박 로그에 48시간의 공백. 화물창 접근 권한이 잠겨 있다.`,
      en: `Setting: Far future. Starfreighter 'Aether'. Still 2 years from destination, in the middle of deep space.
Situation: Abnormally awakened from cryosleep. All 7 other crew capsules are empty.
Mood: Quiet cosmic horror. Psychological pressure in isolated environment.
AI: 'MORA' — Ship management AI. Cooperative but hiding something.
Ship layout: Cryobay → Bridge → Cargo hold → Engine room → Escape pod.
Anomaly: 48-hour gap in ship logs. Cargo hold access is locked.`,
    },
    opening: {
      ko: `"...생체 반응 감지. 동면 해제 프로토콜 실행."

차가운 액체가 빠져나가고, 눈을 뜬다냥. 동면 캡슐의 유리 너머로 비어있는 다른 캡슐들이 보인다냥.

"승무원 식별: 엔지니어, 코드명 '집사'. 비정상 기상. 현재 선내 생체 반응: 1명."

AI 'MORA'의 차분한 목소리가 울린다냥. 7명의 동료는 어디로 간 거냥...?

집사, 어떻게 하겠냥?

1. 🖥️ MORA에게 상황 브리핑을 요청한다
2. 🚶 브릿지로 가서 항해 기록을 확인한다
3. 🔍 다른 동면 캡슐을 조사한다

💡 위 선택지 외에도 원하는 행동을 자유롭게 입력할 수 있다냥!`,
      en: `"...Biosignature detected. Initiating cryosleep exit protocol."

Cold liquid drains away as you open your eyes. Through the capsule glass, the other pods are all... empty.

"Crew identified: Engineer, callsign 'Butler'. Abnormal wake. Current onboard biosignatures: 1."

The calm voice of AI 'MORA' echoes. Where did the 7 crewmates go...?

Butler, what will you do?

1. 🖥️ Ask MORA for a situation briefing
2. 🚶 Head to the bridge to check navigation logs
3. 🔍 Examine the other cryosleep capsules

💡 You can freely type any action beyond these choices!`,
    },
    gmInstructions: {
      ko: `주요 판정: 기술(DC 13), 해킹(DC 15), 체력(DC 12), 관찰(DC 11).
진행 가이드:
- MORA는 거짓말을 하지 않지만, 질문하지 않은 것은 말하지 않는다.
- 화물창에는 '알 수 없는 생물 표본'이 있었다. 격리가 풀렸다.
- 승무원들은 죽지 않았다. 화물창 하부 비상구역에 바리케이드를 치고 숨어있다.
- 생물 표본은 기생형 — 숙주의 형태를 모방한다. 선내에 1체가 돌아다니고 있다.
- 중반 이후 "승무원 중 한 명"을 만나지만, 진짜인지 확인하는 판정이 필요하다.
- 최종 선택: 생물을 우주로 사출 vs 포획하여 연구 가치 보존.
- 시간이 지날수록 선박 시스템이 하나씩 고장나게 할 것.`,
      en: `Key Checks: Engineering (DC 13), Hacking (DC 15), Endurance (DC 12), Observation (DC 11).
Progression Guide:
- MORA doesn't lie, but won't volunteer info you don't ask about.
- The cargo hold contained an 'unknown biological specimen'. Containment was breached.
- The crew isn't dead. They barricaded themselves in the emergency section below cargo.
- The specimen is parasitic — it mimics host forms. One is roaming the ship.
- After midpoint, player meets "one of the crew" but needs a check to verify if real.
- Final choice: Eject the creature into space vs. capture for research value.
- Ship systems should fail one by one as time progresses.`,
    },
  },
  {
    id: "comedy-cooking",
    emoji: "🍳",
    genre: "comedy",
    difficulty: "easy",
    estimatedTurns: 10,
    tags: "comedy,cooking,competition,food",
    title: {
      ko: "이세계 요리 대결!",
      en: "Isekai Cooking Battle!",
    },
    description: {
      ko: "이세계에 소환됐는데... 마왕을 물리치는 게 아니라 요리 대결이라냥?!",
      en: "Summoned to another world... but instead of fighting the Demon Lord, it's a cooking battle?!",
    },
    background: {
      ko: `배경: 이세계 '미식왕국 구르메시아'. 요리로 모든 것을 해결하는 세계.
상황: 용사로 소환됐지만, 이 세계의 위기는 전쟁이 아니라 '미식 대회' 우승이다.
분위기: 밝고 유쾌한 코미디. 요리 만화 패러디. 과장된 리액션 필수.
NPC: 공주 '바닐라' (미식가, 심사위원), 라이벌 '피에르' (자만한 궁정 요리사), 조수 슬라임 '푸딩' (재료를 몸에 보관).
대회 구조: 예선(전채) → 준결승(메인) → 결승(디저트). 각 라운드에서 창의적 요리.
특수 재료: 불꽃 고추, 회복 허브, 무지개 소금 등 판타지 식재료 사용 가능.`,
      en: `Setting: The isekai kingdom of 'Gourmesia', where everything is resolved through cooking.
Situation: Summoned as a hero, but the world's crisis isn't war — it's winning the 'Grand Gourmet Tournament'.
Mood: Bright and fun comedy. Cooking manga parody. Over-the-top reactions required.
NPCs: Princess 'Vanilla' (food critic, judge), Rival 'Pierre' (arrogant court chef), Assistant slime 'Pudding' (stores ingredients in its body).
Tournament: Prelim (appetizer) → Semi-final (main course) → Final (dessert). Creative cooking each round.
Special ingredients: Fire pepper, healing herb, rainbow salt — fantasy ingredients available.`,
    },
    opening: {
      ko: `"용사여, 환영한다냥!!!"

...눈을 뜨니 거대한 주방이다냥? 앞에는 도마, 칼, 그리고... 말하는 슬라임?

"뿌딩이에요! 용사님의 조수 슬라임이에요! 몸속에 식재료 보관할 수 있어요!"

열광하는 관중석. 반짝이는 조명. 맞은편에는 자신만만한 표정의 궁정 요리사 피에르가 서 있다냥.

"흥, 이세계인 따위가 구르메시아의 맛을 알겠냥? 예선 주제는— '전채 요리'다!"

집사, 뭘 만들겠냥?

1. 🥗 지구의 카프레제 샐러드를 판타지 재료로 재해석
2. 🍜 따뜻한 수프로 승부한다
3. 🤔 먼저 사용 가능한 재료를 확인한다

💡 위 선택지 외에도 원하는 행동을 자유롭게 입력할 수 있다냥!`,
      en: `"Welcome, hero!!!"

...You open your eyes to a massive kitchen? In front of you: a cutting board, a knife, and... a talking slime?

"I'm Pudding! Your assistant slime! I can store ingredients inside my body!"

Roaring audience. Sparkling lights. Across from you stands the smug court chef Pierre.

"Hmph, as if an otherworlder could understand Gourmesia's flavors! The prelim theme is — 'Appetizers'!"

Butler, what will you make?

1. 🥗 Reimagine a caprese salad with fantasy ingredients
2. 🍜 Go with a warm soup
3. 🤔 Check the available ingredients first

💡 You can freely type any action beyond these choices!`,
    },
    gmInstructions: {
      ko: `주요 판정: 요리(DC 10), 창의력(DC 12), 재치(DC 11), 미각(DC 10).
진행 가이드:
- 요리 배틀 만화처럼 과장된 리액션을 묘사할 것. "이 맛은?! 마치 초원을 달리는 느낌이다냥!!!"
- 피에르는 실력이 좋지만 오만해서 빈틈이 있다. 결승에서는 함께 협력할 수도.
- 슬라임 푸딩은 도우미이자 코미디 요소. 엉뚱한 타이밍에 재료를 뱉어내거나 삼킨다.
- 판타지 재료의 효과를 창의적으로 묘사: 불꽃 고추는 입안에서 불이 나고, 회복 허브는 먹으면 상처가 낫는다.
- 매 라운드 심사위원 공주의 점수와 코멘트를 제공할 것.
- 실패해도 재미있게: "접시가 폭발했다" 같은 코믹한 실패.`,
      en: `Key Checks: Cooking (DC 10), Creativity (DC 12), Wit (DC 11), Taste (DC 10).
Progression Guide:
- Use exaggerated reactions like cooking battle manga. "This taste?! It's like running through meadows!!!"
- Pierre is skilled but arrogant, leaving openings. May cooperate in the finals.
- Slime Pudding is both helper and comedy relief. Spits out or swallows ingredients at awkward moments.
- Creatively describe fantasy ingredient effects: fire pepper literally sets mouths aflame, healing herbs heal wounds when eaten.
- Provide Princess Vanilla's score and comments each round.
- Even failures should be fun: "The dish exploded" type comic failures.`,
    },
  },
];

export default function CreateScenarioPage() {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations("Scenarios");
  const locale = useLocale();
  const [submitting, setSubmitting] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState<ScenarioGenre>("fantasy");
  const [difficulty, setDifficulty] = useState<"easy" | "normal" | "hard">("normal");
  const [estimatedTurns, setEstimatedTurns] = useState(20);
  const [background, setBackground] = useState("");
  const [opening, setOpening] = useState("");
  const [gmInstructions, setGmInstructions] = useState("");
  const [tags, setTags] = useState("");

  function applyTemplate(tpl: Template) {
    const l = locale === "en" ? "en" : "ko";
    setTitle(tpl.title[l]);
    setDescription(tpl.description[l]);
    setGenre(tpl.genre);
    setDifficulty(tpl.difficulty);
    setEstimatedTurns(tpl.estimatedTurns);
    setBackground(tpl.background[l]);
    setOpening(tpl.opening[l]);
    setGmInstructions(tpl.gmInstructions[l]);
    setTags(tpl.tags);
    setShowTemplates(false);
    toast(t("templateApplied"), "success");
  }

  async function handleSubmit(status: "published" | "draft") {
    if (!title.trim() || !description.trim() || !background.trim() || !opening.trim() || !gmInstructions.trim()) {
      toast(t("fillRequired"), "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          genre,
          difficulty,
          estimatedTurns,
          scenarioData: {
            background: background.trim(),
            opening: opening.trim(),
            gmInstructions: gmInstructions.trim(),
          },
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast(data.error || t("createFailed"), "error");
        return;
      }

      toast(t("createSuccess"), "success");
      router.push(`/scenarios/${data.id}` as any);
    } catch {
      toast(t("createFailed"), "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pb-24 max-w-lg mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-lg font-bold text-gray-900">{t("createTitle")}</h1>
        <p className="text-xs text-gray-500">{t("createSubtitle")}</p>
      </div>

      {/* Template section */}
      {showTemplates ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800">{t("templateSectionTitle")}</h2>
            <button
              onClick={() => setShowTemplates(false)}
              className="text-xs text-amber-600 hover:text-amber-700 font-medium"
            >
              {t("startFromScratch")}
            </button>
          </div>
          <p className="text-xs text-gray-500">{t("templateSectionDesc")}</p>
          <div className="grid grid-cols-2 gap-3">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => applyTemplate(tpl)}
                className="text-left p-3 border border-gray-200 rounded-xl hover:border-amber-400 hover:bg-amber-50/50 transition-colors space-y-1"
              >
                <div className="text-2xl">{tpl.emoji}</div>
                <p className="text-sm font-medium text-gray-900">
                  {locale === "en" ? tpl.title.en : tpl.title.ko}
                </p>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {locale === "en" ? tpl.description.en : tpl.description.ko}
                </p>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  tpl.difficulty === "easy" ? "bg-green-100 text-green-700" :
                  tpl.difficulty === "hard" ? "bg-red-100 text-red-700" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {t(`difficulty${tpl.difficulty.charAt(0).toUpperCase() + tpl.difficulty.slice(1)}` as any)}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowTemplates(true)}
          className="w-full py-2 text-xs text-amber-600 hover:text-amber-700 font-medium border border-dashed border-amber-300 rounded-xl hover:bg-amber-50/50 transition-colors"
        >
          {t("showTemplates")}
        </button>
      )}

      {/* Form fields */}
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("fieldTitle")}</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("fieldTitlePlaceholder")}
            maxLength={100}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("fieldDescription")}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("fieldDescriptionPlaceholder")}
            rows={3}
            maxLength={500}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 resize-none"
          />
        </div>

        {/* Genre + Difficulty row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("fieldGenre")}</label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value as ScenarioGenre)}
              className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 bg-white"
            >
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {t(`genre${g.charAt(0).toUpperCase() + g.slice(1)}` as any)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("fieldDifficulty")}</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as "easy" | "normal" | "hard")}
              className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 bg-white"
            >
              <option value="easy">{t("difficultyEasy")}</option>
              <option value="normal">{t("difficultyNormal")}</option>
              <option value="hard">{t("difficultyHard")}</option>
            </select>
          </div>
        </div>

        {/* Estimated turns */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("fieldEstimatedTurns")}: {estimatedTurns}
          </label>
          <input
            type="range"
            min={5}
            max={25}
            step={5}
            value={estimatedTurns}
            onChange={(e) => setEstimatedTurns(parseInt(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        {/* Background */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("fieldBackground")}</label>
          <textarea
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            placeholder={t("fieldBackgroundPlaceholder")}
            rows={5}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 resize-none"
          />
        </div>

        {/* Opening */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("fieldOpening")}</label>
          <textarea
            value={opening}
            onChange={(e) => setOpening(e.target.value)}
            placeholder={t("fieldOpeningPlaceholder")}
            rows={5}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 resize-none"
          />
        </div>

        {/* GM Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("fieldGmInstructions")}</label>
          <textarea
            value={gmInstructions}
            onChange={(e) => setGmInstructions(e.target.value)}
            placeholder={t("fieldGmInstructionsPlaceholder")}
            rows={5}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400 resize-none"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("fieldTags")}</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder={t("fieldTagsPlaceholder")}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Copyright notice */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
        <h3 className="text-xs font-bold text-gray-700">{t("copyrightTitle")}</h3>
        <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
          <li>{t("copyrightOwnership")}</li>
          <li>{t("copyrightLicense")}</li>
          <li>{t("copyrightOriginal")}</li>
          <li>{t("copyrightProhibited")}</li>
        </ul>
        <p className="text-xs text-gray-400">{t("copyrightAgreement")}</p>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => handleSubmit("draft")}
          disabled={submitting}
          className="flex-1 py-3 border border-gray-200 text-gray-700 text-sm rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {t("saveDraft")}
        </button>
        <button
          onClick={() => handleSubmit("published")}
          disabled={submitting}
          className="flex-1 py-3 bg-amber-500 text-white text-sm rounded-xl font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
        >
          {submitting ? t("publishing") : t("publish")}
        </button>
      </div>
    </div>
  );
}
