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

`main` is protected: the four CI checks (Windows and Linux, Node.js 22 and 24)
must pass first, so a direct push to `main` is rejected. Push a branch and open
a pull request instead.

## Notes

- Tests never terminate real processes; inject dependencies through
  `createProgram`.
- Update `CHANGELOG.md` and `docs/usage.md` when commands or their output
  change.
