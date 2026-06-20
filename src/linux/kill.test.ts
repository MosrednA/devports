import assert from "node:assert/strict";
import test from "node:test";
import { findDescendants, killLinuxProcessTree } from "./kill";

test("findDescendants returns children deepest-first", () => {
  const parentByPid = new Map([
    [11, 10],
    [12, 10],
    [13, 11],
    [99, 1],
  ]);

  assert.deepEqual(findDescendants(10, parentByPid), [13, 11, 12]);
});

test("killLinuxProcessTree sends SIGKILL deepest-first by default", async () => {
  const signals: Array<[number, NodeJS.Signals]> = [];

  const result = await killLinuxProcessTree(
    10,
    true,
    (pid, signal) => signals.push([pid, signal]),
    async () =>
      new Map([
        [11, 10],
        [12, 10],
        [13, 11],
      ]),
  );

  assert.deepEqual(signals, [
    [13, "SIGKILL"],
    [11, "SIGKILL"],
    [12, "SIGKILL"],
    [10, "SIGKILL"],
  ]);
  assert.match(result.stdout, /13, 11, 12, 10/);
});

test("killLinuxProcessTree uses SIGTERM in no-force mode", async () => {
  const signals: NodeJS.Signals[] = [];

  await killLinuxProcessTree(
    10,
    false,
    (_pid, signal) => signals.push(signal),
    async () => new Map(),
  );

  assert.deepEqual(signals, ["SIGTERM"]);
});
