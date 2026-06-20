# Contributing

Contributions are welcome.

## Requirements

- Windows 10/11, Linux, or WSL
- Node.js 22 or newer
- Windows PowerShell on Windows, or `ss` from `iproute2` on Linux

## Development

```powershell
git clone https://github.com/MosrednA/devports.git
cd devports
npm ci
npm run check
```

Use `npm run dev -- <command>` to run the TypeScript source directly.

## Pull requests

- Keep changes focused.
- Add or update tests for behavior changes.
- Run `npm run check` before opening a pull request.
- Do not use real process termination in automated tests. Inject test
  dependencies through `createProgram`.
