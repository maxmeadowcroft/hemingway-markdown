/**
 * Weakeners: adverbs, passive voice, qualifiers, and words with simpler alternatives.
 * All functions return character ranges (start, end) in the source text for highlighting.
 */

import { QUALIFIERS } from "./qualifiers";
import { SIMPLER_ALTERNATIVES } from "./simplerAlternatives";

function escapeRegExp(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface TextRange {
	start: number;
	end: number;
	word?: string;
}

export interface SimplerRange extends TextRange {
	word: string;
	suggestion: string;
}

export function findAdverbRanges(text: string): TextRange[] {
	const ranges: TextRange[] = [];
	const re = /\b[a-z]+ly\b/gi;
	let match: RegExpExecArray | null;
	while ((match = re.exec(text)) !== null) {
		ranges.push({
			start: match.index,
			end: match.index + match[0].length,
			word: match[0],
		});
	}
	return ranges;
}

export function findPassiveVoiceRanges(text: string): TextRange[] {
	const ranges: TextRange[] = [];
	const re =
		/\b(am|is|are|was|were|be|been|being)\b\s+(?:\b\w+ly\b\s+)?\b(\w+(?:ed|en|wn|lt|pt|nt))\b/gi;
	let match: RegExpExecArray | null;
	while ((match = re.exec(text)) !== null) {
		ranges.push({
			start: match.index,
			end: match.index + match[0].length,
			word: match[0].replace(/\s+/g, " ").trim(),
		});
	}
	return ranges;
}

export function findQualifierRanges(text: string): TextRange[] {
	const ranges: TextRange[] = [];
	const lowered = text.toLowerCase();
	for (const q of QUALIFIERS) {
		const re = new RegExp(`\\b${escapeRegExp(q)}\\b`, "g");
		let match: RegExpExecArray | null;
		while ((match = re.exec(lowered)) !== null) {
			ranges.push({
				start: match.index,
				end: match.index + match[0].length,
				word: match[0],
			});
		}
	}
	return ranges;
}

export function findSimplerAlternativeRanges(text: string): SimplerRange[] {
	const ranges: SimplerRange[] = [];
	const re = /\b[a-z]+(?:'[a-z]+)?\b/gi;
	let match: RegExpExecArray | null;
	while ((match = re.exec(text)) !== null) {
		const word = match[0].toLowerCase();
		const suggestion = SIMPLER_ALTERNATIVES[word];
		if (suggestion) {
			ranges.push({
				start: match.index,
				end: match.index + match[0].length,
				word: match[0],
				suggestion,
			});
		}
	}
	return ranges;
}
