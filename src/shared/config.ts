export const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
export const CLAUDE_MODEL = 'claude-opus-4-6' as const;


// Send the entire document to Claude. Haiku's 200k-token context fits ~600k characters,
// so this cap only guards against pathological pages, not real agreements.
export const MAX_DOCUMENT_CHARS = 400_000;
