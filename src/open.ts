import { spawn } from "node:child_process";
import {
  getSupportedPlatform,
  isWsl,
  type SupportedPlatform,
} from "./platform";

export function getOpenCommand(
  url: string,
  platform: SupportedPlatform,
  wsl: boolean,
): { executable: string; args: string[] } {
  return platform === "win32" || wsl
    ? {
        executable: "cmd.exe",
        args: ["/d", "/s", "/c", "start", "", url],
      }
    : { executable: "xdg-open", args: [url] };
}

export async function openLocalhost(port: number): Promise<string> {
  const url = `http://localhost:${port}`;
  const platform = getSupportedPlatform();
  const command = getOpenCommand(url, platform, isWsl());

  await new Promise<void>((resolve, reject) => {
    const child = spawn(command.executable, command.args, {
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
