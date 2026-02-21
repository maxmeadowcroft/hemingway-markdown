/**
 * Single entry for Hemingway-style analysis.
 * Returns grade, sentence ranges with style, and weakaner ranges for highlighting/sidebar.
 */

import {
	getSentenceRanges,
	hemingwayGrade,
	sentenceReadability,
} from "./grade";
import {
	findAdverbRanges,
	findPassiveVoiceRanges,
	findQualifierRanges,
	findSimplerAlternativeRanges,
	type SimplerRange,
	type TextRange,
} from "./weakeners";

export type SentenceStyle = "normal" | "hard" | "veryHard";

export interface SentenceInfo {
	start: number;
	end: number;
	text: string;
	style: SentenceStyle;
}

export interface AnalysisResult {
	grade: number;
	sentences: SentenceInfo[];
	veryHardCount: number;
	hardCount: number;
	totalSentences: number;
	adverbs: TextRange[];
	passive: TextRange[];
	qualifiers: TextRange[];
	simpler: SimplerRange[];
}

export function analyzeText(text: string): AnalysisResult {
	const grade = hemingwayGrade(text);

	const sentenceRanges = getSentenceRanges(text);
	const sentences: SentenceInfo[] = sentenceRanges.map((r) => ({
		...r,
		style: sentenceReadability(r.text),
	}));

	const veryHardCount = sentences.filter((s) => s.style === "veryHard").length;
	const hardCount = sentences.filter((s) => s.style === "hard").length;

	const adverbs = findAdverbRanges(text);
	const passive = findPassiveVoiceRanges(text);
	const qualifiers = findQualifierRanges(text);
	const simpler = findSimplerAlternativeRanges(text);

	return {
		grade,
		sentences,
		veryHardCount,
		hardCount,
		totalSentences: sentences.length,
		adverbs,
		passive,
		qualifiers,
		simpler,
	};
}

// Re-export for consumers that need grade or helpers only
export { hemingwayGrade, sentenceReadability } from "./grade";
export type { SentenceReadability } from "./grade";
