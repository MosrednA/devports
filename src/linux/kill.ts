import { readdir, readFile } from "node:fs/promises";
import type { CommandResult } from "../types";

type SignalSender = (pid: number, signal: NodeJS.Signals) => void;

async function readParentProcessIds(): Promise<Map<number, number>> {
  const parentByPid = new Map<number, number>();
  const entries = await readdir("/proc", { withFileTypes: true });

  await Promise.all(
    entries
      .filter((entry) => entry.isDirectory() && /^\d+$/.test(entry.name))
      .map(async (entry) => {
        const pid = Number(entry.name);
        try {
          const status = await readFile(`/proc/${pid}/status`, "utf8");
          const parentPid = Number(status.match(/^PPid:\s+(\d+)$/m)?.[1] ?? "");
          if (Number.isInteger(parentPid)) {
            parentByPid.set(pid, parentPid);
          }
        } catch {
          // Processes may exit or become unreadable while /proc is scanned.
        }
      }),
  );

  return parentByPid;
}

export function findDescendants(
  rootPid: number,
  parentByPid: ReadonlyMap<number, number>,
): number[] {
  const childrenByPid = new Map<number, number[]>();
  for (const [pid, parentPid] of parentByPid) {
    const children = childrenByPid.get(parentPid) ?? [];
    children.push(pid);
    childrenByPid.set(parentPid, children);
  }

  const descendants: number[] = [];
  const visit = (pid: number): void => {
    for (const childPid of childrenByPid.get(pid) ?? []) {
      visit(childPid);
      descendants.push(childPid);
    }
  };
  visit(rootPid);
  return descendants;
}

export async function killLinuxProcessTree(
  pid: number,
  force = true,
  signalSender: SignalSender = process.kill,
  parentReader: () => Promise<Map<number, number>> = readParentProcessIds,
): Promise<CommandResult> {
  const signal: NodeJS.Signals = force ? "SIGKILL" : "SIGTERM";
  const parentByPid = await parentReader();
  const targets = [...findDescendants(pid, parentByPid), pid];
  const killed: number[] = [];

  for (const targetPid of targets) {
    try {
      signalSender(targetPid, signal);
      killed.push(targetPid);
    } catch (error) {
      const cause = error as NodeJS.ErrnoException;
      if (cause.code === "ESRCH") {
        continue;
      }
      if (cause.code === "EPERM") {
        throw new Error(
          `Could not kill PID ${targetPid}. Try running with sufficient permissions.`,
          { cause: error },
        );
      }
      throw new Error(`Could not kill PID ${targetPid}: ${cause.message}`, {
        cause: error,
      });
    }
  }

  return {
    stdout: `Sent ${signal} to PIDs: ${killed.join(", ")}`,
    stderr: "",
  };
}
