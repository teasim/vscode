# Teasim for VS Code

Teasim is a Visual Studio Code extension that provides an IDE-grade authoring experience for @teasim/styles utilities, including inline decorations, hover CSS previews, color chips, rem-to-px hints, and context-aware autocomplete.

## Installation

Install from the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=yiqilaitech.teasim), or search for `Teasim` in the VS Code Extensions panel.

## Feature Highlights

1. Real-time annotation and hover preview
Matched utilities are underlined in editor, and hovering shows generated CSS.

2. Visual color preview
Color-related utilities render inline color indicators for faster UI inspection.

3. rem to px conversion hints
Optional rem-to-px hints are appended in hover output to improve readability.

4. Selection CSS inspector
Select multiple utilities and hover to see their combined CSS result.

5. Utility autocomplete
Autocomplete suggestions are available in supported languages with configurable matching behavior.

## Quick Start

1. Open a workspace that contains UnoCSS/Teasim config.
2. Ensure your config is discoverable, preferably as `uno.config.*` or `unocss.config.*` in project root.
3. Open a supported file type and start editing utility classes.
4. Use `Teasim: Reload Teasim` after changing config files.

## Commands

| Command | Description |
| --- | --- |
| `Teasim: Reload Teasim` | Reload Teasim and refresh detected project context/configuration |
| `Teasim: Insert @unocss-skip for the selection` | Wrap the selected code with skip annotations |

## Configuration

| Key | Type | Default | Description |
| --- | --- | --- | --- |
| `teasim.disable` | `boolean` | `false` | Disable the Teasim extension |
| `teasim.languageIds` | `string[]` | `undefined` | Additional language IDs to enable support |
| `teasim.root` | `string \| string[]` | `undefined` | Project root containing config files |
| `teasim.include` | `string \| string[]` | `undefined` | File patterns/directories to include |
| `teasim.exclude` | `string \| string[]` | `undefined` | File patterns/directories to exclude |
| `teasim.underline` | `boolean` | `true` | Enable underline decorations for matched utilities |
| `teasim.colorPreview` | `boolean` | `true` | Enable color preview decorations |
| `teasim.colorPreviewRadius` | `string` | `"50%"` | Border radius for color preview swatches |
| `teasim.remToPxPreview` | `boolean` | `true` | Enable rem-to-px hints in hover preview |
| `teasim.remToPxRatio` | `number` | `16` | Ratio used for rem-to-px conversion |
| `teasim.selectionStyle` | `boolean` | `true` | Enable selection style hover preview |
| `teasim.strictAnnotationMatch` | `boolean` | `false` | Restrict annotations to stricter matching context |
| `teasim.autocomplete.matchType` | `"prefix" \| "fuzzy"` | `"prefix"` | Autocomplete matching strategy |
| `teasim.autocomplete.strict` | `boolean` | `false` | Restrict autocomplete to stricter matching context |
| `teasim.autocomplete.maxItems` | `number` | `1000` | Maximum autocomplete items returned |
| `teasim.autocomplete.classFunctions` | `string[]` | `["defineVariants", "mergeClass"]` | Function names whose string arguments should support utility autocomplete |

Recommended baseline:

```json
{
  "teasim.strictAnnotationMatch": true,
  "teasim.autocomplete.strict": true,
  "teasim.autocomplete.matchType": "prefix",
  "teasim.autocomplete.classFunctions": ["defineVariants", "mergeClass"],
  "teasim.remToPxRatio": 16
}
```

## Skip Annotations

Use skip annotations to exclude specific code from utility analysis.

HTML / Vue / Svelte:

```html
<!-- @unocss-skip -->
<div class="...">...</div>
```

Block-level skip:

```html
<!-- @unocss-skip-start -->
<div class="...">...</div>
<!-- @unocss-skip-end -->
```

CSS:

```css
/* @unocss-skip */
.selector { color: red; }
```

JavaScript / TypeScript:

```js
// @unocss-skip
const cls = "text-red-500";
```

## Supported Languages

Enabled by default for:

`astro`, `css`, `ejs`, `erb`, `haml`, `hbs`, `html`, `javascript`, `javascriptreact`, `less`, `markdown`, `marko`, `php`, `postcss`, `rust`, `sass`, `scss`, `stylus`, `svelte`, `typescript`, `typescriptreact`, `vue`, `vue-html`

You can extend support using `teasim.languageIds`.

## Development

Prerequisites:

- VS Code `^1.109.0`
- Bun runtime

Local workflow:

```bash
bun install
bun run develop
```

Build and package:

```bash
bun run build
bun run pack
```

Regenerate extension metadata:

```bash
bun run update
```

## Troubleshooting

1. No hover or annotation appears
Check that your project config is detected (`uno.config.*`/`unocss.config.*`), then run `Teasim: Reload Teasim`.

2. Suggestions are too noisy
Enable `teasim.autocomplete.strict` and `teasim.strictAnnotationMatch`.

3. A language is not supported
Add it to `teasim.languageIds`.

## Links

- Homepage: https://vscode.teasim.com
- Repository: https://github.com/teasim/vscode
- Issues: https://github.com/teasim/vscode/issues

## License

[MIT](./LICENSE)
