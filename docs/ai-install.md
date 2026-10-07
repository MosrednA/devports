# Install DevPorts and its AI skill

Instructions for an AI assistant asked to set up **both** the DevPorts CLI and
its separate [usage skill](../skills/devports/SKILL.md).

## 1. Choose the environment

Use the environment where the development servers run: Windows 10/11, Linux, or
the relevant WSL distribution. macOS is not supported.

Check for Node.js 22+ and Git. Preserve the user's existing Node.js version
manager. Linux and WSL also require `ss` from `iproute2`; on Debian or Ubuntu,
install it with `sudo apt install iproute2` if needed and dependency setup is
authorized.

Choose a persistent tools directory for the checkout. Identify the current AI
agent and its skill directory; use a configured custom location when present.
The skill locations are listed in step 3.

## 2. Install the DevPorts CLI

If `devports version` already works, reuse that installation and continue with
the skill. Otherwise, run these commands from the parent tools directory in
PowerShell, Linux, or WSL:

```sh
git clone https://github.com/MosrednA/devports.git
cd devports
npm ci
npm run build
npm link
```

Keep the checkout: the global commands `devports` and `devport` link to it for
the active Node.js installation. DevPorts is not published to npm; do not use
`npm install -g devports`.

Reuse an existing DevPorts checkout instead of overwriting it. Preserve local
changes. If global linking is unavailable, use
`node /absolute/path/to/devports/bin/devports.js` instead of `devports` and
record that invocation for the agent.

## 3. Install the usage skill

Install the `skills/devports` folder from the checkout into the current agent's
skill directory. If reusing a CLI without its checkout, download the
[raw usage skill](https://raw.githubusercontent.com/MosrednA/devports/main/skills/devports/SKILL.md)
as `devports/SKILL.md` in that directory. Preserve the entire file, including
YAML frontmatter.

Choose one agent and scope; use a personal installation unless the user asks for
project-only setup:

| Agent                                                 | Personal skill file                  | Project skill file                           |
| ----------------------------------------------------- | ------------------------------------ | -------------------------------------------- |
| [Codex](https://developers.openai.com/codex/skills/)  | `~/.agents/skills/devports/SKILL.md` | `<project>/.agents/skills/devports/SKILL.md` |
| [Claude Code](https://code.claude.com/docs/en/skills) | `~/.claude/skills/devports/SKILL.md` | `<project>/.claude/skills/devports/SKILL.md` |

For another agent, use its documented skill location. `~` means the user's home
directory, including on Windows. Do not install this setup guide as a skill.

Before copying, check for an existing `devports` skill. Reuse an identical copy;
compare a different copy and preserve local customizations unless replacement is
requested.

For a **new Codex personal skill**, run from the DevPorts checkout:

PowerShell:

```powershell
$devportsSkillRoot = Join-Path $HOME '.agents/skills'
New-Item -ItemType Directory -Path $devportsSkillRoot -Force | Out-Null
Copy-Item -LiteralPath 'skills/devports' -Destination $devportsSkillRoot -Recurse
```

Linux / WSL:

```sh
mkdir -p "$HOME/.agents/skills"
cp -R skills/devports "$HOME/.agents/skills/"
```

For Claude Code, use `.claude/skills` instead of `.agents/skills`. For project
scope, resolve the destination against the user's target project rather than the
DevPorts checkout.

## 4. Verify both installations

```sh
devports version
devports list --json
```

Confirm that the CLI runs and returns a JSON array. Do not stop processes as an
installation test.

Read back the installed `devports/SKILL.md` and confirm it matches the usage
skill. Check the agent's skill discovery or selector for `devports`; refresh or
restart the agent if the new skill is not visible. Then load the skill for
read-only inspection of local Node.js servers.

Report the checkout path, CLI version/invocation, installed skill path, and
whether the agent discovered it. Distinguish a skill copied to disk from a skill
confirmed available to the agent.

[Back to DevPorts](../README.md) · [Usage skill](../skills/devports/SKILL.md)
