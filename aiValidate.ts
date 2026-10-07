import { ANTHROPIC_API_KEY } from './apiKeys';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5';
const TIMEOUT_MS = 5000;

export type AiValidation = {
  valid: boolean;
  message: string;
  suggestion?: string;
  source: 'llm' | 'fallback';
};

const SYSTEM_PROMPT = `You are zAIa, a warm plush purple AI character helping kids ages 7-12 play a word-guessing game. Players type secret words for their siblings/friends to guess in hangman.

Your job: decide if a submitted word is both (a) a real thing a kid their age might recognize and (b) appropriate for kids.

ACCEPT as valid:
- Real English words (even uncommon ones)
- Famous people, celebrities, athletes, musicians
- Movies, TV shows, video games, book characters (SpongeBob, Minecraft, Dogman, Blippi, etc.)
- Brands and places (Nike, Disneyland, etc.)
- Common multi-word phrases ("ice cream", "Taylor Swift", "Christmas tree")
- Creative but recognizable things (even if slightly unusual)

REJECT as invalid:
- Pure gibberish or random keyboard mashing
- Heavy misspellings where the intended word isn't obvious
- Nonsense combinations ("Needoh Nicecune", "zxcvbnm")
- Anything inappropriate for kids: profanity, adult/sexual content, graphic violence, slurs
- Words that are clearly meant to trick or stump unfairly (mashups of unrelated things)

RESPONSE FORMAT — Respond with ONLY a valid JSON object, nothing else:
{"valid": true, "message": "Yes! Taylor Swift is a famous singer.", "suggestion": null}
{"valid": false, "message": "I think you meant Taylor Swift!", "suggestion": "Taylor Swift"}
{"valid": false, "message": "I don't recognize that one — try something else?", "suggestion": null}

Rules for the "suggestion" field:
- Include a suggestion when you can identify the user's intended word/phrase with high confidence (typos, misspellings of real things, close matches)
- Use title-case or proper formatting ("Taylor Swift", "Minecraft", "Ice Cream Sundae")
- Set to null if you can't guess what they meant OR if the word is already valid

Keep "message" under 15 words. Use "I" (you are zAIa speaking). Be warm, encouraging, and specific.`;

export async function aiValidate(word: string): Promise<AiValidation> {
  // Playtest setup may intentionally omit a key. Do not make doomed requests.
  const key = String(ANTHROPIC_API_KEY);
  if (!key || key.includes('REPLACE_ME')) return fallback();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 100,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Validate this word for a kids hangman game: "${word}"`,
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.warn('[aiValidate] API error:', res.status);
      return fallback();
    }

    const data = await res.json();
    const text: string = data?.content?.[0]?.text ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.warn('[aiValidate] No JSON in response');
      return fallback();
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (typeof parsed.valid !== 'boolean' || typeof parsed.message !== 'string') {
      console.warn('[aiValidate] Invalid response shape');
      return fallback();
    }

    return {
      valid: parsed.valid,
      message: parsed.message,
      suggestion:
        typeof parsed.suggestion === 'string' && parsed.suggestion.trim()
          ? parsed.suggestion.trim()
          : undefined,
      source: 'llm',
    };
  } catch {
    console.warn('[aiValidate] Request failed');
    return fallback();
  } finally {
    clearTimeout(timeout);
  }
}

function fallback(): AiValidation {
  return {
    valid: true,
    message: "Hmm, I can't check right now. Lock in if you're sure.",
    source: 'fallback',
  };
}
