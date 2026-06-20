import assert from "node:assert/strict";
import test from "node:test";
import { getOpenCommand } from "./open";

test("getOpenCommand uses the Windows browser on Windows and WSL", () => {
  const url = "http://localhost:3000";
  const expected = {
    executable: "cmd.exe",
    args: ["/d", "/s", "/c", "start", "", url],
  };

  assert.deepEqual(getOpenCommand(url, "win32", false), expected);
  assert.deepEqual(getOpenCommand(url, "linux", true), expected);
});

test("getOpenCommand uses xdg-open on desktop Linux", () => {
  assert.deepEqual(getOpenCommand("http://localhost:3000", "linux", false), {
    executable: "xdg-open",
    args: ["http://localhost:3000"],
  });
});
