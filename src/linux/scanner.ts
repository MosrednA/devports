import { execFile } from "node:child_process";
import { readFile, readlink } from "node:fs/promises";
import { basename } from "node:path";
import { promisify } from "node:util";
import type { CommandResult, NodePortProcess, ProcessInfo } from "../types";
import { createUrl } from "../url";

const execFileAsync = promisify(execFile);

export type LinuxListener = {
  port: number;
  address: string;
  pid: number;
  processName: string;
};

type LinuxCommandRunner = (
  executable: string,
  args: string[],
) => Promise<CommandResult>;

type LinuxProcessReader = (pid: number) => Promise<ProcessInfo | null>;

async function defaultRunner(
  executable: string,
  args: string[],
): Promise<CommandResult> {
  try {
    const { stdout, stderr } = await execFileAsync(executable, args, {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    });
    return { stdout, stderr };
  } catch (error) {
    const cause = error as NodeJS.ErrnoException & { stderr?: string };
    if (cause.code === "ENOENT") {
      throw new Error(
        "Could not run `ss`. Install the Linux `iproute2` package and try again.",
        { cause: error },
      );
    }
    throw new Error(
      `Could not scan Linux TCP listeners: ${cause.stderr?.trim() || cause.message}`,
      { cause: error },
    );
  }
}

function parseEndpoint(endpoint: string): {
  address: string;
  port: number;
} | null {
  const match = endpoint.match(/^(.*):(\d+)$/);
  if (!match) {
    return null;
  }

  const port = Number(match[2]);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return null;
  }

  let address = match[1];
  if (address.startsWith("[") && address.endsWith("]")) {
    address = address.slice(1, -1);
  }
  if (address === "*") {
    address = "0.0.0.0";
  }

  return { address, port };
}

export function parseSsOutput(output: string): LinuxListener[] {
  const listeners: LinuxListener[] = [];
  const seen = new Set<string>();

  for (const line of output.split(/\r?\n/)) {
    const columns = line.trim().split(/\s+/);
    if (columns.length < 6) {
      continue;
    }

    const endpoint = parseEndpoint(columns[3]);
    const pidMatch = line.match(/\bpid=(\d+)/);
    const nameMatch = line.match(/users:\(\("([^"]+)"/);
    if (!endpoint || !pidMatch || !nameMatch) {
      continue;
    }

    const pid = Number(pidMatch[1]);
    if (!Number.isInteger(pid) || pid < 1) {
      continue;
    }

    const key = `${endpoint.address}:${endpoint.port}:${pid}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    listeners.push({
      ...endpoint,
      pid,
      processName: nameMatch[1],
    });
  }

  return listeners;
}

function isNodeProcess(processInfo: ProcessInfo, fallbackName = ""): boolean {
  const names = [
    processInfo.processName,
    processInfo.executablePath ? basename(processInfo.executablePath) : "",
    fallbackName,
  ].map((value) => value.toLowerCase());

  return names.some((name) => name === "node" || name === "nodejs");
}

export async function readLinuxProcess(
  pid: number,
): Promise<ProcessInfo | null> {
  try {
    const [status, commandBuffer, executablePath] = await Promise.all([
      readFile(`/proc/${pid}/status`, "utf8"),
      readFile(`/proc/${pid}/cmdline`),
      readlink(`/proc/${pid}/exe`).catch(() => null),
    ]);

    const name = status.match(/^Name:\s+(.+)$/m)?.[1]?.trim() || "<unknown>";
    const parentProcessId = Number(status.match(/^PPid:\s+(\d+)$/m)?.[1] ?? "");
    const commandParts = commandBuffer
      .toString("utf8")
      .split("\0")
      .filter(Boolean);

    return {
      pid,
      processName: executablePath ? basename(executablePath) : name,
      command: commandParts.length > 0 ? commandParts.join(" ") : null,
      executablePath,
      parentProcessId: Number.isInteger(parentProcessId)
        ? parentProcessId
        : null,
    };
  } catch (error) {
    const cause = error as NodeJS.ErrnoException;
    if (cause.code === "ENOENT") {
      return null;
    }

    return {
      pid,
      processName: "<unavailable>",
      command: null,
      executablePath: null,
      parentProcessId: null,
    };
  }
}

export async function scanLinuxNodePorts(
  runner: LinuxCommandRunner = defaultRunner,
  processReader: LinuxProcessReader = readLinuxProcess,
): Promise<NodePortProcess[]> {
  const { stdout } = await runner("ss", ["-H", "-ltnp"]);
  const listeners = parseSsOutput(stdout);
  const processCache = new Map<number, ProcessInfo | null>();
  const results: NodePortProcess[] = [];

  for (const listener of listeners) {
    if (!processCache.has(listener.pid)) {
      processCache.set(listener.pid, await processReader(listener.pid));
    }
    const processInfo = processCache.get(listener.pid);
    if (!processInfo || !isNodeProcess(processInfo, listener.processName)) {
      continue;
    }

    results.push({
      port: listener.port,
      address: listener.address,
      pid: listener.pid,
      processName: processInfo.processName,
      command: processInfo.command,
      executablePath: processInfo.executablePath,
      parentProcessId: processInfo.parentProcessId,
      url: createUrl(listener.address, listener.port),
    });
  }

  return results.sort(
    (left, right) => left.port - right.port || left.pid - right.pid,
  );
}

export async function scanLinuxNodePortsRaw(
  runner: LinuxCommandRunner = defaultRunner,
): Promise<string> {
  return (await runner("ss", ["-H", "-ltnp"])).stdout;
}
