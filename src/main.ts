import { MarkdownView, Plugin } from "obsidian";
import { DEFAULT_SETTINGS, HemingwaySettingTab, MyPluginSettings } from "./settings";
import { createHemingwayHighlightExtension } from "./wordHighlight";
import { hemingwayGrade } from "./readability";
import { HemingwaySidebarView, VIEW_TYPE_HEMINGWAY } from "./sidebar/HemingwaySidebarView";

export default class HemingwayMarkdownPlugin extends Plugin {
	settings: MyPluginSettings;
	private statusBarItemEl: HTMLElement | null = null;
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
	}

	onunload() {}

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

	/** Update status bar with Hemingway grade; grade >= 15 shows "Post-graduate". Color from settings (good/ok/poor). */
	updateReadabilityGrade(): void {
		if (!this.statusBarItemEl) return;
		const text = this.getMarkdownContentForSidebar();
		if (!text.trim()) {
			this.statusBarItemEl.setText("Grade —");
			return;
		}
		const grade = hemingwayGrade(text);
		const display =
			grade >= 15 ? "Post-graduate" : `Grade ${grade}`;
		this.statusBarItemEl.setText(display);

		const target = this.settings.targetGradeLevel;
		const okRange = this.settings.gradeOkRange;
		let color: string;
		if (grade <= target) {
			color = this.settings.gradeColorGood;
		} else if (grade <= target + okRange) {
			color = this.settings.gradeColorOk;
		} else {
			color = this.settings.gradeColorPoor;
		}
		this.statusBarItemEl.style.color = color;
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
