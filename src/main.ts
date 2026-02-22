import { MarkdownView, Plugin } from "obsidian";
import { DEFAULT_SETTINGS, HemingwaySettingTab, MyPluginSettings } from "./settings";
import {
	createHemingwayHighlightExtension,
	refreshHighlightsEffect,
} from "./wordHighlight";
import {
	basicCounts,
	countParagraphs,
	estimateReadingTime,
	formatReadingTime,
	hemingwayGrade,
} from "./readability";
import { HemingwaySidebarView, VIEW_TYPE_HEMINGWAY } from "./sidebar/HemingwaySidebarView";
import { WelcomeModal } from "./WelcomeModal";

export default class HemingwayMarkdownPlugin extends Plugin {
	settings: MyPluginSettings;
	private statusBarItemEl: HTMLElement | null = null;
	/** Extra status bar items (letters, sentences, paragraphs, reading time) when showExtraStatsInStatusBar is on. */
	private extraStatusBarEls: HTMLElement[] = [];
	/** Last leaf that had a MarkdownView, so sidebar still has content when sidebar is focused. */
	private lastMarkdownLeaf: MarkdownView | null = null;

	async onload() {
		await this.loadSettings();

		this.registerView(
			VIEW_TYPE_HEMINGWAY,
			(leaf) => new HemingwaySidebarView(leaf, this)
		);

		this.registerEditorExtension(
			createHemingwayHighlightExtension(() => this.settings)
		);

		this.statusBarItemEl = this.addStatusBarItem();
		this.updateReadabilityGrade();

		// Track last markdown view so sidebar and status bar work when sidebar (or another pane) is focused
		this.lastMarkdownLeaf = this.app.workspace.getActiveViewOfType(MarkdownView) ?? null;
		this.registerEvent(
			this.app.workspace.on("active-leaf-change", () => {
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) this.lastMarkdownLeaf = markdownView;
				this.updateReadabilityGrade();
				this.refreshHemingwaySidebar();
			})
		);
		this.registerInterval(
			window.setInterval(() => {
				this.updateReadabilityGrade();
				this.refreshHemingwaySidebar();
			}, 2000)
		);

		this.addCommand({
			id: "open-hemingway-sidebar",
			name: "Open Hemingway sidebar",
			callback: () => this.activateHemingwaySidebar(),
		});

		this.addSettingTab(new HemingwaySettingTab(this.app, this));

		if (this.settings.sidebarOpenByDefault) {
			this.activateHemingwaySidebar();
		}

		// First-time welcome popup (once per install)
		if (!this.settings.hasSeenWelcomePopup) {
			window.setTimeout(() => {
				const modal = new WelcomeModal(this.app, () => {
					this.settings.hasSeenWelcomePopup = true;
					this.saveSettings();
				});
				modal.open();
			}, 500);
		}
	}

	onunload() {
		this.removeExtraStatusBarItems();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) as Partial<MyPluginSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	/** Content of the last focused markdown editor (so sidebar works when it has focus). */
	getMarkdownContentForSidebar(): string {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView) ?? this.lastMarkdownLeaf;
		return view?.editor?.getValue() ?? "";
	}

	/** Update status bar with Hemingway grade; optionally show extra stats as separate items. */
	updateReadabilityGrade(): void {
		if (!this.statusBarItemEl) return;
		const text = this.getMarkdownContentForSidebar();

		if (!this.settings.showExtraStatsInStatusBar) {
			this.removeExtraStatusBarItems();
			if (!this.settings.showGradeInStatusBar) {
				this.statusBarItemEl.setText("");
				this.statusBarItemEl.style.display = "none";
				return;
			}
			this.statusBarItemEl.style.display = "";
			if (!text.trim()) {
				this.statusBarItemEl.setText("Grade —");
				return;
			}
			const grade = hemingwayGrade(text);
			const target = this.settings.targetGradeLevel;
			const okRange = this.settings.gradeOkRange;
			let color: string;
			if (grade <= target) color = this.settings.gradeColorGood;
			else if (grade <= target + okRange) color = this.settings.gradeColorOk;
			else color = this.settings.gradeColorPoor;
			this.statusBarItemEl.style.color = color;
			this.statusBarItemEl.setText(
				grade >= 15 ? "Post-graduate" : `Grade ${grade}`
			);
			return;
		}

		// Extra stats on: ensure we have 4 separate status bar items
		if (this.extraStatusBarEls.length === 0) {
			for (let i = 0; i < 4; i++) {
				this.extraStatusBarEls.push(this.addStatusBarItem());
			}
		}

		if (!text.trim()) {
			if (this.settings.showGradeInStatusBar) {
				this.statusBarItemEl.style.display = "";
				this.statusBarItemEl.setText("—");
			} else {
				this.statusBarItemEl.style.display = "none";
				this.statusBarItemEl.setText("");
			}
			this.extraStatusBarEls.forEach((el) => el.setText("—"));
			return;
		}

		const counts = basicCounts(text);
		const paragraphs = countParagraphs(text);
		const rt = estimateReadingTime(text);

		if (this.settings.showGradeInStatusBar) {
			const grade = hemingwayGrade(text);
			const target = this.settings.targetGradeLevel;
			const okRange = this.settings.gradeOkRange;
			let color: string;
			if (grade <= target) color = this.settings.gradeColorGood;
			else if (grade <= target + okRange) color = this.settings.gradeColorOk;
			else color = this.settings.gradeColorPoor;
			const gradeLabel = grade >= 15 ? "Post-graduate" : `Grade ${grade}`;
			this.statusBarItemEl.style.display = "";
			this.statusBarItemEl.style.color = color;
			this.statusBarItemEl.setText(gradeLabel);
		} else {
			this.statusBarItemEl.style.display = "none";
			this.statusBarItemEl.setText("");
		}

		const [lettersEl, sentencesEl, paragraphsEl, readingEl] = this.extraStatusBarEls;
		lettersEl?.setText(counts.letters.toLocaleString() + " letters");
		sentencesEl?.setText(
			counts.sentences.toLocaleString() + " sentences"
		);
		paragraphsEl?.setText(
			paragraphs.toLocaleString() + " paragraphs"
		);
		readingEl?.setText(formatReadingTime(rt) + " read");
	}

	private removeExtraStatusBarItems(): void {
		this.extraStatusBarEls.forEach((el) => el.remove());
		this.extraStatusBarEls = [];
	}

	/** Call after settings change so highlights and sidebar update without reopening the file. */
	refreshAfterSettingsChange(): void {
		this.refreshHemingwaySidebar();
		this.updateReadabilityGrade();
		// Force highlight decorations to recompute via CodeMirror effect
		const view = this.app.workspace.getActiveViewOfType(MarkdownView) ?? this.lastMarkdownLeaf;
		if (view?.editor) {
			try {
				const editor = view.editor as unknown as {
					cm?: { dispatch: (tr: { effects: unknown[] }) => void };
				};
				const cm = editor?.cm;
				if (cm?.dispatch) {
					cm.dispatch({ effects: [refreshHighlightsEffect.of(undefined)] });
				}
			} catch {
				// ignore
			}
		}
	}

	private refreshHemingwaySidebar(): void {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_HEMINGWAY);
		for (const leaf of leaves) {
			const view = leaf.view;
			if (view instanceof HemingwaySidebarView) {
				view.refresh();
			}
		}
	}

	private async activateHemingwaySidebar(): Promise<void> {
		const { workspace } = this.app;
		let leaf = workspace.getLeavesOfType(VIEW_TYPE_HEMINGWAY)[0];
		if (!leaf) {
			await workspace.getRightLeaf(true)?.setViewState({
				type: VIEW_TYPE_HEMINGWAY,
			});
			leaf = workspace.getLeavesOfType(VIEW_TYPE_HEMINGWAY)[0];
		}
		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}
}
