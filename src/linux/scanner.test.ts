import assert from "node:assert/strict";
import test from "node:test";
import { parseSsOutput, scanLinuxNodePorts } from "./scanner";

const ssOutput = [
  'LISTEN 0 511 127.0.0.1:3000 0.0.0.0:* users:(("node",pid=101,fd=20))',
  'LISTEN 0 511 [::]:5173 [::]:* users:(("node",pid=202,fd=21))',
  'LISTEN 0 128 127.0.0.1:5432 0.0.0.0:* users:(("postgres",pid=303,fd=7))',
].join("\n");

test("parseSsOutput extracts IPv4 and IPv6 listeners", () => {
  assert.deepEqual(parseSsOutput(ssOutput), [
    {
      address: "127.0.0.1",
      port: 3000,
      pid: 101,
      processName: "node",
    },
    {
      address: "::",
      port: 5173,
      pid: 202,
      processName: "node",
    },
    {
      address: "127.0.0.1",
      port: 5432,
      pid: 303,
      processName: "postgres",
    },
  ]);
});

test("scanLinuxNodePorts keeps only Node.js listeners", async () => {
  const rows = await scanLinuxNodePorts(
    async () => ({ stdout: ssOutput, stderr: "" }),
    async (pid) => ({
      pid,
      processName: pid === 303 ? "postgres" : "node",
      command: pid === 101 ? "node api.js" : "node vite.js",
      executablePath: pid === 303 ? "/usr/bin/postgres" : "/usr/bin/node",
      parentProcessId: 1,
    }),
  );

  assert.deepEqual(
    rows.map(({ port, pid, url }) => ({ port, pid, url })),
    [
      { port: 3000, pid: 101, url: "http://localhost:3000" },
      { port: 5173, pid: 202, url: "http://localhost:5173" },
    ],
  );
});
