import type { UnocssAutocomplete } from "@unocss/autocomplete";
import { createAutocomplete } from "@unocss/autocomplete";
import type { SuggestResult, UnocssPluginContext, UnoGenerator } from "@unocss/core";
import type { CompletionItemProvider, Disposable, Position, TextDocument } from "vscode";
import { CompletionItem, CompletionItemKind, CompletionList, languages, MarkdownString, Range, window } from "vscode";
import { getConfig, getLanguageIds } from "./configs";
import { delimiters } from "./constants";
import type { ContextLoader } from "./contextLoader";
import { isCssId } from "./integration/utils";
import { log } from "./log";
import { getColorString, getCSS, getPrettiedCSS, getPrettiedMarkdown, isVueWithPug, shouldProvideAutocomplete } from "./utils";

class UnoCompletionItem extends CompletionItem {
  uno: UnoGenerator;
  value: string;

  constructor(label: string, kind: CompletionItemKind, value: string, uno: UnoGenerator) {
    super(label, kind);
    this.uno = uno;
    this.value = value;
  }
}

const whitespaceRE = /\s/;
const functionNameRE = /^[$A-Z_a-z][$\w]*$/;

interface StringRange {
  start: number;
  end: number;
}

interface FunctionStringContext {
  start: number;
  end: number;
  query: string;
}

function isEscaped(code: string, index: number) {
  let slashCount = 0;
  for (let i = index - 1; i >= 0 && code[i] === "\\"; i--) {
    slashCount++;
  }
  return slashCount % 2 === 1;
}

function findStringRangeAtOffset(code: string, offset: number): StringRange | undefined {
  type ParserState = "code" | "line-comment" | "block-comment" | "string";
  let state: ParserState = "code";
  let quote: "'" | '"' | "`" | null = null;
  let stringStart = -1;

  for (let i = 0; i < code.length; i++) {
    const current = code[i];
    const next = code[i + 1];

    if (state === "line-comment") {
      if (current === "\n") state = "code";
      continue;
    }

    if (state === "block-comment") {
      if (current === "*" && next === "/") {
        state = "code";
        i++;
      }
      continue;
    }

    if (state === "string") {
      if (quote && current === quote && !isEscaped(code, i)) {
        const inRange = offset > stringStart && offset <= i;
        const range = inRange
          ? {
              start: stringStart + 1,
              end: i,
            }
          : undefined;
        state = "code";
        quote = null;
        stringStart = -1;
        if (range) return range;
      }
      continue;
    }

    if (current === "/" && next === "/") {
      state = "line-comment";
      i++;
      continue;
    }

    if (current === "/" && next === "*") {
      state = "block-comment";
      i++;
      continue;
    }

    if ((current === '"' || current === "'" || current === "`") && !isEscaped(code, i)) {
      state = "string";
      quote = current;
      stringStart = i;
    }
  }

  if (state === "string" && stringStart >= 0 && offset > stringStart && offset <= code.length) {
    return {
      start: stringStart + 1,
      end: code.length,
    };
  }
}

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getLastFunctionCallOpenParen(code: string, beforeIndex: number, functionNames: string[]) {
  let lastOpenParen = -1;
  for (const name of functionNames) {
    const re = new RegExp(`\\b${escapeRegExp(name)}\\s*\\(`, "g");
    for (const match of code.matchAll(re)) {
      if (match.index == null || match.index >= beforeIndex) continue;
      const matched = match[0];
      const openParenIndex = match.index + matched.lastIndexOf("(");
      if (openParenIndex < beforeIndex && openParenIndex > lastOpenParen) {
        lastOpenParen = openParenIndex;
      }
    }
  }
  return lastOpenParen;
}

function isInsideFunctionCall(code: string, openParenIndex: number, targetIndex: number) {
  type ParserState = "code" | "line-comment" | "block-comment" | "string";
  let state: ParserState = "code";
  let quote: "'" | '"' | "`" | null = null;
  let depth = 1;

  for (let i = openParenIndex + 1; i < targetIndex; i++) {
    const current = code[i];
    const next = code[i + 1];

    if (state === "line-comment") {
      if (current === "\n") state = "code";
      continue;
    }

    if (state === "block-comment") {
      if (current === "*" && next === "/") {
        state = "code";
        i++;
      }
      continue;
    }

    if (state === "string") {
      if (quote && current === quote && !isEscaped(code, i)) {
        state = "code";
        quote = null;
      }
      continue;
    }

    if (current === "/" && next === "/") {
      state = "line-comment";
      i++;
      continue;
    }

    if (current === "/" && next === "*") {
      state = "block-comment";
      i++;
      continue;
    }

    if ((current === '"' || current === "'" || current === "`") && !isEscaped(code, i)) {
      state = "string";
      quote = current;
      continue;
    }

    if (current === "(") {
      depth++;
      continue;
    }

    if (current === ")") {
      depth--;
      if (depth === 0) return false;
    }
  }
  return depth > 0;
}

function getFunctionStringContextAtOffset(code: string, offset: number, functionNames: string[]): FunctionStringContext | undefined {
  const targetFunctions = functionNames.map((name) => name.trim()).filter((name) => name && functionNameRE.test(name));
  if (!targetFunctions.length) return;

  const stringRange = findStringRangeAtOffset(code, offset);
  if (!stringRange) return;

  const quoteIndex = stringRange.start - 1;
  const openParenIndex = getLastFunctionCallOpenParen(code, quoteIndex, targetFunctions);
  if (openParenIndex < 0 || !isInsideFunctionCall(code, openParenIndex, quoteIndex)) return;

  const cursor = Math.min(Math.max(offset, stringRange.start), stringRange.end);
  let tokenStart = cursor;
  let tokenEnd = cursor;

  while (tokenStart > stringRange.start && !whitespaceRE.test(code[tokenStart - 1])) tokenStart--;
  while (tokenEnd < stringRange.end && !whitespaceRE.test(code[tokenEnd])) tokenEnd++;

  return {
    start: tokenStart,
    end: tokenEnd,
    query: code.slice(tokenStart, cursor),
  };
}

export async function registerAutoComplete(loader: ContextLoader) {
  const autoCompletes = new Map<UnocssPluginContext, UnocssAutocomplete>();
  const config = getConfig();
  loader.events.on("contextReload", (ctx) => {
    autoCompletes.delete(ctx);
  });

  loader.events.on("contextUnload", (ctx) => {
    autoCompletes.delete(ctx);
  });

  loader.events.on("unload", (ctx) => {
    autoCompletes.delete(ctx);
  });

  function getAutocomplete(ctx: UnocssPluginContext) {
    const cached = autoCompletes.get(ctx);
    if (cached) return cached;

    const autocomplete = createAutocomplete(ctx.uno, {
      matchType: config.autocompleteMatchType,
      throwErrors: false,
    });
    if (autocomplete.errorCache.size > 0) {
      for (const error of Array.from(autocomplete.errorCache.values()).flat()) {
        log.appendLine(error.toString());
      }
    }

    autoCompletes.set(ctx, autocomplete);
    return autocomplete;
  }

  async function getMarkdown(uno: UnoGenerator, util: string, remToPxRatio: number) {
    return new MarkdownString(await getPrettiedMarkdown(uno, util, remToPxRatio));
  }

  async function getSuggestionResult({ ctx, code, id, doc, position, functionStringContext }: { ctx: UnocssPluginContext; code: string; id: string; doc: TextDocument; position: Position; functionStringContext?: FunctionStringContext }) {
    const isPug = isVueWithPug(code, id);
    const autoComplete = getAutocomplete(ctx);
    if (functionStringContext) {
      const suggestions = await autoComplete.suggest(functionStringContext.query);
      if (suggestions.length) {
        return {
          suggestions: suggestions.map((v) => [v, v] as [string, string]),
          resolveReplacement: (suggestion: string) => ({
            start: functionStringContext.start,
            end: functionStringContext.end,
            replacement: suggestion,
          }),
        };
      }
    }

    // If isPug is true, then we should not recognize it as a cssId.
    if (!ctx.filter(code, id) && !isCssId(id) && !isPug) return null;

    try {
      const cursorPosition = doc.offsetAt(position);
      let result: SuggestResult | undefined;

      // Special treatment for Pug Vue templates
      if (isPug) {
        // get content from cursorPosition
        const textBeforeCursor = code.substring(0, cursorPosition);
        // check the dot
        const dotMatch = textBeforeCursor.match(/\.[-\w]*$/);

        if (dotMatch) {
          const matched = dotMatch[0].substring(1); // replace dot
          const suggestions = await autoComplete.suggest(matched || "");

          if (suggestions.length) {
            result = {
              suggestions: suggestions.map((v) => [v, v] as [string, string]),
              resolveReplacement: (suggestion: string) => ({
                start: cursorPosition - (matched?.length || 0),
                end: cursorPosition,
                replacement: suggestion,
              }),
            };
          }
        } else {
          // original logic
          result = await autoComplete.suggestInFile(code, cursorPosition);
        }
      } else {
        result = await autoComplete.suggestInFile(code, cursorPosition);
      }

      return result;
    } catch (e: any) {
      throw new Error(e);
    }
  }

  const provider: CompletionItemProvider<UnoCompletionItem> = {
    async provideCompletionItems(doc, position) {
      const id = doc.uri.fsPath;
      if (!loader.isTarget(id)) return null;

      const ctx = await loader.resolveClosestContext(doc.getText(), id);
      if (!ctx) return null;

      const offset = window.activeTextEditor!.document.offsetAt(position);

      const code = doc.getText();
      if (!code) return null;

      const functionStringContext = getFunctionStringContextAtOffset(code, offset, config.autocompleteClassFunctions || []);

      if (config.autocompleteStrict && !functionStringContext && !shouldProvideAutocomplete(code, id, offset)) return;

      try {
        const result = await getSuggestionResult({
          ctx,
          code,
          id,
          doc,
          position,
          functionStringContext,
        });

        if (!result) return;

        // log.appendLine(`🤖 ${id} | ${result.suggestions.slice(0, 10).map(v => `[${v[0]}, ${v[1]}]`).join(', ')}`)

        if (!result.suggestions.length) return;

        const completionItems: UnoCompletionItem[] = [];

        const suggestions = result.suggestions.slice(0, config.autocompleteMaxItems);
        const isAttributify = ctx.uno.config.presets.some((p) => p.name === "@unocss/preset-attributify");
        for (const [value, label] of suggestions) {
          const css = await getCSS(ctx!.uno, isAttributify ? [value, `[${value}=""]`] : value);
          const colorString = getColorString(css);
          const itemKind = colorString ? CompletionItemKind.Color : CompletionItemKind.EnumMember;
          const item = new UnoCompletionItem(label, itemKind, value, ctx!.uno);
          const resolved = result.resolveReplacement(value);

          item.insertText = resolved.replacement;
          item.range = new Range(doc.positionAt(resolved.start), doc.positionAt(resolved.end));

          if (colorString) {
            item.documentation = colorString;
            item.sortText = /-\d$/.test(label) ? "1" : "2"; // reorder color completions
          }
          completionItems.push(item);
        }

        return new CompletionList(completionItems, true);
      } catch (e: any) {
        log.appendLine("⚠️ Error on getting autocompletion items");
        log.appendLine(String(e.stack ?? e));
        return null;
      }
    },

    async resolveCompletionItem(item) {
      const remToPxRatio = config.remToPxPreview ? config.remToPxRatio : -1;

      if (item.kind === CompletionItemKind.Color) item.detail = await (await getPrettiedCSS(item.uno, item.value, remToPxRatio)).prettified;
      else item.documentation = await getMarkdown(item.uno, item.value, remToPxRatio);
      return item;
    },
  };

  let completeUnregister: Disposable;

  const registerProvider = async () => {
    completeUnregister?.dispose?.();

    completeUnregister = languages.registerCompletionItemProvider(await getLanguageIds(), provider, ...delimiters);
    return completeUnregister;
  };

  loader.ext.subscriptions.push(
    config.watchChanged(["languageIds"], async () => {
      loader.ext.subscriptions.push(await registerProvider());
    }),

    config.watchChanged(["autocompleteMatchType", "autocompleteStrict", "autocompleteClassFunctions", "remToPxRatio", "remToPxPreview"], () => {
      autoCompletes.clear();
    }),

    await registerProvider(),
  );
}
