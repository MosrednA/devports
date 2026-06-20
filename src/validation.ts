export function parsePort(value: string): number {
  const port = Number(value);
  if (
    !/^\d+$/.test(value) ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    throw new Error(
      `Invalid port "${value}". Expected a number from 1 to 65535.`,
    );
  }
  return port;
}

export function parsePid(value: string): number {
  const pid = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(pid) || pid < 1) {
    throw new Error(`Invalid PID "${value}". Expected a positive integer.`);
  }
  return pid;
}

export function parseIndexes(value: string | string[]): number[] {
  const input = Array.isArray(value) ? value : [value];
  const parts = input.flatMap((item) =>
    item.split(",").map((part) => part.trim()),
  );
  if (
    parts.length === 0 ||
    parts.some((part) => !/^\d+$/.test(part) || Number(part) < 1)
  ) {
    throw new Error(
      `Invalid indexes "${input.join(" ")}". Expected positive numbers, such as 1 2 4.`,
    );
  }

  return [...new Set(parts.map(Number))];
}
