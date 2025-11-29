import type { UnoGenerator } from "@unocss/core";
import type { TextDocument } from "vscode";
import { workspace } from "vscode";
import { getConfig } from "./configs";
import type { ContextLoader } from "./contextLoader";
import { defaultIdeMatchExclude, defaultIdeMatchInclude } from "./integration/defaults-ide";
import { getMatchedPositionsFromCode } from "./integration/match-positions";

const cache = new Map<string, ReturnType<typeof getMatchedPositionsFromCode>>();

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

  const options = getConfig().strictAnnotationMatch
    ? {
        includeRegex: defaultIdeMatchInclude,
        excludeRegex: defaultIdeMatchExclude,
      }
    : undefined;

  const result = getMatchedPositionsFromCode(uno, doc.getText(), id, options);

  cache.set(id, result);
  return result;
}
