# devports

[![CI](https://github.com/MosrednA/devports/actions/workflows/ci.yml/badge.svg)](https://github.com/MosrednA/devports/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Find and stop Node.js development servers by port, PID, or list index.

> [!IMPORTANT] `devports` is Windows-only for now. It supports Windows 10 and
> Windows 11 with Windows PowerShell and Node.js 22 or newer.

## Features

- Lists Node.js processes listening on local TCP ports.
- Shows port, PID, address, process name, command, and URL.
- Stops one server by port or multiple servers by displayed index.
- Uses forced process-tree termination by default to clean up dev-server
  children.
- Opens `http://localhost:<port>` in the default browser.
- Provides stable JSON output for scripts and future desktop integrations.

## Install

From npm after the first release:

```powershell
npm install --global @mosredna/devports
```

From source:

```powershell
git clone https://github.com/MosrednA/devports.git
cd devports
npm ci
npm run build
npm link
```

Both command names are available:

```powershell
devports
devport
```

## Usage

List active Node.js listeners:

```powershell
devports
devports list
```

Example:

```text
#  Port  PID    Address    Process   Command
1  3000  18432  127.0.0.1  node.exe  npm run dev
2  5173  22610  127.0.0.1  node.exe  vite
```

Stop one or more displayed entries:

```powershell
devports k 1 2
```

Indexes are temporary and may change as processes start or stop. Run `devports`
immediately before using `k`.

Stop the Node.js process listening on a port:

```powershell
devports kill 5173
```

Stop a process by PID:

```powershell
devports kill-pid 22610
```

For safety, `kill-pid` refuses non-Node processes unless explicitly
acknowledged:

```powershell
devports kill-pid 22610 --yes
```

Termination uses `taskkill.exe /PID <pid> /T /F` by default. To omit `/F`:

```powershell
devports k 1 2 --no-force
devports kill 5173 --no-force
```

Open a local URL:

```powershell
devports open 5173
```

Machine-readable output:

```powershell
devports list --json
```

The JSON result is always an array.

## Commands

```text
devports
devports list [--json | --raw]
devports k <indexes...> [--no-force]
devports kill <port> [--no-force]
devports kill-pid <pid> [--yes] [--no-force]
devports open <port>
devports version
```

## Safety

- `kill <port>` only terminates a PID verified as `node.exe`.
- `k` only targets entries returned by the Node.js listener scan.
- All indexes are validated before any selected process is terminated.
- Duplicate rows for the same PID are terminated only once.
- `kill-pid` requires `--yes` for processes not recognized as Node.js.
- Missing targets and failed termination attempts return a nonzero exit code.

Forced termination does not allow applications to perform graceful shutdown. Use
`--no-force` when cleanup hooks or unsaved state matter.

## Development

```powershell
npm ci
npm run check
npm run dev -- list
```

Automated tests use injected dependencies and never terminate real processes.
See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidance.

## License

[MIT](LICENSE)
