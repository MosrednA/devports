import assert from "node:assert/strict";
import test from "node:test";
import { formatTable } from "./format";
import { killProcessTree, taskkillArguments } from "./kill";
import { createUrl, parseNodePortOutput, parseProcessOutput } from "./scanner";
import { parseIndexes, parsePid, parsePort } from "./validation";

test("parseNodePortOutput normalizes a single object and adds a URL", () => {
  const result = parseNodePortOutput(
    JSON.stringify({
      port: 5173,
      address: "0.0.0.0",
      pid: 1234,
      processName: "node.exe",
      command: "node vite.js",
      executablePath: "C:\\node.exe",
      parentProcessId: 1000,
    }),
  );

  assert.equal(result.length, 1);
  assert.equal(result[0].url, "http://localhost:5173");
  assert.equal(result[0].pid, 1234);
});

test("parseNodePortOutput always returns a sorted array", () => {
  const result = parseNodePortOutput(
    JSON.stringify([
      { port: 9000, address: "::1", pid: 5, processName: "node.exe" },
      { port: 3000, address: "127.0.0.1", pid: 10, processName: "node.exe" },
      { port: 3000, address: "127.0.0.1", pid: 2, processName: "node.exe" },
    ]),
  );

  assert.deepEqual(
    result.map(({ port, pid }) => [port, pid]),
    [
      [3000, 2],
      [3000, 10],
      [9000, 5],
    ],
  );
});

test("createUrl handles localhost and non-local IPv6 addresses", () => {
  assert.equal(createUrl("::", 3000), "http://localhost:3000");
  assert.equal(createUrl("192.168.1.4", 3000), "http://192.168.1.4:3000");
  assert.equal(createUrl("fe80::1", 3000), "http://[fe80::1]:3000");
});

test("taskkillArguments adds /F only in force mode", () => {
  assert.deepEqual(taskkillArguments(123), ["/PID", "123", "/T", "/F"]);
  assert.deepEqual(taskkillArguments(123, false), ["/PID", "123", "/T"]);
  assert.deepEqual(taskkillArguments(123, true), ["/PID", "123", "/T", "/F"]);
});

test("killProcessTree defaults to forced termination", async () => {
  let receivedArgs: string[] = [];
  await killProcessTree(
    123,
    undefined,
    async (_executable, args) => {
      receivedArgs = args;
      return { stdout: "", stderr: "" };
    },
    "win32",
  );

  assert.deepEqual(receivedArgs, ["/PID", "123", "/T", "/F"]);
});

test("port and PID validation rejects unsafe values", () => {
  assert.equal(parsePort("65535"), 65535);
  assert.equal(parsePid("42"), 42);
  assert.throws(() => parsePort("0"), /Invalid port/);
  assert.throws(() => parsePort("5173 & calc"), /Invalid port/);
  assert.throws(() => parsePid("-1"), /Invalid PID/);
});

test("parseIndexes accepts comma-separated indexes and removes duplicates", () => {
  assert.deepEqual(parseIndexes("1, 2,4,2"), [1, 2, 4]);
  assert.deepEqual(parseIndexes(["1", "2", "4"]), [1, 2, 4]);
  assert.deepEqual(parseIndexes(["1,2", "4"]), [1, 2, 4]);
  assert.throws(() => parseIndexes("0,2"), /Invalid indexes/);
  assert.throws(() => parseIndexes("1; calc"), /Invalid indexes/);
});

test("parseProcessOutput handles missing and populated output", () => {
  assert.equal(parseProcessOutput(""), null);
  assert.deepEqual(
    parseProcessOutput(
      JSON.stringify({
        pid: 22,
        processName: "node.exe",
        command: null,
        executablePath: "C:\\node.exe",
        parentProcessId: 1,
      }),
    ),
    {
      pid: 22,
      processName: "node.exe",
      command: null,
      executablePath: "C:\\node.exe",
      parentProcessId: 1,
    },
  );
});

test("formatTable includes required fields and truncates long commands", () => {
  const output = formatTable(
    [
      {
        port: 3000,
        pid: 1234,
        address: "127.0.0.1",
        processName: "node.exe",
        command: "node " + "x".repeat(200),
        executablePath: null,
        parentProcessId: null,
        url: "http://localhost:3000",
      },
    ],
    80,
  );

  assert.match(output, /Port/);
  assert.match(output, /#\s+Port/);
  assert.match(output, /\n1\s+3000/);
  assert.match(output, /3000/);
  assert.match(output, /node\.exe/);
  assert.match(output, /…/);
});
