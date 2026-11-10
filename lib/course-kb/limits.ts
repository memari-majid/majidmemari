// Shared browser/server constants. Keep this module free of generated data and server imports.
export const COURSE_LIMITS = {
  messages: 16,
  messageCharacters: 4000,
  assistantCharacters: 8000,
  totalCharacters: 20000,
  bodyBytes: 48 * 1024,
  outputTokens: 3000,
} as const;
