export {
  openAiChat,
  openAiComplete,
  resolveOpenAiApiKey,
  type OpenAiChatMessage,
  type OpenAiChatOptions,
  type OpenAiChatRole,
} from '@/lib/openai/browserClient';
export { DEFAULT_OPENAI_CHAT_MODEL, OPENAI_CHAT_COMPLETIONS_URL } from '@/lib/openai/constants';
export {
  buildDoc5SummaryUserContent,
  clampDoc5SummaryText,
  normalizeDoc5SummaryOutput,
  DOC5_SUMMARY_SYSTEM_PROMPT,
  type Doc5SummaryPromptInput,
} from '@/lib/openai/doc5SummaryPrompt';
export { buildLocalDoc5SummaryDraft } from '@/lib/openai/doc5SummaryLocalDraft';
export { generateDoc5SummaryWithOpenAi, MAX_SUMMARY_CHARS } from '@/lib/openai/generateDoc5Summary';
export {
  buildDoc11EducationUserContent,
  DOC11_EDUCATION_SYSTEM_PROMPT,
  type Doc11EducationPromptInput,
} from '@/lib/openai/doc11EducationPrompt';
export {
  buildLocalDoc11EducationContent,
  generateDoc11EducationContentWithOpenAi,
} from '@/lib/openai/generateDoc11EducationContent';

