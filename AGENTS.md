# DevPorts

A small Node.js CLI for Windows, Linux and WSL that lists, opens and stops
Node.js development servers. This is a public MIT repository:
[README.md](README.md) is for users and [CONTRIBUTING.md](CONTRIBUTING.md) for
development.

## Run and verify

- `npm ci`, then `npm run dev -- <command>` runs the TypeScript source directly.
- `npm run check` (Prettier, ESLint, build and `node --test`) must pass before a
  push. GitHub Actions runs the same checks.
- When the global `devports` command is installed with `npm link`,
  `npm run build` also updates that command.

## Ship

`main` is protected, also for the owner: changes go through a pull request with
linear history, and the four CI checks (Windows and Linux, Node.js 22 and 24)
must pass. A direct push to `main` is rejected. Push a branch, open a pull
request and rebase-merge it yourself once the checks pass; no review is needed.

## Notes

- Tests never terminate real processes; inject dependencies through
  `createProgram`.
- Update `CHANGELOG.md` and `docs/usage.md` when commands or their output
  change.
