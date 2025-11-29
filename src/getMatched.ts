import type { UnoGenerator } from "@unocss/core";
import type { TextDocument } from "vscode";
import { workspace } from "vscode";
import { getConfig } from "./configs";
import type { ContextLoader } from "./contextLoader";
import { defaultIdeMatchExclude, defaultIdeMatchInclude } from "./integration/defaults-ide";
import { getMatchedPositionsFromCode } from "./integration/match-positions";

const cache = new Map<string, ReturnType<typeof getMatchedPositionsFromCode>>();
const functionNameRE = /^[$A-Z_a-z][$\w]*$/;

type MatchedPosition = readonly [start: number, end: number, text: string];
type FunctionTokenRange = { start: number; end: number; text: string };

function isEscaped(code: string, index: number) {
  let slashCount = 0;
  for (let i = index - 1; i >= 0 && code[i] === "\\"; i--) slashCount++;
  return slashCount % 2 === 1;
}

function escapeRegExp(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getFunctionCallOpenParenIndexes(code: string, functionNames: string[]) {
  const targetFunctions = functionNames.map((name) => name.trim()).filter((name) => name && functionNameRE.test(name));
  const indexes: number[] = [];
  for (const name of targetFunctions) {
    const re = new RegExp(`\\b${escapeRegExp(name)}\\s*\\(`, "g");
    for (const match of code.matchAll(re)) {
      if (match.index == null) continue;
      const matched = match[0];
      indexes.push(match.index + matched.lastIndexOf("("));
    }
  }
  return indexes.sort((a, b) => a - b);
}

function getStringRangesInFunctionCall(code: string, openParenIndex: number) {
  type ParserState = "code" | "line-comment" | "block-comment" | "string";
  const ranges: { start: number; end: number }[] = [];
  let state: ParserState = "code";
  let quote: "'" | '"' | "`" | null = null;
  let stringStart = -1;
  let depth = 1;

  for (let i = openParenIndex + 1; i < code.length; i++) {
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
        ranges.push({
          start: stringStart + 1,
          end: i,
        });
        state = "code";
        quote = null;
        stringStart = -1;
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
      continue;
    }

    if (current === "(") {
      depth++;
      continue;
    }
    if (current === ")") {
      depth--;
      if (depth === 0) break;
    }
  }

  return ranges;
}

function getFunctionTokenRanges(code: string, functionNames: string[]) {
  const tokenRanges: FunctionTokenRange[] = [];
  for (const openParenIndex of getFunctionCallOpenParenIndexes(code, functionNames)) {
    for (const range of getStringRangesInFunctionCall(code, openParenIndex)) {
      const content = code.slice(range.start, range.end);
      for (const match of content.matchAll(/\S+/g)) {
        const token = match[0];
        const start = range.start + match.index!;
        tokenRanges.push({
          start,
          end: start + token.length,
          text: token,
        });
      }
    }
  }
  return tokenRanges;
}

async function getFunctionMatchedPositions(uno: UnoGenerator, code: string, functionNames: string[]) {
  const tokenRanges = getFunctionTokenRanges(code, functionNames);
  if (!tokenRanges.length) return [] as MatchedPosition[];

  const generated = await uno.generate(new Set(tokenRanges.map((tokenRange) => tokenRange.text)), {
    preflights: false,
    safelist: false,
    minify: true,
  });
  if (!generated.matched.size) return [] as MatchedPosition[];

  return tokenRanges.filter((tokenRange) => generated.matched.has(tokenRange.text)).map((tokenRange) => [tokenRange.start, tokenRange.end, tokenRange.text] as const);
}

function mergeMatchedPositions(base: readonly MatchedPosition[], extra: readonly MatchedPosition[]) {
  if (!extra.length) return [...base];
  const merged = new Map<string, MatchedPosition>();
  for (const [start, end, text] of [...base, ...extra]) merged.set(`${start}:${end}:${text}`, [start, end, text]);
  return [...merged.values()].sort((a, b) => a[0] - b[0]);
}

export function registerDocumentCacheCleaner(loader: ContextLoader) {
  loader.ext.subscriptions.push(
    workspace.onDidChangeTextDocument((e) => {
      cache.delete(e.document.uri.fsPath);
    }),
  );
}

export function getMatchedPositionsFromDoc(uno: UnoGenerator, doc: TextDocument, force = false) {
  const id = doc.uri.fsPath;
  if (force) cache.delete(id);

  if (cache.has(id)) return cache.get(id)!;

  const config = getConfig();
  const options = config.strictAnnotationMatch
    ? {
        includeRegex: defaultIdeMatchInclude,
        excludeRegex: defaultIdeMatchExclude,
      }
    : undefined;

  const code = doc.getText();
  const basePositionsPromise = getMatchedPositionsFromCode(uno, code, id, options);
  const result = (async () => {
    const basePositions = await basePositionsPromise;
    const classFunctions = config.autocompleteClassFunctions || [];
    if (!classFunctions.length) return basePositions;

    const functionPositions = await getFunctionMatchedPositions(uno, code, classFunctions);
    return mergeMatchedPositions(basePositions, functionPositions);
  })();

  cache.set(id, result);
  return result;
}
