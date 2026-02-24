# Teasim for VS Code

Teasim styles support for Visual Studio Code.

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=yiqilaitech.@teasim/vscode">
    <img src="https://img.shields.io/visual-studio-marketplace/v/yiqilaitech.@teasim/vscode?color=blue&label=VS%20Code%20Marketplace&logo=visual-studio-code" alt="VS Code Marketplace" />
  </a>
</p>

## Features

### Decorations

Matched utilities will be underlined. Hover over them to see the generated CSS. Color and rem utilities will also display a preview.

### Autocomplete

Autocomplete suggestions for Teasim utilities in supported languages.

### Selection Style

Select multiple utility class names and hover to see the combined CSS equivalent for the selection.

## Installation

Install from the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=yiqilaitech.@teasim/vscode) or search for `Teasim` in the Extensions panel.

## Commands

| Command | Description |
| ------- | ----------- |
| `Teasim: Reload Teasim` | Reload the Teasim extension and its configuration |
| `Teasim: Insert skip annotation for the selection` | Wrap the selected code with a skip annotation (`@unocss-skip`) |

## Configuration

| Key | Default | Description |
| --- | ------- | ----------- |
| `teasim.disable` | `false` | Disable the Teasim extension |
| `teasim.languageIds` | `[]` | Additional language IDs to enable Teasim support |
| `teasim.root` | `""` | Project root that contains the Teasim configuration file |
| `teasim.include` | `""` | Glob patterns of files to be detected |
| `teasim.exclude` | `""` | Glob patterns of files not to be detected |
| `teasim.underline` | `true` | Enable/disable underline decoration for matched class names |
| `teasim.colorPreview` | `true` | Enable/disable color preview decorations |
| `teasim.colorPreviewRadius` | `"50%"` | Border radius for the color preview swatch |
| `teasim.remToPxPreview` | `true` | Enable/disable rem-to-px conversion in hover tooltips |
| `teasim.remToPxRatio` | `16` | The base font size (px) used for rem-to-px conversion |
| `teasim.selectionStyle` | `true` | Enable/disable the selection style decoration |
| `teasim.strictAnnotationMatch` | `false` | Only show annotations inside class / className attributes |
| `teasim.autocomplete.matchType` | `"prefix"` | Autocomplete matching strategy: `prefix` or `fuzzy` |
| `teasim.autocomplete.strict` | `false` | Only show autocomplete inside class / className attributes |
| `teasim.autocomplete.maxItems` | `1000` | Maximum number of autocomplete suggestions to display |

## Skip Annotations

You can tell Teasim to skip a section of code by adding a skip annotation.

For **HTML / Vue / Svelte**:

```html
<!-- @unocss-skip -->
<div class="...">...</div>
```

Or wrap a block:

```html
<!-- @unocss-skip-start -->
<div class="...">...</div>
<!-- @unocss-skip-end -->
```

For **CSS**:

```css
/* @unocss-skip */
.selector { color: red; }
```

For **JavaScript / TypeScript**:

```js
// @unocss-skip
const cls = 'text-red-500'
```

You can also use the **`Teasim: Insert skip annotation for the selection`** command to wrap selected text automatically.

## Supported Languages

The extension is active in the following languages by default:

`astro`, `css`, `ejs`, `erb`, `haml`, `hbs`, `html`, `javascript`, `javascriptreact`, `less`, `markdown`, `marko`, `php`, `postcss`, `rust`, `sass`, `scss`, `stylus`, `svelte`, `typescript`, `typescriptreact`, `vue`, `vue-html`

You can extend this list via the `teasim.languageIds` setting.

## License

[MIT](./LICENSE)
