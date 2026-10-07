<div align="center">

# DevPorts

**Find, open, and stop Node.js development servers.**

A small CLI for Windows, Linux, and WSL.

[![CI](https://github.com/MosrednA/devports/actions/workflows/ci.yml/badge.svg)](https://github.com/MosrednA/devports/actions/workflows/ci.yml)
[![Node.js 22+](https://img.shields.io/badge/Node.js-22%2B-417e38)](https://nodejs.org/)
[![MIT License](https://img.shields.io/badge/License-MIT-64748b)](LICENSE)

[Usage guide](docs/usage.md) · [AI skill](skills/devports/SKILL.md) ·
[Contributing](CONTRIBUTING.md) · [Changelog](CHANGELOG.md) ·
[Report a bug](https://github.com/MosrednA/devports/issues)

</div>

Port already in use? See which Node.js server owns it, open it in your browser,
or stop its process tree from the terminal.

Example output:

```text
$ devports
#  Port  PID    Address    Process  Command
1  3000  18432  127.0.0.1  node     npm run dev
2  5173  22610  127.0.0.1  node     vite
```

## Install

Requires **Node.js 22+** and Git. DevPorts is installed from source; it is not
published to npm yet. Run these commands in PowerShell, Linux, or WSL:

```sh
git clone https://github.com/MosrednA/devports.git
cd devports
npm ci
npm run build
npm link
```

Both `devports` and the shorter alias `devport` are now available for your
current Node.js installation.

## Everyday commands

| Command                   | What it does                                  |
| ------------------------- | --------------------------------------------- |
| `devports`                | List Node.js servers with ports and PIDs.     |
| `devports open 5173`      | Open a localhost port in your browser.        |
| `devports kill 5173`      | Stop the Node.js process listening on a port. |
| `devports k 1 2`          | Stop entries by their displayed list indexes. |
| `devports kill-pid 22610` | Stop a Node.js process by PID.                |
| `devports kill-all --yes` | Stop every listed Node.js process.            |
| `devports nuke`           | Stop every listed process immediately.        |
| `devports list --json`    | Get structured output for scripts.            |
| `devports update`         | Pull, install, and rebuild a linked checkout. |
| `devports version`        | Show the installed version.                   |

Run `devports` just before using `k`: list indexes can change as servers start
or stop. Use `devports --help` for command help.

## Stopping processes

- Port and list commands target verified Node.js listeners and their child
  processes. `kill-pid` requires `--yes` to target a non-Node process.
- **Termination is forced by default.** Add `--no-force` to request termination
  without force, for example `devports kill 5173 --no-force`.
- `kill-all` previews its targets unless you pass `--yes`. **`nuke` stops all
  listed Node.js processes immediately, without confirmation.**

See the [usage guide](docs/usage.md) for platform-specific termination behavior
and all command options.

## Platform support

**Windows 10/11 · Linux · WSL 1/2**

Windows uses PowerShell; Linux and WSL require `ss` from `iproute2`. Each
installation manages its own environment: WSL cannot stop Windows-host processes
or processes in another distribution. macOS is not supported.

## AI assistants

The [DevPorts skill](skills/devports/SKILL.md) explains installation, JSON
output, target selection, and process cleanup. Give your assistant this prompt:

```text
Read https://raw.githubusercontent.com/MosrednA/devports/main/skills/devports/SKILL.md and use it to install and work with DevPorts.
```

For agents that support `SKILL.md`, copy the `skills/devports` folder into the
agent's configured skill directory.

## Development

```sh
npm ci
npm run check
npm run dev -- list
```

Tests never terminate real processes. CI covers Windows and Linux on Node.js 22
and 24. See [Contributing](CONTRIBUTING.md) for development guidance.

---

Released under the [MIT License](LICENSE).
