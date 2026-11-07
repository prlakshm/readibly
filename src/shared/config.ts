export const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
export const CLAUDE_MODEL = 'claude-opus-4-6' as const;


// Send the entire document to Claude. Haiku's 200k-token context fits ~600k characters,
// so this cap only guards against pathological pages, not real agreements.
export const MAX_DOCUMENT_CHARS = 400_000;

// Scale the number of summary cards with document length (~1 card per 1,000 words),
// so a short policy gets a few cards and a long agreement isn't squeezed into the same count.
export function cardRangeFor(text: string): { min: number; max: number } {
  const words = text.split(/\s+/).filter(Boolean).length;
  const max = Math.min(20, Math.max(4, Math.ceil(words / 700)));
  const min = Math.min(max, Math.max(2, Math.floor(words / 1200)));
  return { min, max };
}
