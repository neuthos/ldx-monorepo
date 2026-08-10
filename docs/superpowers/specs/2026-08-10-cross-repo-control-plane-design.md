# Cross-Repo Control Plane Design

## Purpose

`ldx-monorepo` is a planning and review control plane for three independent repositories. It is not a source-code monorepo and must not become an implementation workspace for those repositories.

The control plane provides enough cross-repository context to perform:

- architecture and dependency analysis;
- cross-repository review and investigation;
- medium-level implementation planning;
- sequencing and risk analysis; and
- handoff preparation for repository-specific agents.

## Repository Discovery

Repository locations are resolved at runtime from the local `.env` file:

| Environment key | Repository role |
| --- | --- |
| `FE_PWD` | Frontend |
| `BE_PWD` | Backend |
| `E2E_PWD` | End-to-end automation |

Rules files must not hardcode machine-specific absolute paths. Before analysis, an agent validates that each required value points to an accessible Git working tree. Missing or invalid mappings must be reported instead of guessed.

The `.env` file remains ignored by Git. `.env.example` may document the expected keys, but its existing user changes are outside this task.

## Safety Boundary

The frontend, backend, and E2E repositories are strictly read-only from this control plane.

Allowed operations include reading files, inspecting repository-local rules, viewing Git status/history/diffs, and running commands that are demonstrably read-only.

Forbidden operations in target repositories include:

- creating, editing, moving, or deleting files;
- installing or updating dependencies;
- running formatters, generators, migrations, or tests that write artifacts or mutate external state;
- changing branches or worktrees;
- staging, stashing, committing, merging, rebasing, pulling, or pushing; and
- modifying services, databases, test environments, or other external systems.

When implementation is requested, the control-plane agent produces a handoff package and directs execution to the dedicated agent session for the relevant repository.

## Context Loading

Before analyzing a target repository, the agent reads its root `AGENTS.md` and/or `CLAUDE.md` when present. Those files are the source of truth for repository-specific architecture, conventions, code-intelligence tools, and quality gates.

Context should be loaded selectively:

1. Resolve and validate the relevant repository path from `.env`.
2. Read the repository-local rules.
3. Load only the source, tests, ADRs, diffs, or history needed for the question.
4. Prefer each repository's prescribed knowledge-graph tooling when available.
5. Surface conflicts between cross-repository assumptions and repository-local rules.

The control plane must not duplicate detailed repository rules because copied guidance becomes stale.

## Planning Output

Planning and review artifacts may be written only inside `ldx-monorepo`. A cross-repository plan should contain, as applicable:

- objective and scope;
- current-state findings with evidence;
- contracts or dependencies between FE, BE, and E2E;
- ordered work packets per repository;
- acceptance criteria and repository-specific verification;
- risks, unknowns, and rollout considerations;
- dependency and handoff order; and
- a self-contained prompt for each repository-specific agent.

Plans describe intended changes but do not apply them to target repositories.

## Rules Files

Two root rules files will enforce the same policy:

- `AGENTS.md` for Codex and compatible agents;
- `CLAUDE.md` for Claude Code.

Both files will define the control-plane role, `.env`-based discovery, strict read-only boundaries, context-loading protocol, expected planning outputs, and implementation handoff behavior. Tool-specific wording may differ, but the safety and workflow semantics must remain equivalent.

## Acceptance Criteria

- Root `AGENTS.md` and `CLAUDE.md` exist and identify this repository as a planning/review control plane rather than a source monorepo.
- Both files resolve FE, BE, and E2E through `FE_PWD`, `BE_PWD`, and `E2E_PWD` without hardcoded absolute paths.
- Both explicitly prohibit writes and state-changing commands in all target repositories.
- Both require repository-local rules to be read before target-specific analysis.
- Both define cross-repository planning and agent-handoff outputs.
- The existing `.env.example` modification is preserved untouched.
- No files or Git state in the three target repositories are changed.
