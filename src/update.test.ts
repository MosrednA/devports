import assert from "node:assert/strict";
import test from "node:test";
import { updateDevports, type UpdateStep } from "./update";

test("updateDevports pulls, installs, and builds in order", async () => {
  const calls: Array<{ executable: string; args: string[]; cwd: string }> = [];
  const steps: UpdateStep[] = [];
  let revisionReads = 0;

  const result = await updateDevports({
    projectRoot: "C:\\devports",
    platform: "win32",
    pathExists: () => true,
    onStep: (step) => steps.push(step),
    runner: async (executable, args, cwd) => {
      calls.push({ executable, args, cwd });
      if (args[0] === "status") {
        return { stdout: "", stderr: "" };
      }
      if (args[0] === "branch") {
        return { stdout: "main\n", stderr: "" };
      }
      if (args[0] === "rev-parse") {
        revisionReads += 1;
        return {
          stdout: revisionReads === 1 ? "1111111\n" : "2222222\n",
          stderr: "",
        };
      }
      return { stdout: "", stderr: "" };
    },
  });

  assert.deepEqual(steps, ["pull", "install", "build"]);
  assert.equal(result.updated, true);
  assert.deepEqual(
    calls.map(({ executable, args }) => [executable, ...args]),
    [
      ["git.exe", "status", "--porcelain"],
      ["git.exe", "branch", "--show-current"],
      ["git.exe", "rev-parse", "HEAD"],
      ["git.exe", "pull", "--ff-only"],
      ["npm.cmd", "ci"],
      ["npm.cmd", "run", "build"],
      ["git.exe", "rev-parse", "HEAD"],
    ],
  );
});

test("updateDevports refuses local changes before pulling", async () => {
  const calls: string[] = [];

  await assert.rejects(
    updateDevports({
      projectRoot: "C:\\devports",
      platform: "win32",
      pathExists: () => true,
      runner: async (executable, args) => {
        calls.push(`${executable} ${args.join(" ")}`);
        return { stdout: " M README.md\n", stderr: "" };
      },
    }),
    /local changes/,
  );

  assert.deepEqual(calls, ["git.exe status --porcelain"]);
});

test("updateDevports requires a linked Git checkout", async () => {
  await assert.rejects(
    updateDevports({
      projectRoot: "C:\\not-a-checkout",
      platform: "win32",
      pathExists: () => false,
    }),
    /not a linked Git checkout/,
  );
});

test("updateDevports uses native Linux command names", async () => {
  const calls: string[] = [];
  let revisionReads = 0;

  await updateDevports({
    projectRoot: "/home/user/devports",
    platform: "linux",
    pathExists: () => true,
    runner: async (executable, args) => {
      calls.push(`${executable} ${args.join(" ")}`);
      if (args[0] === "status") {
        return { stdout: "", stderr: "" };
      }
      if (args[0] === "branch") {
        return { stdout: "main\n", stderr: "" };
      }
      if (args[0] === "rev-parse") {
        revisionReads += 1;
        return {
          stdout: revisionReads === 1 ? "1111111\n" : "1111111\n",
          stderr: "",
        };
      }
      return { stdout: "", stderr: "" };
    },
  });

  assert.deepEqual(calls, [
    "git status --porcelain",
    "git branch --show-current",
    "git rev-parse HEAD",
    "git pull --ff-only",
    "npm ci",
    "npm run build",
    "git rev-parse HEAD",
  ]);
});
