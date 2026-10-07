# Usage guide

[← Back to DevPorts](../README.md)

## Command reference

Running `devports` without a command lists Node.js processes listening on local
TCP ports. `devport` is an alias for the same CLI.

```text
devports
devports list [--json | --raw]
devports k <indexes...> [--no-force]
devports kill <port> [--no-force]
devports kill-all [--yes] [--no-force]
devports nuke [--no-force]
devports kill-pid <pid> [--yes] [--no-force]
devports open <port>
devports update
devports version
```

`k` is the short form of `kill-index`. Use `devports <command> --help` for
details.

## Select and stop servers

List active listeners, then stop one or more displayed entries:

```sh
devports
devports k 1 2
```

Indexes are temporary. Run `devports` immediately before using `k`. Every index
is validated before termination begins, and multiple rows sharing a PID are
stopped only once.

To target a port or PID directly:

```sh
devports kill 5173
devports kill-pid 22610
```

`kill` only stops a verified Node.js listener. If multiple listeners share the
port, it stops the first matching PID and reports that choice. `kill-pid`
refuses non-Node processes unless you explicitly pass `--yes`.

To stop all listed Node.js processes:

```sh
devports kill-all --yes
```

Without `--yes`, `kill-all` displays its targets and returns a nonzero exit code
without stopping anything. `devports nuke` stops the same targets immediately,
without confirmation.

### Termination behavior

All stop commands target process trees. Forced termination is the default and
does not allow application cleanup hooks to run.

| Environment | Default                     | With `--no-force`        |
| ----------- | --------------------------- | ------------------------ |
| Windows     | `taskkill /PID <pid> /T /F` | `taskkill /PID <pid> /T` |
| Linux / WSL | `SIGKILL`                   | `SIGTERM`                |

```sh
devports kill 5173 --no-force
devports k 1 2 --no-force
```

On Linux and WSL, descendants are enumerated through `/proc` and stopped
deepest-first. DevPorts does not signal the terminal process group. Missing
targets and failed termination attempts return a nonzero exit code.

## Open localhost URLs

```sh
devports open 5173
```

Windows and WSL use the Windows default browser. Desktop Linux uses `xdg-open`.

## Script output

```sh
devports list --json
```

JSON output is always an array. Each entry includes the port, PID, address,
process name, command, and localhost URL.

Use `devports list --raw` for debugging: it returns the underlying PowerShell
JSON on Windows or `ss` output on Linux and WSL. `--json` and `--raw` cannot be
combined.

## Platform requirements

DevPorts supports Windows 10/11, Linux, and WSL 1/2 with Node.js 22 or newer.
macOS is not supported.

| Environment | Process discovery  | Scope                     |
| ----------- | ------------------ | ------------------------- |
| Windows     | PowerShell and CIM | Windows Node.js processes |
| Linux       | `ss` and `/proc`   | Local Linux processes     |
| WSL         | `ss` and `/proc`   | The current distribution  |

WSL cannot manage Windows-host processes or processes in another WSL
distribution. If `ss` is missing, install `iproute2`. On Debian or Ubuntu:

```sh
sudo apt install iproute2
```

## Update or uninstall

For an installation linked from a Git checkout:

```sh
devports update
```

The update command requires a clean checkout on a branch. It pulls with
`--ff-only`, refreshes dependencies, rebuilds the project, and preserves the
existing global link. Git is required.

Remove the linked commands with:

```sh
npm unlink --global @mosredna/devports
```

For local development and checks, see [Contributing](../CONTRIBUTING.md).
