import {
    Decoration,
    DecorationSet,
    EditorView,
    ViewPlugin,
    ViewUpdate,
  } from "@codemirror/view";
  
  const HIGHLIGHT_CLASS = "hm-highlight-and";
  
  const andMark = Decoration.mark({ class: HIGHLIGHT_CLASS });
  
  function findAndRanges(view: EditorView): DecorationSet {
    const ranges: ReturnType<typeof andMark.range>[] = [];
    const regex = /\band\b/gi;
  
    for (const { from, to } of view.visibleRanges) {
      const text = view.state.doc.sliceString(from, to);
      let match;
      regex.lastIndex = 0;
      while ((match = regex.exec(text)) !== null) {
        ranges.push(
          andMark.range(from + match.index, from + match.index + match[0].length)
        );
      }
    }
  
    return Decoration.set(ranges);
  }
  
  const wordHighlightPlugin = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
  
      constructor(view: EditorView) {
        this.decorations = findAndRanges(view);
      }
  
      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = findAndRanges(update.view);
        }
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );
  
  const wordHighlightTheme = EditorView.baseTheme({
    [`.${HIGHLIGHT_CLASS}`]: { backgroundColor: "rgba(0, 200, 0, 0.25)", color: "green" },
  });

  /** Extension array to pass to registerEditorExtension (do not wrap in a function to avoid "Unrecognized extension value" / duplicate CodeMirror instance issues). */
  export const wordHighlightExtension = [wordHighlightPlugin, wordHighlightTheme];