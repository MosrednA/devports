import assert from "node:assert/strict";
import test from "node:test";
import { createProgram, type CliDependencies, type CliIo } from "./cli-program";
import type { NodePortProcess, ProcessInfo } from "./types";

const processes: NodePortProcess[] = [
  {
    port: 3000,
    address: "127.0.0.1",
    pid: 101,
    processName: "node.exe",
    command: "node api.js",
    executablePath: "C:\\node.exe",
    parentProcessId: 1,
    url: "http://localhost:3000",
  },
  {
    port: 5173,
    address: "127.0.0.1",
    pid: 202,
    processName: "node.exe",
    command: "vite",
    executablePath: "C:\\node.exe",
    parentProcessId: 1,
    url: "http://localhost:5173",
  },
];

type HarnessOptions = {
  processes?: NodePortProcess[];
  processByPid?: ProcessInfo | null;
};

function createHarness(options: HarnessOptions = {}) {
  const killed: Array<{ pid: number; force: boolean | undefined }> = [];
  const logs: string[] = [];
  const errors: string[] = [];
  const writes: string[] = [];
  const exitCodes: number[] = [];
  const updateSteps: string[] = [];

  const dependencies: CliDependencies = {
    scanNodePorts: async () => options.processes ?? processes,
    scanNodePortsRaw: async () => "[]",
    getProcessByPid: async () => options.processByPid ?? null,
    killProcessTree: async (pid, force) => {
      killed.push({ pid, force });
      return { stdout: "", stderr: "" };
    },
    openLocalhost: async (port) => `http://localhost:${port}`,
    updateDevports: async (onStep) => {
      for (const step of ["pull", "install", "build"] as const) {
        updateSteps.push(step);
        onStep(step);
      }
      return {
        updated: true,
        beforeCommit: "1111111",
        afterCommit: "2222222",
      };
    },
  };
  const io: CliIo = {
    log: (message) => logs.push(message),
    error: (message) => errors.push(message),
    write: (message) => writes.push(message),
    setExitCode: (code) => exitCodes.push(code),
  };

  return {
    program: createProgram("1.0.0", dependencies, io),
    killed,
    logs,
    errors,
    writes,
    exitCodes,
    updateSteps,
  };
}

async function run(
  harness: ReturnType<typeof createHarness>,
  ...args: string[]
): Promise<void> {
  await harness.program.parseAsync(["node", "devports", ...args]);
}

test("k accepts separate indexes and force-kills by default", async () => {
  const harness = createHarness();
  await run(harness, "k", "1", "2");

  assert.deepEqual(harness.killed, [
    { pid: 101, force: true },
    { pid: 202, force: true },
  ]);
});

test("k accepts comma-separated indexes when preserved by the shell", async () => {
  const harness = createHarness();
  await run(harness, "k", "1,2");

  assert.deepEqual(
    harness.killed.map(({ pid }) => pid),
    [101, 202],
  );
});

test("--no-force disables forced termination", async () => {
  const harness = createHarness();
  await run(harness, "k", "1", "--no-force");

  assert.deepEqual(harness.killed, [{ pid: 101, force: false }]);
});

test("--force remains accepted for compatibility", async () => {
  const harness = createHarness();
  await run(harness, "k", "1", "--force");

  assert.deepEqual(harness.killed, [{ pid: 101, force: true }]);
});

test("invalid indexes fail before any process is killed", async () => {
  const harness = createHarness();

  await assert.rejects(run(harness, "k", "1", "3"), /Index 3 does not exist/);
  assert.deepEqual(harness.killed, []);
});

test("kill-pid refuses non-Node processes without --yes", async () => {
  const harness = createHarness({
    processByPid: {
      pid: 77,
      processName: "postgres.exe",
      command: "postgres",
      executablePath: "C:\\postgres.exe",
      parentProcessId: 1,
    },
  });

  await assert.rejects(
    run(harness, "kill-pid", "77"),
    /Refusing to kill it without --yes/,
  );
  assert.deepEqual(harness.killed, []);
});

test("kill-pid allows an acknowledged non-Node process", async () => {
  const harness = createHarness({
    processByPid: {
      pid: 77,
      processName: "other.exe",
      command: "other",
      executablePath: "C:\\other.exe",
      parentProcessId: 1,
    },
  });

  await run(harness, "kill-pid", "77", "--yes");
  assert.deepEqual(harness.killed, [{ pid: 77, force: true }]);
});

test("kill-pid recognizes Linux Node.js process names", async () => {
  const harness = createHarness({
    processByPid: {
      pid: 88,
      processName: "node",
      command: "node server.js",
      executablePath: "/usr/bin/node",
      parentProcessId: 1,
    },
  });

  await run(harness, "kill-pid", "88");
  assert.deepEqual(harness.killed, [{ pid: 88, force: true }]);
});

test("missing port and PID targets set a failing exit code", async () => {
  const portHarness = createHarness({ processes: [] });
  await run(portHarness, "kill", "9999");
  assert.deepEqual(portHarness.exitCodes, [1]);
  assert.match(portHarness.errors[0], /No Node\.js process/);

  const pidHarness = createHarness({ processByPid: null });
  await run(pidHarness, "kill-pid", "9999");
  assert.deepEqual(pidHarness.exitCodes, [1]);
  assert.match(pidHarness.errors[0], /No running process/);
});

test("update reports progress and keeps the existing link", async () => {
  const harness = createHarness();
  await run(harness, "update");

  assert.deepEqual(harness.updateSteps, ["pull", "install", "build"]);
  assert.match(
    harness.logs.join("\n"),
    /Updated devports \(1111111 → 2222222\)/,
  );
  assert.match(harness.logs.join("\n"), /existing npm link remains active/);
});
