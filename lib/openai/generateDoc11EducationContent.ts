import { openAiComplete } from '@/lib/openai/browserClient';
import {
  buildDoc11EducationUserContent,
  DOC11_EDUCATION_SYSTEM_PROMPT,
  type Doc11EducationPromptInput,
} from '@/lib/openai/doc11EducationPrompt';

export async function generateDoc11EducationContentWithOpenAi(input: Doc11EducationPromptInput): Promise<string> {
  const userContent = buildDoc11EducationUserContent(input);
  const raw = await openAiComplete(userContent, {
    systemPrompt: DOC11_EDUCATION_SYSTEM_PROMPT,
    temperature: 0.35,
    maxTokens: 1200,
  });
  return raw.replace(/\r\n/g, '\n').trim();
}

/** API 키 없을 때 최소 포맷 맞춘 초안 */
export function buildLocalDoc11EducationContent(input: Doc11EducationPromptInput): string {
  const topic = input.topic.trim() || '안전교육';
  const count = input.attendeeCount.trim();
  const firstLine = count ? `참석인원 : ${count} 명` : `참석인원 :    명`;
  return [
    firstLine,
    `-${topic}`,
    '-주요위험요인 : 추락·낙하·협착 등 해당 작업에서 흔한 위험(교육 주제에 맞게 수정하세요)',
    '-안전대책 : 작업 전 점검, 보호구 착용, 작업절차 준수',
    '-사고사례(유사 작업 중 발생 가능한 사고 유형) 및 예방대책(현장 점검·교육 강화)',
  ].join('\n');
}
