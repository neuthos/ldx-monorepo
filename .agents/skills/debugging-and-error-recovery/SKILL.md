---
name: debugging-and-error-recovery
description: Investigates L-DX bugs and failures across Next.js frontend, Odoo addons, APIs, and Playwright flows without implementing fixes. Use for root-cause analysis, regression localization, failing tests, runtime errors, broken workflows, or incident evidence that needs a test-first repair handoff.
---

# Diagnose L-DX Failures

Preserve evidence and diagnose; do not modify target code, run state-mutating services, or guess a fix.

## Investigation sequence

1. Capture expected vs actual behavior, environment, role, data, timestamps, exact error, and reproducibility.
2. Check relevant index revision and target-local rules.
3. Use `search_graph` to locate error symbols/routes and `trace_path` through FE service calls, Odoo controller/model/utils, and E2E helpers/Page Objects.
4. Use `get_code_snippet` only on resolved candidates. Inspect tests connected by the graph.
5. Verify Odoo dynamic relationships, XML/security, job/transaction boundaries, and UTC↔JST conversions with targeted fallback search.
6. Separate trigger, propagation path, root-cause hypothesis, and user-visible symptom.
7. Rank hypotheses by evidence and list the observation that would falsify each.

Do not reproduce against a shared environment when the command may mutate data. Design reproduction steps for the repository-specific agent instead.

## Human decision gate

Do not declare a root cause when evidence supports multiple hypotheses. Do not choose a fallback behavior, data repair, compatibility trade-off, or fix scope. Present evidence and ask the user which investigation/fix boundary to authorize. A likely hypothesis remains `UNCONFIRMED` until proven.

## TDD repair contract

The handoff must start with a regression test that reproduces the reported failure without the fix. Specify layer, fixtures, role, input, expected failure, and why it proves the bug. Then define minimal GREEN behavior, regression surfaces from `trace_path`, and REFACTOR limits. Include JST/time, permission, state-chain, and error-path variants where relevant.

## Output

Return chronology, graph trace, evidence table, ranked hypotheses, confirmed root cause or missing proof, blast radius, RED regression test plan, approved fix boundary, and separate repo-agent handoffs.
