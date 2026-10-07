---
name: devports
description:
  Install and use the DevPorts CLI to inspect Node.js TCP listeners, resolve
  EADDRINUSE conflicts, open localhost URLs, and stop development servers on
  Windows, Linux, or WSL. Use when a task involves identifying or cleaning up
  local Node.js servers.
---

# DevPorts

DevPorts discovers Node.js processes listening on local TCP ports and can stop
their process trees. It supports Windows 10/11, Linux, and WSL 1/2 with Node.js
22 or newer. macOS is not supported. Each installation manages its own
environment; WSL cannot manage Windows-host processes or another distribution.

## Install the CLI

Check an existing installation with `devports version`. If setup is needed,
clone into a dedicated tools directory, using the user's chosen location when
provided. Git is required; Linux and WSL also need `ss` from `iproute2`.

Run these commands in PowerShell, Linux, or WSL from the parent tools directory:

```sh
git clone https://github.com/MosrednA/devports.git
cd devports
npm ci
npm run build
node bin/devports.js version
node bin/devports.js list --json
```

DevPorts is not published to npm; do not use `npm install -g devports`. Keep an
existing checkout rather than overwriting it. If `ss` is unavailable on Debian
or Ubuntu, install it with `sudo apt install iproute2` when dependency setup is
in scope.

For global commands, run `npm link` from the checkout when global installation
is requested. This creates both `devports` and `devport` for the active Node.js
installation. Without a global link, replace `devports` in the examples below
with `node /path/to/devports/bin/devports.js`, quoting paths containing spaces.

## Inspect and select a target

```sh
devports list --json
```

The result is always an array. Entries include `port`, `pid`, `address`,
`processName`, `command`, `executablePath`, `parentProcessId`, and `url`.
Command and executable information may be null.

Match the port, PID, and command to the user's request or a server belonging to
the current task. If ownership or permission to stop it is unclear, report the
listener and ask before terminating it. For a server managed by a preview tool
or task runner, use that owner's stop operation when available.

## Stop and verify

Prefer the narrowest target. When application cleanup matters, try without force
first:

```sh
devports kill 5173 --no-force
devports list --json
```

`--no-force` uses `taskkill /T` on Windows and `SIGTERM` on Linux/WSL; graceful
shutdown is not guaranteed. If the same intended listener remains and forced
termination is in scope, run `devports kill 5173` and inspect again. Forced
termination is the default (`taskkill /T /F` or `SIGKILL`). Children are also
terminated.

- `devports k 1 2` stops displayed indexes. Refresh the listing immediately
  before using indexes; they can change between scans.
- `devports kill-pid 22610` targets a PID. Its `--yes` option permits a non-Node
  process; use that override only when stopping that process is authorized.
- `devports kill-all` previews targets and exits with a nonzero code.
  `devports kill-all --yes` and `devports nuke` stop all listed Node.js process
  trees. Use them only when the user's request covers every listed target;
  `nuke` has no confirmation step.

Check exit codes and run a fresh listing after termination. Report which port
and PID stopped, whether force was used, and whether the matching listener
remains. The scan covers Node.js listeners only; it cannot prove that a port is
free of non-Node processes.

## Open or update

`devports open 5173` opens a localhost URL in the Windows browser on Windows/WSL
or via `xdg-open` on desktop Linux.

`devports update` updates a source checkout on a branch. It requires no local
changes, pulls with `--ff-only`, installs dependencies, and rebuilds. Preserve
local work if updating is refused.

Full command reference:
[Usage guide](https://github.com/MosrednA/devports/blob/main/docs/usage.md).
