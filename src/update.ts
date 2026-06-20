import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { getSupportedPlatform, type SupportedPlatform } from "./platform";
import type { CommandResult } from "./types";

const execFileAsync = promisify(execFile);

export type UpdateStep = "pull" | "install" | "build";

export type UpdateResult = {
  beforeCommit: string;
  afterCommit: string;
  updated: boolean;
};

type UpdateRunner = (
  executable: string,
  args: string[],
  cwd: string,
) => Promise<CommandResult>;

export type UpdateOptions = {
  projectRoot?: string;
  runner?: UpdateRunner;
  pathExists?: (path: string) => boolean;
  onStep?: (step: UpdateStep) => void;
  platform?: SupportedPlatform;
};

async function defaultRunner(
  executable: string,
  args: string[],
  cwd: string,
): Promise<CommandResult> {
  const command =
    executable === "npm.cmd"
      ? {
          executable: process.env.ComSpec || "cmd.exe",
          args: ["/d", "/s", "/c", `npm ${args.join(" ")}`],
        }
      : { executable, args };

  const { stdout, stderr } = await execFileAsync(
    command.executable,
    command.args,
    {
      cwd,
      encoding: "utf8",
      windowsHide: true,
      maxBuffer: 10 * 1024 * 1024,
    },
  );
  return { stdout, stderr };
}

function commandError(error: unknown): string {
  const cause = error as Error & { stderr?: string; stdout?: string };
  return cause.stderr?.trim() || cause.stdout?.trim() || cause.message;
}

export async function updateDevports(
  options: UpdateOptions = {},
): Promise<UpdateResult> {
  const platform = options.platform ?? getSupportedPlatform();
  const projectRoot = options.projectRoot ?? resolve(__dirname, "..");
  const runner = options.runner ?? defaultRunner;
  const pathExists = options.pathExists ?? existsSync;

  if (
    !pathExists(resolve(projectRoot, ".git")) ||
    !pathExists(resolve(projectRoot, "package.json"))
  ) {
    throw new Error(
      "This devports installation is not a linked Git checkout.\n" +
        "Update it manually by cloning the repository and running npm link.",
    );
  }

  const run = async (
    executable: string,
    args: string[],
  ): Promise<CommandResult> => {
    try {
      return await runner(executable, args, projectRoot);
    } catch (error) {
      throw new Error(
        `Update command failed: ${executable} ${args.join(" ")}\n` +
          commandError(error),
        { cause: error },
      );
    }
  };

  const git = platform === "win32" ? "git.exe" : "git";
  const npm = platform === "win32" ? "npm.cmd" : "npm";

  const status = await run(git, ["status", "--porcelain"]);
  if (status.stdout.trim()) {
    throw new Error(
      "The devports checkout has local changes. Commit or discard them before updating.",
    );
  }

  const branch = await run(git, ["branch", "--show-current"]);
  if (!branch.stdout.trim()) {
    throw new Error(
      "The devports checkout is in detached HEAD state. Switch to a branch before updating.",
    );
  }

  const beforeCommit = (await run(git, ["rev-parse", "HEAD"])).stdout.trim();

  options.onStep?.("pull");
  await run(git, ["pull", "--ff-only"]);

  options.onStep?.("install");
  await run(npm, ["ci"]);

  options.onStep?.("build");
  await run(npm, ["run", "build"]);

  const afterCommit = (await run(git, ["rev-parse", "HEAD"])).stdout.trim();

  return {
    beforeCommit,
    afterCommit,
    updated: beforeCommit !== afterCommit,
  };
}
