# Hemingway Markdown

Hemingway-style readability in Obsidian: grade level, sentence highlights, and weak-word flags—without leaving your vault.

## What it does

- **Grade** in the status bar (optional)
- **Highlights** hard and very hard sentences, passive voice / adverbs / qualifiers, and words with simpler alternatives
- **Sidebar** with counts and stats

Open **Settings → Hemingway Markdown** to turn features on or off and change colors.

## Install

From Obsidian: **Settings → Community plugins → Browse**, search for the plugin, install and enable.

**Manual:** put `main.js`, `styles.css`, and `manifest.json` in:

`YourVault/.obsidian/plugins/hemingway-markdown/`

## Develop

```bash
npm install
npm run dev    # watch and rebuild
npm run build  # production build
```

Reload Obsidian after the build.
