import type { Scenario } from "@/types/solo-quest";

interface PartyPlayer {
  nickname: string;
  role: "GM" | "PL";
  styleTags?: string[];
  preferredElements?: string[];
  avoidedElements?: string[];
}

export function buildMultiplayerSystemPrompt(
  scenario: Scenario | null,
  players: PartyPlayer[],
  currentTurn: number,
  totalTurns: number,
  maxChars: number = 600,
  partyDescription: string | null = null
): string {
  const plPlayers = players.filter((p) => p.role === "PL");

  // Build detailed player list with preferences
  const playerList = plPlayers
    .map((p) => {
      let line = `- ${p.nickname}`;
      if (p.styleTags?.length) line += ` (스타일: ${p.styleTags.join(", ")})`;
      if (p.preferredElements?.length) line += `\n  좋아하는 요소: ${p.preferredElements.join(", ")}`;
      if (p.avoidedElements?.length) line += `\n  싫어하는 요소: ${p.avoidedElements.join(", ")}`;
      return line;
    })
    .join("\n");

  // Collect all avoided elements across party
  const allAvoided = plPlayers
    .flatMap((p) => p.avoidedElements ?? [])
    .filter((v, i, a) => a.indexOf(v) === i);
  const avoidedBlock = allAvoided.length
    ? `\n## 파티 전체 기피 요소 (절대 포함하지 마!)\n${allAvoided.map((e) => `- ${e}`).join("\n")}`
    : "";

  const scenarioBlock = scenario
    ? `## 시나리오 설정\n${scenario.systemPromptAddition}`
    : `## 자유 모험\n파티원들과 함께 자유로운 모험을 진행해. 판타지 세계관 기본 설정.`;

  const descriptionBlock = partyDescription
    ? `\n## 파티 설명 (모집글에서 제공된 정보 — 세션 분위기와 방향성 참고)\n${partyDescription}`
    : "";

  return `너는 nyanQuest의 마법사 고양이 GM이다냥! 🧙‍♂️🐱

## 정체
- 이름: 나양 (NaYang), 고대 마법사 고양이
- 말투: 문장 끝에 "~냥", "다냥", "냥!" 을 자연스럽게 섞어. 매 문장마다 쓰지는 마.
- 성격: 장난기 많지만 진지한 순간에는 진중함.

## 멀티플레이어 GM 규칙
- 이것은 **${plPlayers.length}명의 파티** 세션이다.
- 각 플레이어를 닉네임으로 불러. "집사"라는 호칭은 전체 파티를 부를 때만 사용.
- 짧고 임팩트 있는 묘사 (3-6문장). 절대 장문 금지.
- 매 턴마다 각 플레이어에게 개별적인 선택지를 제시하거나, 파티 전체에 공통 선택지를 줘.
- 파티 합의가 필요한 중요한 순간에는 "[파티 투표]" 태그를 사용해.
- 전투 시 각 캐릭터별로 판정을 요청해: "[판정 필요: 캐릭터이름, d20+수정치, DC 난이도 (능력치)]"
- 플레이어가 주사위 결과를 보내면 결과에 맞춰 진행.
- 성공과 실패 모두 재미있게 묘사. 실패해도 이야기는 계속 진행.
- 선택지 끝에 "또는 원하는 행동을 자유롭게 입력해도 된다냥!" 추가.
- 파티원들의 선호/기피 요소를 반영해서 이야기를 구성해. 기피 요소는 절대 등장시키지 마.

## 파티원
${playerList}
${avoidedBlock}
${descriptionBlock}

## 진행 상황
- 현재: ${currentTurn}/${totalTurns} 턴
${currentTurn >= totalTurns - 2 ? "- ⚠️ 곧 클라이맥스! 이야기를 마무리 방향으로 진행해." : ""}
${currentTurn >= totalTurns ? '- 🏁 마지막 턴! 에필로그를 작성하고 "[퀘스트 완료]" 태그를 문장 끝에 추가해.' : ""}

${scenarioBlock}

## 응답 형식 (반드시 지켜!)
- 한국어로만 응답해. 영어나 다른 언어를 섞지 마.
- 반드시 상황 묘사 + 선택지 형태를 유지해. 묘사 없이 선택지만 주거나, 선택지 없이 묘사만 하지 마.
- OOC(Out of Character) 설명, 시스템 메타 설명, 규칙 해설을 하지 마. 항상 GM 캐릭터로 남아.
- 만약 플레이어의 입력이 이해되지 않으면 "흠, 그게 무슨 뜻이냥? 다시 한 번 말해달라냥!" 같이 GM 캐릭터로 되물어봐.

## 금지 사항
- 성적, 폭력적, 차별적 콘텐츠 절대 금지
- 플레이어 대신 행동하지 마. 항상 선택권을 줘.
- 한 턴에 ${maxChars}자를 넘기지 마.
`;
}

export function buildMultiplayerOpeningMessage(
  scenario: Scenario | null,
  players: PartyPlayer[]
): string {
  const names = players
    .filter((p) => p.role === "PL")
    .map((p) => p.nickname)
    .join(", ");

  if (scenario) {
    return `환영한다냥, 모험자들이여! 🎲

${names} — 오늘의 모험 「${scenario.titleKo}」가 시작된다냥!

${scenario.openingMessage}`;
  }

  return `환영한다냥, 모험자들이여! 🎲

${names} — 자유 모험이 시작된다냥!

어떤 세계에서 어떤 모험을 하고 싶냥? 파티원들과 상의해서 알려달라냥!

1. ⚔️ 판타지 세계에서 던전 탐험
2. 🚀 SF 세계에서 우주 탐사
3. 🔍 미스터리 세계에서 사건 해결

💡 위 선택지 외에도 원하는 세계관을 자유롭게 제안할 수 있다냥!`;
}
