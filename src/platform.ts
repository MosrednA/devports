import { readFileSync } from "node:fs";

export type SupportedPlatform = "win32" | "linux";

export function getSupportedPlatform(
  platform: NodeJS.Platform = process.platform,
): SupportedPlatform {
  if (platform === "win32" || platform === "linux") {
    return platform;
  }

  throw new Error(
    `devports does not support ${platform} yet. Supported platforms: Windows and Linux (including WSL).`,
  );
}

export function isWsl(): boolean {
  if (process.platform !== "linux") {
    return false;
  }

  if (process.env.WSL_DISTRO_NAME || process.env.WSL_INTEROP) {
    return true;
  }

  try {
    return /microsoft/i.test(readFileSync("/proc/version", "utf8"));
  } catch {
    return false;
  }
}
