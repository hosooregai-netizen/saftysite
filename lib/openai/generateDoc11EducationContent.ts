import type { Doc11EducationPromptInput } from '@/lib/openai/doc11EducationPrompt';

export function buildLocalDoc11EducationContent(
  input: Doc11EducationPromptInput,
): string {
  const topic = input.topic.trim() || '안전교육';
  const count = input.attendeeCount.trim();
  const firstLine = count ? `참석인원 : ${count} 명` : '참석인원 :    명';

  return [
    firstLine,
    `-${topic}`,
    '-주요위험요인 : 추락, 충돌, 협착 등 작업 특성에 따른 위험요인 확인',
    '-안전대책: 작업 전 위험성평가, 보호구 착용, 작업구간 출입통제',
    '-사고사례(유사 작업 중 발생 가능한 사고 유형) 및 예방대책(사전 점검과 교육 강화)',
  ].join('\n');
}
