#!/usr/bin/env node

"use strict";

const { existsSync } = require("node:fs");
const { join } = require("node:path");

const cliPath = join(__dirname, "..", "dist", "cli.js");
if (!existsSync(cliPath)) {
  console.error("devports has not been built. Run `npm run build` first.");
  process.exitCode = 1;
} else {
  require(cliPath);
}
