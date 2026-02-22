import { App, PluginSettingTab, Setting } from "obsidian";
import HemingwayMarkdownPlugin from "./main";

export interface MyPluginSettings {
	mySetting: string;
	// Highlight toggles
	highlightVeryHard: boolean;
	highlightHard: boolean;
	highlightWeakeners: boolean;
	highlightSimplerAlternatives: boolean;
	// Highlight colors (hex)
	colorVeryHard: string;
	colorHard: string;
	colorWeakeners: string;
	colorSimplerAlternatives: string;
	// Grade level
	targetGradeLevel: number;
	gradeOkRange: number;
	gradeColorGood: string;
	gradeColorOk: string;
	gradeColorPoor: string;
	// Sidebar
	sidebarOpenByDefault: boolean;
	// Status bar
	showGradeInStatusBar: boolean;
	showExtraStatsInStatusBar: boolean;
	// CTA: show welcome popup only once
	hasSeenWelcomePopup: boolean;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: "default",
	highlightVeryHard: true,
	highlightHard: true,
	highlightWeakeners: true,
	highlightSimplerAlternatives: true,
	colorVeryHard: "#9A1B1B",
	colorHard: "#A16107",
	colorWeakeners: "#065985",
	colorSimplerAlternatives: "#5B21B6",
	targetGradeLevel: 8,
	gradeOkRange: 4,
	gradeColorGood: "#27ae60",
	gradeColorOk: "#f39c12",
	gradeColorPoor: "#e74c3c",
	sidebarOpenByDefault: true,
	showGradeInStatusBar: true,
	showExtraStatsInStatusBar: false,
	hasSeenWelcomePopup: false,
};

export class HemingwaySettingTab extends PluginSettingTab {
	plugin: HemingwayMarkdownPlugin;

	constructor(app: App, plugin: HemingwayMarkdownPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		// Community CTA banner (top of settings)
		const cta = containerEl.createDiv({ cls: "hemingway-settings-cta" });
		cta.createEl("p", { cls: "hemingway-settings-cta__title", text: "Free community for devs who write" });
		cta.createEl("p", {
			cls: "hemingway-settings-cta__desc",
			text: "Get post templates, writing feedback, and build alongside Python devs who ship.",
		});
		const link = cta.createEl("a", { href: "https://skool.com/coder", text: "Join free at skool.com/coder →" });
		link.setAttr("target", "_blank");
		link.setAttr("rel", "noopener");

		// --- Highlighting ---
		containerEl.createEl("h2", { text: "Highlighting" });

		let colorVeryHardPicker: { setValue: (v: string) => void } | null = null;
		new Setting(containerEl)
			.setName("Very hard to read sentences")
			.setDesc("Highlight sentences that are very hard to read (red by default).")
			.addToggle((t) =>
				t
					.setValue(this.plugin.settings.highlightVeryHard)
					.onChange(async (v) => {
						this.plugin.settings.highlightVeryHard = v;
						await this.plugin.saveSettings();
						this.plugin.refreshAfterSettingsChange();
					})
			)
			.addColorPicker((c) => {
				colorVeryHardPicker = c;
				c.setValue(this.plugin.settings.colorVeryHard).onChange(async (v) => {
					this.plugin.settings.colorVeryHard = v;
					await this.plugin.saveSettings();
					this.plugin.refreshAfterSettingsChange();
				});
			})
			.addButton((b) =>
				b.setButtonText("Reset").onClick(async () => {
					this.plugin.settings.colorVeryHard = DEFAULT_SETTINGS.colorVeryHard;
					await this.plugin.saveSettings();
					colorVeryHardPicker?.setValue(DEFAULT_SETTINGS.colorVeryHard);
					this.plugin.refreshAfterSettingsChange();
				})
			);

		let colorHardPicker: { setValue: (v: string) => void } | null = null;
		new Setting(containerEl)
			.setName("Hard to read sentences")
			.setDesc("Highlight sentences that are hard to read (yellow by default).")
			.addToggle((t) =>
				t
					.setValue(this.plugin.settings.highlightHard)
					.onChange(async (v) => {
						this.plugin.settings.highlightHard = v;
						await this.plugin.saveSettings();
						this.plugin.refreshAfterSettingsChange();
					})
			)
			.addColorPicker((c) => {
				colorHardPicker = c;
				c.setValue(this.plugin.settings.colorHard).onChange(async (v) => {
					this.plugin.settings.colorHard = v;
					await this.plugin.saveSettings();
					this.plugin.refreshAfterSettingsChange();
				});
			})
			.addButton((b) =>
				b.setButtonText("Reset").onClick(async () => {
					this.plugin.settings.colorHard = DEFAULT_SETTINGS.colorHard;
					await this.plugin.saveSettings();
					colorHardPicker?.setValue(DEFAULT_SETTINGS.colorHard);
					this.plugin.refreshAfterSettingsChange();
				})
			);

		let colorWeakenersPicker: { setValue: (v: string) => void } | null = null;
		new Setting(containerEl)
			.setName("Weakeners")
			.setDesc("Highlight adverbs, passive voice, and qualifiers (blue by default).")
			.addToggle((t) =>
				t
					.setValue(this.plugin.settings.highlightWeakeners)
					.onChange(async (v) => {
						this.plugin.settings.highlightWeakeners = v;
						await this.plugin.saveSettings();
						this.plugin.refreshAfterSettingsChange();
					})
			)
			.addColorPicker((c) => {
				colorWeakenersPicker = c;
				c.setValue(this.plugin.settings.colorWeakeners).onChange(async (v) => {
					this.plugin.settings.colorWeakeners = v;
					await this.plugin.saveSettings();
					this.plugin.refreshAfterSettingsChange();
				});
			})
			.addButton((b) =>
				b.setButtonText("Reset").onClick(async () => {
					this.plugin.settings.colorWeakeners = DEFAULT_SETTINGS.colorWeakeners;
					await this.plugin.saveSettings();
					colorWeakenersPicker?.setValue(DEFAULT_SETTINGS.colorWeakeners);
					this.plugin.refreshAfterSettingsChange();
				})
			);

		let colorSimplerPicker: { setValue: (v: string) => void } | null = null;
		new Setting(containerEl)
			.setName("Words with simpler alternatives")
			.setDesc("Highlight words that have simpler alternatives (purple by default).")
			.addToggle((t) =>
				t
					.setValue(this.plugin.settings.highlightSimplerAlternatives)
					.onChange(async (v) => {
						this.plugin.settings.highlightSimplerAlternatives = v;
						await this.plugin.saveSettings();
						this.plugin.refreshAfterSettingsChange();
					})
			)
			.addColorPicker((c) => {
				colorSimplerPicker = c;
				c.setValue(this.plugin.settings.colorSimplerAlternatives).onChange(async (v) => {
					this.plugin.settings.colorSimplerAlternatives = v;
					await this.plugin.saveSettings();
					this.plugin.refreshAfterSettingsChange();
				});
			})
			.addButton((b) =>
				b.setButtonText("Reset").onClick(async () => {
					this.plugin.settings.colorSimplerAlternatives = DEFAULT_SETTINGS.colorSimplerAlternatives;
					await this.plugin.saveSettings();
					colorSimplerPicker?.setValue(DEFAULT_SETTINGS.colorSimplerAlternatives);
					this.plugin.refreshAfterSettingsChange();
				})
			);

		// --- Grade level ---
		containerEl.createEl("h2", { text: "Grade level" });

		new Setting(containerEl)
			.setName("Target grade level")
			.setDesc(
				"Your target readability grade. At or below = good; above target+ok range = poor."
			)
			.addText((t) =>
				t
					.setPlaceholder("8")
					.setValue(String(this.plugin.settings.targetGradeLevel))
					.onChange(async (v) => {
						const n = parseInt(v, 10);
						if (!isNaN(n) && n >= 0) {
							this.plugin.settings.targetGradeLevel = n;
							await this.plugin.saveSettings();
							this.plugin.refreshAfterSettingsChange();
						}
					})
			);

		new Setting(containerEl)
			.setName("Ok range")
			.setDesc(
				"Grades from (target+1) to (target+ok range) are shown as 'ok'. E.g. target 8, range 4 → 9–12 is ok."
			)
			.addText((t) =>
				t
					.setPlaceholder("4")
					.setValue(String(this.plugin.settings.gradeOkRange))
					.onChange(async (v) => {
						const n = parseInt(v, 10);
						if (!isNaN(n) && n >= 0) {
							this.plugin.settings.gradeOkRange = n;
							await this.plugin.saveSettings();
							this.plugin.refreshAfterSettingsChange();
						}
					})
			);

		let gradeColorGoodPicker: { setValue: (v: string) => void } | null = null;
		new Setting(containerEl)
			.setName("Good color")
			.setDesc("Status bar color when grade is at or below target.")
			.addColorPicker((c) => {
				gradeColorGoodPicker = c;
				c.setValue(this.plugin.settings.gradeColorGood).onChange(async (v) => {
					this.plugin.settings.gradeColorGood = v;
					await this.plugin.saveSettings();
					this.plugin.refreshAfterSettingsChange();
				});
			})
			.addButton((b) =>
				b.setButtonText("Reset").onClick(async () => {
					this.plugin.settings.gradeColorGood = DEFAULT_SETTINGS.gradeColorGood;
					await this.plugin.saveSettings();
					gradeColorGoodPicker?.setValue(DEFAULT_SETTINGS.gradeColorGood);
					this.plugin.refreshAfterSettingsChange();
				})
			);

		let gradeColorOkPicker: { setValue: (v: string) => void } | null = null;
		new Setting(containerEl)
			.setName("Ok color")
			.setDesc("Status bar color when grade is in the ok range.")
			.addColorPicker((c) => {
				gradeColorOkPicker = c;
				c.setValue(this.plugin.settings.gradeColorOk).onChange(async (v) => {
					this.plugin.settings.gradeColorOk = v;
					await this.plugin.saveSettings();
					this.plugin.refreshAfterSettingsChange();
				});
			})
			.addButton((b) =>
				b.setButtonText("Reset").onClick(async () => {
					this.plugin.settings.gradeColorOk = DEFAULT_SETTINGS.gradeColorOk;
					await this.plugin.saveSettings();
					gradeColorOkPicker?.setValue(DEFAULT_SETTINGS.gradeColorOk);
					this.plugin.refreshAfterSettingsChange();
				})
			);

		let gradeColorPoorPicker: { setValue: (v: string) => void } | null = null;
		new Setting(containerEl)
			.setName("Poor color")
			.setDesc("Status bar color when grade is above the ok range.")
			.addColorPicker((c) => {
				gradeColorPoorPicker = c;
				c.setValue(this.plugin.settings.gradeColorPoor).onChange(async (v) => {
					this.plugin.settings.gradeColorPoor = v;
					await this.plugin.saveSettings();
					this.plugin.refreshAfterSettingsChange();
				});
			})
			.addButton((b) =>
				b.setButtonText("Reset").onClick(async () => {
					this.plugin.settings.gradeColorPoor = DEFAULT_SETTINGS.gradeColorPoor;
					await this.plugin.saveSettings();
					gradeColorPoorPicker?.setValue(DEFAULT_SETTINGS.gradeColorPoor);
					this.plugin.refreshAfterSettingsChange();
				})
			);

		// --- Status bar ---
		containerEl.createEl("h2", { text: "Status bar" });

		new Setting(containerEl)
			.setName("Show grade in status bar")
			.setDesc("When enabled, the Hemingway readability grade (or Post-graduate) is shown in the status bar.")
			.addToggle((t) =>
				t
					.setValue(this.plugin.settings.showGradeInStatusBar)
					.onChange(async (v) => {
						this.plugin.settings.showGradeInStatusBar = v;
						await this.plugin.saveSettings();
						this.plugin.refreshAfterSettingsChange();
					})
			);

		new Setting(containerEl)
			.setName("Show extra stats in status bar")
			.setDesc(
				"When enabled, the status bar shows words, characters, grade, letters, sentences, paragraphs, and reading time. Off by default (Obsidian already shows words and characters)."
			)
			.addToggle((t) =>
				t
					.setValue(this.plugin.settings.showExtraStatsInStatusBar)
					.onChange(async (v) => {
						this.plugin.settings.showExtraStatsInStatusBar = v;
						await this.plugin.saveSettings();
						this.plugin.refreshAfterSettingsChange();
					})
			);

		// --- Sidebar ---
		containerEl.createEl("h2", { text: "Sidebar" });

		new Setting(containerEl)
			.setName("Open Hemingway sidebar by default")
			.setDesc("When enabled, the Hemingway sidebar opens when the plugin loads.")
			.addToggle((t) =>
				t
					.setValue(this.plugin.settings.sidebarOpenByDefault)
					.onChange(async (v) => {
						this.plugin.settings.sidebarOpenByDefault = v;
						await this.plugin.saveSettings();
						this.plugin.refreshAfterSettingsChange();
					})
			);
	}
}
