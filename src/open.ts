import { spawn } from "node:child_process";

export async function openLocalhost(port: number): Promise<string> {
  if (process.platform !== "win32") {
    throw new Error("devports currently requires Windows.");
  }

  const url = `http://localhost:${port}`;
  await new Promise<void>((resolve, reject) => {
    const child = spawn("cmd.exe", ["/d", "/s", "/c", "start", "", url], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    });

    child.once("spawn", () => {
      child.unref();
      resolve();
    });
    child.once("error", (error) => {
      reject(new Error(`Could not open ${url}: ${error.message}`));
    });
  });

  return url;
}
