import { ItemView, setIcon, WorkspaceLeaf } from "obsidian";
import type HemingwayMarkdownPlugin from "../main";
import {
	analyzeText,
	basicCounts,
	countParagraphs,
	estimateReadingTime,
	formatReadingTime,
	hemingwayGrade,
} from "../readability";

export const VIEW_TYPE_HEMINGWAY = "hemingway-sidebar";

export class HemingwaySidebarView extends ItemView {
	/** Preserve stats dropdown open state across refresh() so it doesn't auto-close. */
	private statsDropdownOpen = false;

	constructor(leaf: WorkspaceLeaf, private plugin: HemingwayMarkdownPlugin) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_HEMINGWAY;
	}

	getDisplayText(): string {
		return "Hemingway";
	}

	getIcon(): string {
		return "book-open";
	}

	refresh(): void {
		const contentEl = this.contentEl;
		// Preserve stats dropdown open state before rebuilding
		const existingDetails = contentEl.querySelector("details.hm-sidebar-details");
		if (existingDetails instanceof HTMLDetailsElement) {
			this.statsDropdownOpen = existingDetails.open;
		}
		contentEl.empty();

		const text = this.plugin.getMarkdownContentForSidebar();

		if (!text.trim()) {
			contentEl.createEl("p", {
				text: "Open a note to see readability stats.",
				cls: "hm-sidebar-empty",
			});
			return;
		}

		const result = analyzeText(text);
		const s = this.plugin.settings;
		const weakenersCount =
			result.adverbs.length + result.passive.length + result.qualifiers.length;

		const counts = basicCounts(text);
		const paragraphs = countParagraphs(text);
		const rt = estimateReadingTime(text);

		// --- Header: Grade (colored) + more space + Good/Ok/Poor (duller) ---
		const header = contentEl.createDiv({ cls: "hm-sidebar-header" });
		const target = s.targetGradeLevel;
		const okRange = s.gradeOkRange;
		let levelColor: string;
		let levelLabel: string;
		if (result.grade <= target) {
			levelColor = s.gradeColorGood;
			levelLabel = "Good.";
		} else if (result.grade <= target + okRange) {
			levelColor = s.gradeColorOk;
			levelLabel = "Ok.";
		} else {
			levelColor = s.gradeColorPoor;
			levelLabel = "Poor.";
		}
		const gradeLabel = result.grade >= 15 ? "Post-graduate" : `Grade ${result.grade}`;
		const gradeEl = header.createEl("div", { cls: "hm-sidebar-grade" });
		gradeEl.setText(gradeLabel);
		gradeEl.style.color = levelColor;
		const levelEl = header.createEl("div", { cls: "hm-sidebar-level" });
		levelEl.setText(levelLabel);

		contentEl.createEl("hr", { cls: "hm-sidebar-hr" });

		const container = contentEl.createDiv({ cls: "hm-sidebar-stack" });

		// 1. Very hard card
		const cardVeryHard = container.createDiv({ cls: "hm-sidebar-card" });
		cardVeryHard.style.backgroundColor = s.colorVeryHard;
		cardVeryHard.dataset.kind = "veryHard";
		const badgeVh = cardVeryHard.createDiv({ cls: "hm-sidebar-badge" });
		badgeVh.style.backgroundColor = brighten(s.colorVeryHard, 0.25);
		badgeVh.setText(String(result.veryHardCount));
		const textVh = cardVeryHard.createDiv({ cls: "hm-sidebar-text" });
		const fullVh = result.veryHardCount === 1
			? "of " + result.totalSentences + " sentences is very hard to read."
			: "of " + result.totalSentences + " sentences are very hard to read.";
		textVh.createEl("div", { cls: "hm-sidebar-text-line", text: fullVh });

		// 2. Hard card
		const cardHard = container.createDiv({ cls: "hm-sidebar-card" });
		cardHard.style.backgroundColor = s.colorHard;
		cardHard.dataset.kind = "hard";
		const badgeHard = cardHard.createDiv({ cls: "hm-sidebar-badge" });
		badgeHard.style.backgroundColor = brighten(s.colorHard, 0.25);
		badgeHard.setText(String(result.hardCount));
		const textHard = cardHard.createDiv({ cls: "hm-sidebar-text" });
		const fullHard = result.hardCount === 1
			? "of " + result.totalSentences + " sentences is hard to read."
			: "of " + result.totalSentences + " sentences are hard to read.";
		textHard.createEl("div", { cls: "hm-sidebar-text-line", text: fullHard });

		// 3. Weakeners card
		const cardWeak = container.createDiv({ cls: "hm-sidebar-card" });
		cardWeak.style.backgroundColor = s.colorWeakeners;
		cardWeak.dataset.kind = "weakeners";
		const badgeWeak = cardWeak.createDiv({ cls: "hm-sidebar-badge" });
		badgeWeak.style.backgroundColor = brighten(s.colorWeakeners, 0.25);
		badgeWeak.setText(String(weakenersCount));
		const textWeak = cardWeak.createDiv({ cls: "hm-sidebar-text" });
		textWeak.createEl("div", { text: weakenersCount === 1 ? "weakaner." : "weakeners." });

		// 4. Simpler alternatives card
		const cardSimp = container.createDiv({ cls: "hm-sidebar-card" });
		cardSimp.style.backgroundColor = s.colorSimplerAlternatives;
		cardSimp.dataset.kind = "simpler";
		const badgeSimp = cardSimp.createDiv({ cls: "hm-sidebar-badge" });
		badgeSimp.style.backgroundColor = brighten(s.colorSimplerAlternatives, 0.25);
		badgeSimp.setText(String(result.simpler.length));
		const textSimp = cardSimp.createDiv({ cls: "hm-sidebar-text" });
		textSimp.createEl("div", {
			text: result.simpler.length === 1
				? "word with a simpler alternative."
				: "words with simpler alternatives.",
		});

		contentEl.createEl("hr", { cls: "hm-sidebar-hr" });

		// --- Words (same size as Grade) + Show more stats row (clickable, under the 4 blocks) ---
		const wordsSection = contentEl.createDiv({ cls: "hm-sidebar-words-section" });
		const wordsLine = wordsSection.createEl("div", { cls: "hm-sidebar-words-line" });
		wordsLine.setText("Words: " + counts.words.toLocaleString());

		const details = contentEl.createEl("details", { cls: "hm-sidebar-details" });
		details.open = this.statsDropdownOpen;
		const summary = details.createEl("summary", { cls: "hm-sidebar-details-summary" });
		const summaryLabel = summary.createSpan({ cls: "hm-sidebar-details-summary-text" });
		const summaryChevron = summary.createSpan({ cls: "hm-sidebar-details-chevron" });
		const updateSummary = () => {
			this.statsDropdownOpen = details.open;
			summaryLabel.setText(details.open ? "Show fewer stats " : "Show more stats ");
			summaryChevron.setText(details.open ? "\u25B2" : "\u25BC"); // solid ▲ / ▼
		};
		updateSummary();

		const statsTable = details.createDiv({ cls: "hm-sidebar-stats" });
		const statRows: [string, string][] = [
			["Letters:", counts.letters.toLocaleString()],
			["Characters:", text.length.toLocaleString()],
			["Words:", counts.words.toLocaleString()],
			["Sentences:", result.totalSentences.toLocaleString()],
			["Paragraphs:", paragraphs.toLocaleString()],
			["Reading time:", formatReadingTime(rt)],
		];
		for (const [label, value] of statRows) {
			const row = statsTable.createDiv({ cls: "hm-sidebar-stat-row" });
			row.createEl("span", { cls: "hm-sidebar-stat-label", text: label });
			row.createEl("span", { cls: "hm-sidebar-stat-value", text: value });
		}

		details.addEventListener("toggle", () => updateSummary());
	}

	async onOpen(): Promise<void> {
		this.refresh();
	}

	async onClose(): Promise<void> {
		// no-op
	}
}

/** Lighten a hex color by a factor (0–1). */
function brighten(hex: string, factor: number): string {
	hex = hex.replace(/^#/, "");
	const r = Math.min(255, parseInt(hex.slice(0, 2), 16) + 255 * factor);
	const g = Math.min(255, parseInt(hex.slice(2, 4), 16) + 255 * factor);
	const b = Math.min(255, parseInt(hex.slice(4, 6), 16) + 255 * factor);
	return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}
