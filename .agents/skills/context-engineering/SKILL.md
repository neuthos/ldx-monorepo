---
name: context-engineering
description: Builds focused, graph-backed context packets for L-DX planning and review across the frontend, Odoo addons, and Playwright E2E repository. Use when starting an investigation, switching domains, preparing a repository-agent handoff, or when an answer risks relying on stale or excessive context.
---

# Engineer L-DX Context

Build the smallest evidence set that can support the requested decision. Do not load all three repositories indiscriminately and do not edit a target repository.

## Context sequence

1. Resolve only `FE_PWD`, `BE_PWD`, and `E2E_PWD` from `.env` without sourcing it or exposing other values.
2. Call `list_projects`; record project, indexed root, branch, and HEAD.
3. Compare the index with Git only when branch freshness matters. Report mismatch and request permission before reindexing.
4. Read target-local `AGENTS.md`/`CLAUDE.md` for the selected repositories.
5. Use `get_architecture` for orientation, `search_graph` for symbols, and `trace_path` in both directions for dependencies and blast radius.
6. Fetch only resolved symbols with `get_code_snippet`. Use `query_graph` for structural questions and `detect_changes` for diffs.
7. Use text search only for literals, configs, XML, manifests, ACLs, routes missed by the parser, and Odoo dynamic references.

## L-DX context map

- `ldx-frontend`: Next.js/TypeScript; trace from page/view through components, data/API services, hooks, contexts, and mock resolvers.
- `ldx-backend`: Odoo addons under `ldx_addons`; inspect controllers, models, utils, tests, manifests, XML, security files, `_name`/`_inherit`, relational comodels, and JST business-day handling.
- `ldx-e2e`: Playwright scenarios, Page Objects, API helpers, fixtures/config, and shared utilities. Treat stateful business chains and the shared preview environment as serialized.

## Human decision gate

Separate every packet into `Confirmed evidence`, `Inference`, `Unknown`, and `Decision required`. Never promote an inference or code precedent into a requirement. When sources conflict, show both and stop for the user to choose which has authority. Do not select scope, owning repo, behavior, or contract on the user's behalf.

## TDD planning contract

Include the existing tests connected to each target symbol and identify the first failing proof expected from the implementation agent. Map coverage across FE unit/component tests and mocks, Odoo addon tests, and Playwright only where end-to-end confidence is necessary. Specify positive, negative, permission, error, and JST/date cases that are relevant. Do not run tests here.

## Output

Produce a compact context packet containing:

- indexed revisions and freshness caveats;
- graph-resolved symbols, files, callers/callees, routes, and affected flows;
- applicable target-local rules;
- test surfaces and proposed RED proof;
- unknowns and explicit user decisions;
- pointers for the target-repository agent, without implementation instructions beyond approved scope.
