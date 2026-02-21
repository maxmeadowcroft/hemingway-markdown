import { Range } from "@codemirror/state";
import {
	Decoration,
	DecorationSet,
	EditorView,
	ViewPlugin,
	ViewUpdate,
} from "@codemirror/view";
import type { MyPluginSettings } from "./settings";
import { analyzeText } from "./readability";

function buildDecorations(
	view: EditorView,
	getSettings: () => MyPluginSettings
): DecorationSet {
	const text = view.state.doc.toString();
	const result = analyzeText(text);
	const settings = getSettings();

	const ranges: Range<Decoration>[] = [];

	const markVeryHard = Decoration.mark({
		attributes: {
			style: `background-color: ${settings.colorVeryHard}; border-radius: 2px`,
		},
	});
	const markHard = Decoration.mark({
		attributes: {
			style: `background-color: ${settings.colorHard}; border-radius: 2px`,
		},
	});
	const markWeakeners = Decoration.mark({
		attributes: {
			style: `background-color: ${settings.colorWeakeners}; border-radius: 2px`,
		},
	});
	const markSimpler = Decoration.mark({
		attributes: {
			style: `background-color: ${settings.colorSimplerAlternatives}; border-radius: 2px`,
		},
	});

	if (settings.highlightVeryHard) {
		for (const s of result.sentences) {
			if (s.style === "veryHard") {
				ranges.push(markVeryHard.range(s.start, s.end));
			}
		}
	}

	if (settings.highlightHard) {
		for (const s of result.sentences) {
			if (s.style === "hard") {
				ranges.push(markHard.range(s.start, s.end));
			}
		}
	}

	if (settings.highlightWeakeners) {
		for (const r of result.adverbs) {
			ranges.push(markWeakeners.range(r.start, r.end));
		}
		for (const r of result.passive) {
			ranges.push(markWeakeners.range(r.start, r.end));
		}
		for (const r of result.qualifiers) {
			ranges.push(markWeakeners.range(r.start, r.end));
		}
	}

	if (settings.highlightSimplerAlternatives) {
		for (const r of result.simpler) {
			ranges.push(markSimpler.range(r.start, r.end));
		}
	}

	// CodeMirror requires ranges sorted by `from` (and startSide)
	ranges.sort((a, b) => a.from - b.from);

	return Decoration.set(ranges);
}

/**
 * Returns a CodeMirror extension that highlights Hemingway issues.
 * Uses getSettings() so changes in the settings tab apply on next doc/viewport update.
 */
export function createHemingwayHighlightExtension(
	getSettings: () => MyPluginSettings
): import("@codemirror/state").Extension[] {
	const viewPlugin = ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;

			constructor(view: EditorView) {
				this.decorations = buildDecorations(view, getSettings);
			}

			update(update: ViewUpdate) {
				if (update.docChanged || update.viewportChanged) {
					this.decorations = buildDecorations(update.view, getSettings);
				}
			}
		},
		{
			decorations: (v) => v.decorations,
		}
	);

	return [viewPlugin];
}
