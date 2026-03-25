import {
  clampDoc5SummaryText,
  normalizeDoc5SummaryOutput,
  buildDoc5SummaryUserContent,
  DOC5_SUMMARY_SYSTEM_PROMPT,
  type Doc5SummaryPromptInput,
} from '@/lib/openai/doc5SummaryPrompt';
import { openAiComplete } from '@/lib/openai/browserClient';

const MAX_SUMMARY_CHARS = 500;

export async function generateDoc5SummaryWithOpenAi(input: Doc5SummaryPromptInput): Promise<string> {
  const userContent = buildDoc5SummaryUserContent(input);
  const raw = await openAiComplete(userContent, {
    systemPrompt: DOC5_SUMMARY_SYSTEM_PROMPT,
    temperature: 0.3,
    maxTokens: 900,
  });
  return clampDoc5SummaryText(normalizeDoc5SummaryOutput(raw), MAX_SUMMARY_CHARS);
}

export { MAX_SUMMARY_CHARS };
