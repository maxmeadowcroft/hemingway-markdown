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
 * Split text into sentences. We count (1) each segment ending in . ! ? and
 * (2) each non-empty line that doesn't end with . ! ? (so separate lines are sentences too).
 * Never merge across newlines.
 */
export function splitSentences(text: string): string[] {
	return getSentenceRanges(text).map((r) => r.text);
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
 * Per line: if the line contains . ! ?, split by those into segments (each segment = one sentence).
 * If the line has no . ! ?, the whole line is one sentence. We never span newlines.
 */
export function getSentenceRanges(
	text: string
): { start: number; end: number; text: string }[] {
	const ranges: { start: number; end: number; text: string }[] = [];
	let lineStart = 0;
	for (let i = 0; i <= text.length; i++) {
		if (i === text.length || text[i] === "\n") {
			const lineContent = text.slice(lineStart, i);
			const trimmed = lineContent.trim();
			if (trimmed.length > 0) {
				// Find segments ending in . ! ? within this line
				const re = /[^.!?]*[.!?]/g;
				let match: RegExpExecArray | null;
				let foundAny = false;
				while ((match = re.exec(lineContent)) !== null) {
					foundAny = true;
					const segStart = lineStart + match.index;
					const segEnd = lineStart + match.index + match[0].length;
					ranges.push({ start: segStart, end: segEnd, text: match[0].trim() });
				}
				// If no .!? on this line, the whole line is one sentence
				if (!foundAny) {
					ranges.push({
						start: lineStart,
						end: i,
						text: trimmed,
					});
				}
			}
			lineStart = i + 1;
		}
	}
	return ranges;
}

/** Count paragraphs (blocks separated by blank lines). */
export function countParagraphs(text: string): number {
	const blocks = text.trim().split(/\n\s*\n/).filter(Boolean);
	return blocks.length;
}

/** Estimated reading time at given words per minute (default 200 WPM). Uses same word count as basicCounts. */
export function estimateReadingTime(
	text: string,
	wordsPerMinute = 200
): { words: number; hours: number; minutes: number; seconds: number } {
	const { words } = basicCounts(text);
	const totalMinutes = words / wordsPerMinute;
	const totalSeconds = Math.round(totalMinutes * 60);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	return { words, hours, minutes, seconds };
}

/** Format reading time as "0h 0m 44s". */
export function formatReadingTime(
	rt: { hours: number; minutes: number; seconds: number }
): string {
	return `${rt.hours}h ${rt.minutes}m ${rt.seconds}s`;
}
