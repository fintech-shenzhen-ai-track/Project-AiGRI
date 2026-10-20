# Running the build with an orchestrator and Sonnet agents

One orchestrator agent (Opus) runs the whole build from the specs. It never writes product code. For each phase of each feature it starts a Sonnet **implementer** in its own git worktree, then a Sonnet **reviewer**, merges what passes into `main`, ticks the contract board and keeps a log. It pauses at each milestone so a person can look.

| File | What it is |
| --- | --- |
| `.claude/agents/aigri-orchestrator.md` | The orchestrator (model `opus`). It can start only the two agents below. |
| `.claude/agents/aigri-implementer.md` | Builds one phase of one feature (model `sonnet`, `isolation: worktree`). |
| `.claude/agents/aigri-reviewer.md` | Checks a branch against its spec, the constitution and both lane review checklists, runs the tests (model `sonnet`, read-only). |
| `handoff/orchestrator-prompt.md` | The orchestrator's instructions on their own, the same text as the agent file's body, if you'd rather paste it into a normal session. |
| `.claude/settings.json` | Worktrees branch from your local `main` (`worktree.baseRef: "head"`), edits are accepted without asking, the build commands are pre-allowed, force-pushes and pushes to `main` are denied. |
| `.gitignore`, `.worktreeinclude` | Keep `.claude/worktrees/` out of git; copy `.env` into each worktree. |
| `handoff/orchestrator-log.md` | Written by the orchestrator as it runs: what is running, merged, faked, blocked and waiting on people. |

## Start it

```bash
cd aigri
git init -b main && git add -A && git commit -m "AiGRI v2 specs and handoff"
claude update                        # the agent features below need a recent Claude Code
claude --agent aigri-orchestrator
```

Then send it one line, for example: `Start. SCOPE = all, PAUSE_AT = milestones.` To run one lane only: `SCOPE = lane A`. To open pull requests on GitHub instead of merging locally: add a remote, sign in with `gh auth login`, and say `MERGE_MODE = pr`.

To pick up later, start it the same way. It reads `handoff/orchestrator-log.md`, `git worktree list` and the branches, and carries on from there.

## What it does, in order

1. Reads the constitution, roadmap, decisions, ownership, contract board, both lane documents and every `tasks.md`.
2. Builds `01 phase A` (the repo, Docker Compose, migration 0001, API shell) alone, merges it, runs `make up` once and keeps that stack running for everyone.
3. Then runs up to three implementers at a time. It picks the work orders that deliver contracts first, along the longest chain 01 → 02 → 06 → 07 → 08 → 11, never two on the same feature, never two that write to the same paths.
4. Each finished phase goes to a reviewer. Changes requested go back to the same implementer (up to two rounds), then to you.
5. Approved branches are merged into `main`; `make lint` and `make test` must pass on `main` afterwards, or the merge is undone and sent back.
6. It is the only writer of `main`, the contract board, the log and the "Raised by agents" table, so parallel agents never fight over those files.

## When it stops for you

- At each milestone, M1 to M5 (exit criteria in `specs/00-shared/roadmap.md`), after checking them itself.
- When a new question blocks the longest chain and has no safe default.
- When a phase fails review twice, or `main` stays red after a fix round.
- When only a person can unblock the next step: Sentinel or GFM accounts, the BMKG access check (T-09.03), the teammates' fixtures and gold cases (`handoff/TEAMMATES.md`), insurer consent before a public demo, the PCIC source link.
- Before anything that would change the constitution, settled decisions, `DESIGN.md` or the read-only source folders. It never changes those.

Open questions that already have a proposed default, such as R-001 (insurer wallet balances computed by the ledger), don't stop it: the agents use the default and it lists them in the milestone summary for you to confirm.

## Things to know

- **Teammate tasks stay with the teammates.** Implementers may draft the fixture files from `system-preview/PLAN.md` section 2, marked `draft: true, needs teammate review`, so tests can run, but they never tick those tasks.
- **Parallel tests.** Decision D-39 makes every `make test` use its own throwaway database, and feature 01's first task checks two runs at once, so worktrees don't collide.
- **Permission prompts.** Subagents run in the background; any command outside the allow list shows its prompt in the orchestrator session, naming the agent. Approve it there, or add the command to `.claude/settings.json`.
- **Agent files load at session start.** Restart the orchestrator after editing anything in `.claude/agents/`.
- **Developers still own their lanes.** The orchestrator follows `handoff/DEV-A.md` and `DEV-B.md`; at each pause, developer A should read the gateway, tier, tenant and money changes and developer B the screens against `DESIGN.md` and the prototype, as the lane documents ask.
- **Without the agent file.** You can paste `handoff/orchestrator-prompt.md` into an ordinary Claude Code session. It works the same, but nothing then stops the session from starting other agent types.
