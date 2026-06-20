import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { CommandResult } from "../types";

const execFileAsync = promisify(execFile);

export async function runPowerShell(script: string): Promise<CommandResult> {
  if (process.platform !== "win32") {
    throw new Error("devports currently requires Windows.");
  }

  try {
    const { stdout, stderr } = await execFileAsync(
      "powershell.exe",
      [
        "-NoLogo",
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        script,
      ],
      {
        encoding: "utf8",
        windowsHide: true,
        maxBuffer: 10 * 1024 * 1024,
      },
    );

    return { stdout, stderr };
  } catch (error) {
    const cause = error as NodeJS.ErrnoException & {
      stderr?: string;
      stdout?: string;
    };

    if (cause.code === "ENOENT") {
      throw new Error(
        "Could not run PowerShell. This tool currently requires Windows PowerShell.",
        { cause: error },
      );
    }

    const detail = cause.stderr?.trim() || cause.message;
    throw new Error(`Could not scan Windows processes: ${detail}`, {
      cause: error,
    });
  }
}
