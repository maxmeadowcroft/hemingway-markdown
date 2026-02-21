import { ItemView, setIcon, WorkspaceLeaf } from "obsidian";
import type HemingwayMarkdownPlugin from "../main";
import { analyzeText } from "../readability";

export const VIEW_TYPE_HEMINGWAY = "hemingway-sidebar";

export class HemingwaySidebarView extends ItemView {
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

		const container = contentEl.createDiv({ cls: "hm-sidebar-stack" });

		// 1. Very hard card
		const cardVeryHard = container.createDiv({ cls: "hm-sidebar-card" });
		cardVeryHard.style.backgroundColor = s.colorVeryHard;
		cardVeryHard.dataset.kind = "veryHard";
		const badgeVh = cardVeryHard.createDiv({ cls: "hm-sidebar-badge" });
		badgeVh.style.backgroundColor = brighten(s.colorVeryHard, 0.25);
		badgeVh.setText(String(result.veryHardCount));
		const textVh = cardVeryHard.createDiv({ cls: "hm-sidebar-text" });
		const line1Vh = result.veryHardCount === 1 && result.totalSentences === 1
			? "1 of 1 sentences is"
			: result.veryHardCount === 1
				? "1 of " + result.totalSentences + " sentences is"
				: result.veryHardCount + " of " + result.totalSentences + " sentences are";
		textVh.createEl("div", { text: line1Vh });
		textVh.createEl("div", { text: "very hard to read." });
		const iconVh = cardVeryHard.createDiv({ cls: "hm-sidebar-icon" });
		setIcon(iconVh, "eye");

		// 2. Hard card
		const cardHard = container.createDiv({ cls: "hm-sidebar-card" });
		cardHard.style.backgroundColor = s.colorHard;
		cardHard.dataset.kind = "hard";
		const badgeHard = cardHard.createDiv({ cls: "hm-sidebar-badge" });
		badgeHard.style.backgroundColor = brighten(s.colorHard, 0.25);
		badgeHard.setText(String(result.hardCount));
		const textHard = cardHard.createDiv({ cls: "hm-sidebar-text" });
		const line1Hard = result.hardCount === 1 && result.totalSentences === 1
			? "1 of 1 sentences is"
			: result.hardCount === 1
				? "1 of " + result.totalSentences + " sentences is"
				: result.hardCount + " of " + result.totalSentences + " sentences are";
		textHard.createEl("div", { text: line1Hard });
		textHard.createEl("div", { text: "hard to read." });
		const iconHard = cardHard.createDiv({ cls: "hm-sidebar-icon" });
		setIcon(iconHard, "eye");

		// 3. Weakeners card
		const cardWeak = container.createDiv({ cls: "hm-sidebar-card" });
		cardWeak.style.backgroundColor = s.colorWeakeners;
		cardWeak.dataset.kind = "weakeners";
		const badgeWeak = cardWeak.createDiv({ cls: "hm-sidebar-badge" });
		badgeWeak.style.backgroundColor = brighten(s.colorWeakeners, 0.25);
		badgeWeak.setText(String(weakenersCount));
		const textWeak = cardWeak.createDiv({ cls: "hm-sidebar-text" });
		textWeak.createEl("div", { text: weakenersCount === 1 ? "1 weakaner." : weakenersCount + " weakeners." });
		const viewDetails = textWeak.createEl("div", { cls: "hm-sidebar-view-details", text: "View details" });
		const iconWeak = cardWeak.createDiv({ cls: "hm-sidebar-icon" });
		setIcon(iconWeak, "eye");

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
				? "1 word with a simpler alternative."
				: result.simpler.length + " words with simpler alternatives.",
		});
		const iconSimp = cardSimp.createDiv({ cls: "hm-sidebar-icon" });
		setIcon(iconSimp, "eye");
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
