import type { NodePortProcess, WindowsProcess } from "./types";
import { runPowerShell } from "./windows/powershell";
import {
  getProcessByPidScript,
  LIST_NODE_PORTS_SCRIPT,
} from "./windows/scripts";

type RawNodePortRow = {
  port?: unknown;
  address?: unknown;
  pid?: unknown;
  processName?: unknown;
  command?: unknown;
  executablePath?: unknown;
  parentProcessId?: unknown;
};

type PowerShellRunner = (
  script: string,
) => Promise<{ stdout: string; stderr: string }>;

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function nullableNumber(value: unknown): number | null {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : null;
}

export function createUrl(address: string, port: number): string {
  const localhostAddresses = new Set(["127.0.0.1", "::1", "0.0.0.0", "::"]);
  const host = localhostAddresses.has(address)
    ? "localhost"
    : address.includes(":")
      ? `[${address}]`
      : address;

  return `http://${host}:${port}`;
}

export function parseNodePortOutput(output: string): NodePortProcess[] {
  const trimmed = output.trim();
  if (!trimmed) {
    return [];
  }

  let parsed: RawNodePortRow | RawNodePortRow[];
  try {
    parsed = JSON.parse(trimmed) as RawNodePortRow | RawNodePortRow[];
  } catch {
    throw new Error("PowerShell returned invalid JSON while scanning ports.");
  }

  const rows = Array.isArray(parsed) ? parsed : [parsed];
  const result: NodePortProcess[] = [];

  for (const row of rows) {
    if (!row || typeof row !== "object") {
      continue;
    }

    const port = Number(row.port);
    const pid = Number(row.pid);
    const address =
      typeof row.address === "string" && row.address.length > 0
        ? row.address
        : "0.0.0.0";
    const processName =
      typeof row.processName === "string" && row.processName.length > 0
        ? row.processName
        : "node.exe";

    if (
      !Number.isInteger(port) ||
      port < 1 ||
      port > 65535 ||
      !Number.isInteger(pid) ||
      pid < 1
    ) {
      continue;
    }

    result.push({
      port,
      address,
      pid,
      processName,
      command: nullableString(row.command),
      executablePath: nullableString(row.executablePath),
      parentProcessId: nullableNumber(row.parentProcessId),
      url: createUrl(address, port),
    });
  }

  return result.sort(
    (left, right) => left.port - right.port || left.pid - right.pid,
  );
}

export async function scanNodePorts(
  runner: PowerShellRunner = runPowerShell,
): Promise<NodePortProcess[]> {
  const { stdout } = await runner(LIST_NODE_PORTS_SCRIPT);
  return parseNodePortOutput(stdout);
}

export async function scanNodePortsRaw(
  runner: PowerShellRunner = runPowerShell,
): Promise<string> {
  const { stdout } = await runner(LIST_NODE_PORTS_SCRIPT);
  return stdout;
}

export function parseProcessOutput(output: string): WindowsProcess | null {
  if (!output.trim()) {
    return null;
  }

  let row: RawNodePortRow;
  try {
    row = JSON.parse(output) as RawNodePortRow;
  } catch {
    throw new Error(
      "PowerShell returned invalid JSON while reading the process.",
    );
  }

  const pid = Number(row.pid);
  if (!Number.isInteger(pid) || pid < 1) {
    return null;
  }

  return {
    pid,
    processName:
      typeof row.processName === "string" && row.processName.length > 0
        ? row.processName
        : "<unknown>",
    command: nullableString(row.command),
    executablePath: nullableString(row.executablePath),
    parentProcessId: nullableNumber(row.parentProcessId),
  };
}

export async function getProcessByPid(
  pid: number,
  runner: PowerShellRunner = runPowerShell,
): Promise<WindowsProcess | null> {
  const { stdout } = await runner(getProcessByPidScript(pid));
  return parseProcessOutput(stdout);
}
