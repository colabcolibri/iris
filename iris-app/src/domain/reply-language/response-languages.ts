export type ResponseLanguageOption = {
  code: string;
  label: string;
  llmLabel: string;
};

export const DEFAULT_RESPONSE_LANGUAGE = "pt-BR";

export const RESPONSE_LANGUAGE_OPTIONS: ResponseLanguageOption[] = [
  { code: "pt-BR", label: "Português (Brasil)", llmLabel: "Brazilian Portuguese" },
  { code: "pt-PT", label: "Português (Portugal)", llmLabel: "European Portuguese" },
  { code: "en-US", label: "English (US)", llmLabel: "American English" },
  { code: "en-GB", label: "English (UK)", llmLabel: "British English" },
  { code: "es", label: "Español", llmLabel: "Spanish" },
  { code: "es-MX", label: "Español (México)", llmLabel: "Mexican Spanish" },
  { code: "fr", label: "Français", llmLabel: "French" },
  { code: "de", label: "Deutsch", llmLabel: "German" },
  { code: "it", label: "Italiano", llmLabel: "Italian" },
  { code: "nl", label: "Nederlands", llmLabel: "Dutch" },
  { code: "ja", label: "日本語", llmLabel: "Japanese" },
  { code: "ko", label: "한국어", llmLabel: "Korean" },
  { code: "zh-CN", label: "中文 (简体)", llmLabel: "Simplified Chinese" },
  { code: "ar", label: "العربية", llmLabel: "Arabic" },
  { code: "ru", label: "Русский", llmLabel: "Russian" },
];

const BY_CODE = new Map(RESPONSE_LANGUAGE_OPTIONS.map((option) => [option.code, option]));

export function isSupportedResponseLanguage(code: string): boolean {
  return BY_CODE.has(code);
}

export function resolveResponseLanguage(code: string | null | undefined): ResponseLanguageOption {
  if (code && BY_CODE.has(code)) {
    return BY_CODE.get(code)!;
  }
  return BY_CODE.get(DEFAULT_RESPONSE_LANGUAGE)!;
}
