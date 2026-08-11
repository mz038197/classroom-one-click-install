import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type WingetProbe = () => Promise<boolean>;

/** True when `winget` is on PATH (Windows package manager). */
export async function detectWingetAvailable(
  probe?: WingetProbe,
): Promise<boolean> {
  if (probe) {
    return probe();
  }
  if (process.platform !== "win32") {
    return false;
  }
  try {
    await execFileAsync("where", ["winget"], { windowsHide: true });
    return true;
  } catch {
    return false;
  }
}
