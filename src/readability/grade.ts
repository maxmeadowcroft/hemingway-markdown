/**
 * Hemingway grade (ARI) and sentence-level readability.
 * Reusable for status bar, highlighting, and sidebar.
 */

export type SentenceReadability = "normal" | "hard" | "veryHard";

export function basicCounts(
	text: string
): { letters: number; words: number; sentences: number } {
	const letters = (text.match(/[A-Za-z]/g) ?? []).length;

	const wordMatches = text
		.trim()
		.match(/[A-Za-z0-9]+(?:['\-][A-Za-z0-9]+)*/g);
	const words = wordMatches?.length ?? 0;

	const sentenceChunks = splitSentences(text);
	const sentences = sentenceChunks.length;

	return { letters, words, sentences };
}

/**
 * Split text into sentences. In markdown we treat each non-empty line as one sentence;
 * we never merge across newlines, so multiple lines are not counted as a single sentence.
 */
export function splitSentences(text: string): string[] {
	return text
		.split(/\n/g)
		.map((s) => s.trim())
		.filter(Boolean);
}

export function countWords(text: string): number {
	const m = text.match(/[A-Za-z0-9]+(?:['\-][A-Za-z0-9]+)*/g);
	return m?.length ?? 0;
}

/**
 * Hemingway grade is ARI rounded to nearest integer, clamped at 0.
 * ARI = 4.71*(letters/words) + 0.5*(words/sentences) - 21.43
 */
export function hemingwayGrade(text: string): number {
	const { letters, words, sentences } = basicCounts(text);
	if (words === 0 || sentences === 0) return 0;

	const ari =
		4.71 * (letters / words) +
		0.5 * (words / sentences) -
		21.43;

	return Math.max(0, Math.round(ari));
}

/**
 * Sentence classification: <14 words => normal; else by sentence ARI (10/14 thresholds).
 */
export function sentenceReadability(sentence: string): SentenceReadability {
	const w = countWords(sentence);
	if (w < 14) return "normal";

	const { letters, words } = basicCounts(sentence);
	if (words === 0) return "normal";

	const ari = Math.round(
		4.71 * (letters / words) + 0.5 * (words / 1) - 21.43
	);
	const level = Math.max(0, ari);

	if (level >= 14) return "veryHard";
	if (level >= 10) return "hard";
	return "normal";
}

/**
 * Returns sentence ranges in the original text (start, end).
 * Each non-empty line is one sentence; we never span newlines (markdown line = sentence unit).
 */
export function getSentenceRanges(
	text: string
): { start: number; end: number; text: string }[] {
	const ranges: { start: number; end: number; text: string }[] = [];
	let start = 0;
	for (let i = 0; i <= text.length; i++) {
		if (i === text.length || text[i] === "\n") {
			const line = text.slice(start, i);
			const trimmed = line.trim();
			if (trimmed.length > 0) {
				ranges.push({ start, end: i, text: trimmed });
			}
			start = i + 1;
		}
	}
	return ranges;
}
