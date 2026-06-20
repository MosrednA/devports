# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-06-20

### Added

- Windows PowerShell discovery of Node.js TCP listeners.
- Linux and WSL discovery through `ss` and `/proc`.
- Table, JSON, and raw scanner output.
- Forced process-tree termination by port, PID, or displayed index.
- Linux process-tree termination using `SIGKILL` or `SIGTERM`.
- Multi-index termination with PID deduplication.
- Browser opening for localhost ports.
- Safe self-updates for source-linked installations.
- Reusable TypeScript API.
- Windows CI for Node.js 22 and 24.
- Safety checks for non-Node PID termination.

[1.0.0]: https://github.com/MosrednA/devports/releases/tag/v1.0.0
