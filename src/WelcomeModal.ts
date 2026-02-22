import { App, Modal } from "obsidian";

const COMMUNITY_URL = "https://skool.com/coder";

export class WelcomeModal extends Modal {
	private onDismiss: () => void;

	constructor(app: App, onDismiss: () => void) {
		super(app);
		this.onDismiss = onDismiss;
	}

	onOpen(): void {
		this.titleEl.setText("You just leveled up your writing.");

		const body = this.contentEl.createDiv({ cls: "hemingway-welcome-modal" });

		body.createEl("p", { text: "Quick tip: Paste any draft in here and aim for Grade 3 or below." });
		body.createEl("p", {
			text: "That doesn't attract dumb readers. It makes smart readers move faster — and it makes everyone else actually understand you.",
		});
		body.createEl("p", {
			text: "I built this because most dev content is over-written. Docs nobody reads. Blog posts nobody finishes. Newsletters nobody opens twice.",
		});
		body.createEl("p", {
			text: "If you write code AND content, I run a free community of Python devs who also build audiences.",
		});
		body.createEl("p", { text: "We share templates, review each other's writing, and ship together." });

		const buttons = body.createDiv({ cls: "hemingway-welcome-modal__buttons" });

		const joinBtn = buttons.createEl("button", { cls: "mod-cta" });
		joinBtn.setText("Join 500+ devs at skool.com/coder");
		joinBtn.addEventListener("click", () => {
			window.open(COMMUNITY_URL, "_blank");
			this.markSeenAndClose();
		});

		const laterBtn = buttons.createEl("button", { cls: "mod-secondary" });
		laterBtn.setText("Maybe later");
		laterBtn.addEventListener("click", () => this.markSeenAndClose());
	}

	private markSeenAndClose(): void {
		this.onDismiss();
		this.close();
	}
}
