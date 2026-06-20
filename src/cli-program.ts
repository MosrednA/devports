import { Command } from "commander";
import pc from "picocolors";
import { formatProcessDetails, formatTable } from "./format";
import { killProcessTree } from "./kill";
import { openLocalhost } from "./open";
import { getProcessByPid, scanNodePorts, scanNodePortsRaw } from "./scanner";
import type { NodePortProcess, WindowsProcess } from "./types";
import { parseIndexes, parsePid, parsePort } from "./validation";

type ListOptions = {
  json?: boolean;
  raw?: boolean;
};

type KillOptions = {
  force?: boolean;
  yes?: boolean;
};

export type CliDependencies = {
  scanNodePorts: () => Promise<NodePortProcess[]>;
  scanNodePortsRaw: () => Promise<string>;
  getProcessByPid: (pid: number) => Promise<WindowsProcess | null>;
  killProcessTree: (
    pid: number,
    force?: boolean,
  ) => Promise<{ stdout: string; stderr: string }>;
  openLocalhost: (port: number) => Promise<string>;
};

export type CliIo = {
  log: (message: string) => void;
  error: (message: string) => void;
  write: (message: string) => void;
  setExitCode: (code: number) => void;
};

const defaultDependencies: CliDependencies = {
  scanNodePorts,
  scanNodePortsRaw,
  getProcessByPid,
  killProcessTree,
  openLocalhost,
};

const defaultIo: CliIo = {
  log: console.log,
  error: console.error,
  write: (message) => process.stdout.write(message),
  setExitCode: (code) => {
    process.exitCode = code;
  },
};

function shouldForceKill(options: KillOptions): boolean {
  return options.force !== false;
}

function addKillOptions(command: Command, includeYes = false): Command {
  command
    .option("-f, --force", "force termination with taskkill /F (default)", true)
    .option("--no-force", "try termination without taskkill /F");

  if (includeYes) {
    command.option(
      "-y, --yes",
      "allow killing a PID that is not recognized as Node.js",
    );
  }

  return command;
}

export function createProgram(
  version: string,
  dependencies: CliDependencies = defaultDependencies,
  io: CliIo = defaultIo,
): Command {
  async function listProcesses(options: ListOptions): Promise<void> {
    if (options.json && options.raw) {
      throw new Error("Choose either --json or --raw, not both.");
    }

    if (options.raw) {
      io.write(await dependencies.scanNodePortsRaw());
      return;
    }

    const processes = await dependencies.scanNodePorts();
    if (options.json) {
      io.log(JSON.stringify(processes, null, 2));
      return;
    }

    if (processes.length === 0) {
      io.log("No listening Node.js processes found.");
      return;
    }

    io.log(formatTable(processes));
  }

  async function killByPort(
    portValue: string,
    options: KillOptions,
  ): Promise<void> {
    const port = parsePort(portValue);
    const processes = await dependencies.scanNodePorts();
    const matching = processes.filter((process) => process.port === port);

    if (matching.length === 0) {
      io.error(`No Node.js process found listening on port ${port}.`);
      io.setExitCode(1);
      return;
    }

    const processToKill = matching[0];
    io.log(`Killing Node.js process on port ${port}\n`);
    io.log(formatProcessDetails(processToKill));
    if (matching.length > 1) {
      io.log(
        pc.yellow(
          `\nMultiple Node.js listeners matched this port; killing PID ${processToKill.pid} only.`,
        ),
      );
    }

    await dependencies.killProcessTree(
      processToKill.pid,
      shouldForceKill(options),
    );
    io.log(pc.green("\nSUCCESS: Sent termination signal to process tree."));
  }

  async function killByIndexes(
    indexesValue: string[],
    options: KillOptions,
  ): Promise<void> {
    const indexes = parseIndexes(indexesValue);
    const processes = await dependencies.scanNodePorts();

    if (processes.length === 0) {
      io.error("No listening Node.js processes found.");
      io.setExitCode(1);
      return;
    }

    const invalidIndexes = indexes.filter((index) => index > processes.length);
    if (invalidIndexes.length > 0) {
      throw new Error(
        `Index ${invalidIndexes.join(", ")} does not exist. ` +
          `Choose from 1 to ${processes.length}.`,
      );
    }

    const selected = indexes.map((index) => ({
      index,
      process: processes[index - 1],
    }));
    const uniqueByPid = [
      ...new Map(selected.map((item) => [item.process.pid, item])).values(),
    ];

    io.log(`Killing ${uniqueByPid.length} Node.js process tree(s)\n`);
    for (const item of uniqueByPid) {
      io.log(
        `#${item.index}  Port ${item.process.port}  PID ${item.process.pid}  ` +
          `${item.process.command || "<unavailable>"}`,
      );
    }

    const failures: string[] = [];
    for (const item of uniqueByPid) {
      try {
        await dependencies.killProcessTree(
          item.process.pid,
          shouldForceKill(options),
        );
        io.log(
          pc.green(
            `SUCCESS: Killed #${item.index} (port ${item.process.port}, PID ${item.process.pid}).`,
          ),
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failures.push(`#${item.index}: ${message}`);
        io.error(pc.red(`FAILED: #${item.index} (PID ${item.process.pid}).`));
      }
    }

    if (failures.length > 0) {
      throw new Error(
        `${failures.length} selected process tree(s) could not be killed.\n${failures.join("\n")}`,
      );
    }
  }

  async function killByPid(
    pidValue: string,
    options: KillOptions,
  ): Promise<void> {
    const pid = parsePid(pidValue);
    const found = await dependencies.getProcessByPid(pid);

    if (!found) {
      io.error(`No running process found with PID ${pid}.`);
      io.setExitCode(1);
      return;
    }

    const isNode = found.processName.toLowerCase() === "node.exe";
    if (!isNode && !options.yes) {
      throw new Error(
        `PID ${pid} is ${found.processName}, not a recognized Node.js process. ` +
          `Refusing to kill it without --yes.`,
      );
    }

    io.log(`Killing process PID ${pid}\n`);
    io.log(`Process: ${found.processName}`);
    io.log(`Command: ${found.command || "<unavailable>"}`);

    if (!isNode) {
      io.log(
        pc.yellow(
          `\nWARNING: PID ${pid} is ${found.processName}, not a recognized Node.js process.`,
        ),
      );
    }

    await dependencies.killProcessTree(pid, shouldForceKill(options));
    io.log(pc.green("\nSUCCESS: Sent termination signal to process tree."));
  }

  function addListOptions(command: Command): Command {
    return command
      .option("--json", "print machine-readable JSON")
      .option("--raw", "print raw PowerShell JSON for debugging");
  }

  const program = new Command();
  program
    .name("devports")
    .description(
      "Find and manage Node.js processes listening on Windows TCP ports.",
    )
    .version(version)
    .showHelpAfterError()
    .action(async () => listProcesses({}));

  addListOptions(
    program.command("list").description("list listening Node.js processes"),
  ).action(listProcesses);

  addKillOptions(
    program
      .command("kill")
      .description("kill the Node.js process listening on a port")
      .argument("<port>", "TCP port"),
  ).action(killByPort);

  addKillOptions(
    program
      .command("kill-index")
      .alias("k")
      .description("kill one or more listed processes by index")
      .argument("<indexes...>", "list indexes, for example 1 2 4"),
  ).action(killByIndexes);

  addKillOptions(
    program
      .command("kill-pid")
      .description("kill a process tree by PID")
      .argument("<pid>", "process ID"),
    true,
  ).action(killByPid);

  program
    .command("open")
    .description("open a localhost port in the default browser")
    .argument("<port>", "TCP port")
    .action(async (portValue: string) => {
      const url = await dependencies.openLocalhost(parsePort(portValue));
      io.log(`Opened ${url}`);
    });

  program
    .command("version")
    .description("show the installed devports version")
    .action(() => io.log(version));

  return program;
}
