import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { killLinuxProcessTree } from "./linux/kill";
import { getSupportedPlatform, type SupportedPlatform } from "./platform";
import type { CommandResult } from "./types";

const execFileAsync = promisify(execFile);

type TaskkillRunner = (
  executable: string,
  args: string[],
) => Promise<CommandResult>;

async function defaultTaskkillRunner(
  executable: string,
  args: string[],
): Promise<CommandResult> {
  const { stdout, stderr } = await execFileAsync(executable, args, {
    encoding: "utf8",
    windowsHide: true,
  });
  return { stdout, stderr };
}

export function taskkillArguments(pid: number, force = true): string[] {
  return ["/PID", String(pid), "/T", ...(force ? ["/F"] : [])];
}

export async function killProcessTree(
  pid: number,
  force = true,
  runner: TaskkillRunner = defaultTaskkillRunner,
  platform: SupportedPlatform = getSupportedPlatform(),
): Promise<CommandResult> {
  if (platform === "linux") {
    return killLinuxProcessTree(pid, force);
  }

  try {
    return await runner("taskkill.exe", taskkillArguments(pid, force));
  } catch (error) {
    const cause = error as Error & { stderr?: string; stdout?: string };
    const detail = cause.stderr?.trim() || cause.stdout?.trim();
    const suffix = detail ? `\n${detail}` : "";
    throw new Error(
      `Could not kill PID ${pid}. It may be running as administrator.\n` +
        `Try running this terminal as administrator, or use Task Manager.${suffix}`,
      { cause: error },
    );
  }
}
