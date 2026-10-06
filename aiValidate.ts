// Cloud validation is disabled until a backend can protect credentials,
// enforce rate limits, and support parental consent. Never import device keys.
// The caller still applies local format and profanity checks.
export type AiValidation = {
  valid: boolean;
  message: string;
  suggestion?: string;
  source: 'llm' | 'fallback';
};

export async function aiValidate(_word: string): Promise<AiValidation> {
  return {
    valid: true,
    message: "I can't check this word online. Lock in if you're sure.",
    source: 'fallback',
  };
}
