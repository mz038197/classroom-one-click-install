import os from "node:os";
import path from "node:path";

export type EditorUserPathInput = {
  platform: NodeJS.Platform;
  /** vscode.env.uriScheme — e.g. vscode | cursor */
  uriScheme: string;
  env?: NodeJS.ProcessEnv;
  homedir?: () => string;
};

/**
 * User settings directory for the editor currently hosting this extension.
 * Only the current Host — not other products.
 */
export function resolveEditorUserDir(input: EditorUserPathInput): string {
  const env = input.env ?? process.env;
  const home = (input.homedir ?? os.homedir)();
  const product = productFolder(input.uriScheme);

  if (input.platform === "win32") {
    const appData = env.APPDATA || path.join(home, "AppData", "Roaming");
    return path.join(appData, product, "User");
  }
  if (input.platform === "darwin") {
    return path.join(home, "Library", "Application Support", product, "User");
  }
  // Linux / other
  return path.join(home, ".config", product, "User");
}

function productFolder(uriScheme: string): string {
  const scheme = (uriScheme || "vscode").toLowerCase();
  if (scheme === "cursor") {
    return "Cursor";
  }
  if (scheme === "vscode-insiders") {
    return "Code - Insiders";
  }
  return "Code";
}

export function chatLanguageModelsPath(userDir: string): string {
  return path.join(userDir, "chatLanguageModels.json");
}
