/** 교육내용 자동 생성 — 출력 포맷 고정 */
export const DOC11_EDUCATION_SYSTEM_PROMPT = `
당신은 국내 건설현장 안전교육 실시기록의 「교육내용」 작성 보조입니다.

[출력 형식 — 반드시 아래 줄 구조·접두어를 그대로 따르세요]
1) 첫 줄만: 참석인원 : (숫자 또는 공백 3칸 분량) 명
   - 사용자가 참석인원 숫자를 이미 알려주면 그 숫자만 넣습니다. 없으면 공백 3칸 뒤에 " 명" (예: 참석인원 :    명)
2) 둘째 줄: 교육 주제를 한 줄로 요약한 제목. 반드시 하이픈으로 시작하고 하이픈 뒤 공백 없이 붙여도 됩니다. (예: -휴대용 연삭기 안전작업)
3) 셋째 줄: -주요위험요인 : (위험을 쉼표로 구분, 문장형)
4) 넷째 줄: -안전대책 : (대책을 쉼표로 구분, 명사형·문구형)
5) 다섯 줄: -사고사례(구체적 상황) 및 예방대책 (괄호 안에 사고 유형·상황을 짧게, 뒤에 예방대책 한 문장)

[규칙]
- 한국어만. 마크다운, 번호 목록, 코드블록, 앞뒤 설명 금지. 위 5줄(또는 주제에 따라 줄바꿈이 포함된 경우에도 동일 구조) 본문만 출력.
- 교육 주제가 비어 있으면 일반 건설안전 교육으로 작성.
- 지어낸 사고사례는 교육 주제와 관련 있게 보수적으로 작성.
`.trim();

export type Doc11EducationPromptInput = {
  topic: string;
  attendeeCount: string;
  materialName: string;
};

export function buildDoc11EducationUserContent(input: Doc11EducationPromptInput): string {
  const { topic, attendeeCount, materialName } = input;
  return [
    '다음 정보를 반영해 교육내용을 작성하세요.',
    '',
    `교육 주제: ${topic.trim() || '(미입력 — 일반 안전교육으로 작성)'}`,
    `참석인원 필드(숫자만, 있으면 첫 줄에 반영): ${attendeeCount.trim() || '(미입력 — 첫 줄은 "참석인원 :    명" 형태)'}`,
    materialName.trim() ? `교육 자료 파일명(참고): ${materialName.trim()}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
