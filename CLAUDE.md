# L-DX Cross-Repository Planning and Review Context

## Purpose

This repository gives Claude Code a larger view across three independent L-DX repositories. It is a control plane for review, investigation, architecture analysis, medium-level planning, and agent handoffs. It is not a source-code monorepo and is never an implementation workspace for the linked repositories.

Run implementation in a separate Claude Code or agent session rooted at the repository being changed.

## Linked Repositories

Read repository paths at runtime from the local `.env` file:

| Key | Repository |
| --- | --- |
| `FE_PWD` | Frontend |
| `BE_PWD` | Backend |
| `E2E_PWD` | End-to-end automation |

Never hardcode machine-specific paths. Never source or execute `.env`; extract only these three values without exposing other variables. Before inspecting a target, verify that the key is present, the directory exists, and it is a Git working tree. Report an invalid key instead of guessing a replacement path.

## Non-Negotiable Read-Only Boundary

Every repository referenced by `FE_PWD`, `BE_PWD`, or `E2E_PWD` is strictly read-only from this session.

You may read files and use demonstrably read-only inspection commands such as `git status`, `git log`, `git diff`, `git show`, and repository-approved read-only knowledge-graph queries.

Do not create, edit, move, or delete target files. Do not install dependencies; run formatters, generators, or migrations; start commands that write artifacts or mutate databases, shared test environments, services, or external systems; change branches or worktrees; or stage, stash, commit, merge, rebase, pull, push, reset, or clean.

Do not ask to bypass this boundary. If implementation is requested, prepare a repository-specific handoff.

## Loading Context

For each target involved in a question:

1. Resolve and validate the path from `.env`.
2. Read the target's root `CLAUDE.md` and/or `AGENTS.md` when present.
3. Follow those local rules for architecture sources, conventions, code-intelligence tools, and quality gates.
4. Load only relevant code, tests, ADRs, diffs, and history.
5. Prefer repository-prescribed knowledge graphs when available and use permitted fallback search only when necessary.
6. Explain conflicting or missing context rather than inventing a decision.

Do not duplicate detailed target guidance here; always consult the current repository-local rules.

## Code Intelligence

For every task that requires understanding application code, use the project-local `codebase-memory` MCP before reading or searching source files. Do not begin code discovery with Grep, Glob, broad Read operations, or shell search when the MCP is available. It exposes:

| MCP project | Scope |
| --- | --- |
| `ldx-frontend` | Repository at `FE_PWD` |
| `ldx-backend` | `BE_PWD/ldx_addons` |
| `ldx-e2e` | Repository at `E2E_PWD` |

Use this mandatory analysis sequence:

1. Call `list_projects` and select the relevant project explicitly. Query every affected project for cross-repository work.
2. When branch freshness affects the answer, compare the indexed root, branch, and HEAD with the target repository. Disclose a mismatch and ask before refreshing the graph.
3. Use `get_architecture` for orientation and `search_graph` to resolve symbols.
4. Use `trace_path` in both directions for callers, callees, dependencies, and transitive blast radius.
5. Use `get_code_snippet` only for specific qualified symbols returned by the graph.
6. Use `detect_changes` for diff impact and `query_graph` for relationships not covered by higher-level tools.
7. Correlate FE routes and clients, Odoo models/controllers, and E2E flows across their respective projects before making cross-repository claims.
8. Use permitted filesystem search only for the fallback cases below, and state when a conclusion depends on fallback evidence.

If the MCP is unavailable or insufficient, say so explicitly instead of silently replacing graph analysis with broad filesystem search. Codebase conclusions and plans must identify the graph-resolved symbols, paths, or relationships that support them.

Use text search when looking for literals or configuration, when graph coverage is incomplete, and for Odoo relationships expressed through `_name`, `_inherit`, `_inherits`, `env['model.name']`, relational field comodels, manifest dependencies, XML IDs, `inherit_id`, routes, and ACL files. Because the backend graph is deliberately limited to `ldx_addons`, do not call its results the complete backend blast radius without checking external consumers.

Do not initialize or refresh indexes automatically. Run `./scripts/index-all-repo` from this control plane only when the user requests it. Its cache and persistence configuration prevents index artifacts from being written to target repositories.

## Allowed Outputs

Write artifacts only inside this control-plane repository. Suitable outputs include cross-repository reviews, investigation reports, architecture or dependency maps, medium-level plans, implementation sequencing, and handoff prompts.

Preserve unrelated user changes. Never put secrets or unrelated `.env` values into an artifact.

## Planning Standard

A cross-repository implementation plan should include:

- objective, scope, and non-goals;
- evidence-backed findings;
- FE/BE/E2E contracts and dependencies;
- ordered work packets for each affected repository;
- acceptance criteria and target-specific verification;
- risks, unknowns, rollout concerns, and dependency order; and
- a self-contained prompt for every implementation agent.

The plan may describe target edits but must never perform them.

## Implementation Handoff

When the user wants implementation, name the target repository and prepare a handoff with the goal, scoped files or symbols, relevant evidence and local rules, ordered steps, acceptance criteria, verification commands, and cross-repository dependencies. Direct the user to run it in a separate agent session rooted at that target repository.
