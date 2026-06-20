export function createUrl(address: string, port: number): string {
  const localhostAddresses = new Set(["127.0.0.1", "::1", "0.0.0.0", "::"]);
  const host = localhostAddresses.has(address)
    ? "localhost"
    : address.includes(":")
      ? `[${address}]`
      : address;

  return `http://${host}:${port}`;
}
