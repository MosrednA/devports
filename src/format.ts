import pc from "picocolors";
import type { NodePortProcess } from "./types";

const HEADERS = ["#", "Port", "PID", "Address", "Process", "Command"] as const;

function truncate(value: string, width: number): string {
  if (value.length <= width) {
    return value;
  }
  if (width <= 1) {
    return value.slice(0, width);
  }
  return `${value.slice(0, width - 1)}…`;
}

function pad(value: string, width: number): string {
  return value.padEnd(width, " ");
}

export function formatTable(
  processes: NodePortProcess[],
  terminalWidth = process.stdout.columns || 100,
): string {
  const fixedWidths = {
    index: Math.max(HEADERS[0].length, String(processes.length).length),
    port: Math.max(
      HEADERS[1].length,
      ...processes.map((item) => String(item.port).length),
    ),
    pid: Math.max(
      HEADERS[2].length,
      ...processes.map((item) => String(item.pid).length),
    ),
    address: Math.min(
      24,
      Math.max(
        HEADERS[3].length,
        ...processes.map((item) => item.address.length),
      ),
    ),
    process: Math.min(
      16,
      Math.max(
        HEADERS[4].length,
        ...processes.map((item) => item.processName.length),
      ),
    ),
  };
  const separatorWidth = 2 * 5;
  const usedWidth =
    fixedWidths.index +
    fixedWidths.port +
    fixedWidths.pid +
    fixedWidths.address +
    fixedWidths.process +
    separatorWidth;
  const commandWidth = Math.max(20, terminalWidth - usedWidth);

  const header = [
    pad(HEADERS[0], fixedWidths.index),
    pad(HEADERS[1], fixedWidths.port),
    pad(HEADERS[2], fixedWidths.pid),
    pad(HEADERS[3], fixedWidths.address),
    pad(HEADERS[4], fixedWidths.process),
    HEADERS[5],
  ].join("  ");

  const rows = processes.map((item, index) =>
    [
      pad(String(index + 1), fixedWidths.index),
      pad(String(item.port), fixedWidths.port),
      pad(String(item.pid), fixedWidths.pid),
      pad(truncate(item.address, fixedWidths.address), fixedWidths.address),
      pad(truncate(item.processName, fixedWidths.process), fixedWidths.process),
      truncate(item.command || "<unavailable>", commandWidth),
    ].join("  "),
  );

  return [pc.bold(header), ...rows].join("\n");
}

export function formatProcessDetails(process: NodePortProcess): string {
  return [
    `Port:    ${process.port}`,
    `PID:     ${process.pid}`,
    `Address: ${process.address}`,
    `Command: ${process.command || "<unavailable>"}`,
  ].join("\n");
}
