// Snaps an AI-provided source quote to text that actually exists in the document,
// so in-page highlighting can find it. Models often paraphrase slightly, change
// capitalization, or drop punctuation; an exact search then fails silently.

const normalize = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

const wordKey = (word: string): string => word.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

type Token = { key: string; start: number; end: number };

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const key = wordKey(m[0]);
    if (key) tokens.push({ key, start: m.index, end: m.index + m[0].length });
  }
  return tokens;
}

/** A fuzzy match must share at least this many consecutive words with the quote… */
const MIN_RUN_WORDS = 5;
/** …and cover at least this share of the quote's words. */
const MIN_RUN_SHARE = 0.5;

/**
 * Returns a substring of `document` to highlight for `source`, or undefined if
 * nothing in the document is a close enough match. A missing highlight is better
 * than one that points at the wrong clause.
 */
export function anchorSource(source: string | undefined, document: string): string | undefined {
  if (!source || source.trim().length < 8) return undefined;

  // 1. Exact match (ignoring case, quote style, and whitespace) — keep as is.
  if (normalize(document).includes(normalize(source))) return source.trim();

  // 2. Otherwise highlight the longest run of consecutive words that the quote and the
  //    document share. Runs are word-for-word, so the highlight is always real text
  //    from the clause and never spills into neighboring sentences.
  const quote = tokenize(source).map((t) => t.key);
  const doc = tokenize(document);
  if (quote.length < MIN_RUN_WORDS || doc.length === 0) return undefined;

  const positions = new Map<string, number[]>();
  doc.forEach((t, i) => {
    const list = positions.get(t.key);
    if (list) list.push(i);
    else positions.set(t.key, [i]);
  });

  let bestLen = 0;
  let bestDocStart = 0;
  for (let q = 0; q < quote.length && quote.length - q > bestLen; q++) {
    for (const d of positions.get(quote[q]) ?? []) {
      let len = 0;
      while (q + len < quote.length && d + len < doc.length && quote[q + len] === doc[d + len].key) len++;
      if (len > bestLen) {
        bestLen = len;
        bestDocStart = d;
      }
    }
  }

  if (bestLen < MIN_RUN_WORDS || bestLen / quote.length < MIN_RUN_SHARE) return undefined;
  return document.slice(doc[bestDocStart].start, doc[bestDocStart + bestLen - 1].end);
}
