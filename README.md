# devports

[![CI](https://github.com/MosrednA/devports/actions/workflows/ci.yml/badge.svg)](https://github.com/MosrednA/devports/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Find and stop Node.js development servers by port, PID, or list index.

## Platform support

- Windows 10 and Windows 11
- Linux
- WSL 1 and WSL 2
- Node.js 22 or newer

Windows uses PowerShell, CIM, and `taskkill.exe`. Linux and WSL use `ss`,
`/proc`, and POSIX signals. macOS is not supported yet.

Each installation manages processes in its own environment:

- Run devports in Windows PowerShell to manage Windows Node.js processes.
- Run devports inside a WSL distribution to manage that distribution's Node.js
  processes.
- Run devports on Linux to manage Linux Node.js processes.

WSL devports does not manage Windows-host processes or processes in another WSL
distribution.

On Linux, install `iproute2` if `ss` is unavailable:

```bash
sudo apt install iproute2
```

## Features

- Lists Node.js processes listening on local TCP ports.
- Shows port, PID, address, process name, command, and URL.
- Stops one server by port or multiple servers by displayed index.
- Cleans up child processes instead of leaving dev-server wrappers running.
- Opens localhost URLs in the Windows browser from Windows/WSL or through
  `xdg-open` on desktop Linux.
- Provides stable JSON output for scripts and future desktop integrations.

## Use from source

`devports` is not published to the npm registry. Clone the repository and link
the command locally.

PowerShell:

```powershell
git clone https://github.com/MosrednA/devports.git
cd devports
npm ci
npm run build
npm link
```

Linux or WSL:

```bash
git clone https://github.com/MosrednA/devports.git
cd devports
npm ci
npm run build
npm link
```

This installs both command names globally for the current Node.js installation:

```text
devports
devport
```

To update later:

```text
devports update
```

The update command refuses to overwrite local changes. It pulls with
`--ff-only`, refreshes dependencies, rebuilds the project, and keeps the
existing global link active.

To remove the linked commands:

```text
npm unlink --global @mosredna/devports
```

## Usage

List active Node.js listeners:

```text
devports
devports list
```

Example:

```text
#  Port  PID    Address    Process   Command
1  3000  18432  127.0.0.1  node      npm run dev
2  5173  22610  127.0.0.1  node      vite
```

Stop one or more displayed entries:

```text
devports k 1 2
```

Indexes are temporary and may change as processes start or stop. Run `devports`
immediately before using `k`.

Stop the Node.js process listening on a port:

```text
devports kill 5173
```

Stop a process by PID:

```text
devports kill-pid 22610
```

For safety, `kill-pid` refuses non-Node processes unless explicitly
acknowledged:

```text
devports kill-pid 22610 --yes
```

Forced termination is the default:

- Windows: `taskkill.exe /PID <pid> /T /F`
- Linux/WSL: `SIGKILL`, with descendants terminated deepest-first

Use `--no-force` for `taskkill /T` on Windows or `SIGTERM` on Linux:

```text
devports k 1 2 --no-force
devports kill 5173 --no-force
```

Open a local URL:

```text
devports open 5173
```

On WSL, this opens the URL in the Windows default browser.

Machine-readable output:

```text
devports list --json
```

The JSON result is always an array. `--raw` prints the underlying PowerShell
JSON on Windows or `ss` output on Linux.

## Commands

```text
devports
devports list [--json | --raw]
devports k <indexes...> [--no-force]
devports kill <port> [--no-force]
devports kill-pid <pid> [--yes] [--no-force]
devports open <port>
devports update
devports version
```

## Safety

- `kill <port>` only terminates a PID verified as Node.js.
- `k` only targets entries returned by the Node.js listener scan.
- All indexes are validated before any selected process is terminated.
- Duplicate rows for the same PID are terminated only once.
- Linux descendants are enumerated through `/proc` and terminated deepest-first;
  devports does not signal the terminal process group.
- `kill-pid` requires `--yes` for processes not recognized as Node.js.
- Missing targets and failed termination attempts return a nonzero exit code.

Forced termination does not allow applications to perform graceful shutdown. Use
`--no-force` when cleanup hooks or unsaved state matter.

## Development

```text
npm ci
npm run check
npm run dev -- list
```

Automated tests use injected dependencies and never terminate real processes. CI
runs on Windows and Linux with Node.js 22 and 24. See
[CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidance.

## License

[MIT](LICENSE)
