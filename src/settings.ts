import {App, PluginSettingTab, Setting} from "obsidian";
import MyPlugin from "./main";

export interface MyPluginSettings {
	mySetting: string;
	// Future: status bar customization (e.g. color, visibility)
	// statusBarColor?: string;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default',
	// statusBarColor: 'red',
}

export class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Settings #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));

		// --- Status bar (future customization) ---
		// Example: add a color picker or dropdown here and set statusBarItemEl.style.color in main.ts on change.
		// new Setting(containerEl)
		// 	.setName('Status bar color')
		// 	.setDesc('Color for the readability grade in the status bar.')
		// 	.addText(text => text.setPlaceholder('e.g. red, #7c3aed').setValue(this.plugin.settings.statusBarColor ?? 'red').onChange(...));
	}
}
