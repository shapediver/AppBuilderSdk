@AGENTS.md

# Claude Code only

- Repo rules and skills have no `.claude/rules/` or `.claude/skills/` copies: use the lists in `AGENTS.md` and read the file. Skills named in `AGENTS.md` are files, not Skill-tool skills.
- The `SessionStart` hook in `.claude/settings.json` runs `scripts/agents/setup-worktree.mjs`. `.worktreeinclude` is also read natively when Claude Code creates a worktree.
