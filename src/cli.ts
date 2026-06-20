import { readFileSync } from "node:fs";
import { join } from "node:path";
import pc from "picocolors";
import { createProgram } from "./cli-program";

const packageJson = JSON.parse(
  readFileSync(join(__dirname, "..", "package.json"), "utf8"),
) as { version: string };

const program = createProgram(packageJson.version);

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(pc.red(`ERROR: ${message}`));
  process.exitCode = 1;
});
