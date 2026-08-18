---
name: l-pedia-search
description: "Search and read L-Pedia — the L-DX Confluence documentation space (LPedia at l-dx.atlassian.net, including the EN/Manuals and EN/Ringi trees). Use when understanding a case, screen, business flow, or Ringi decision needs grounding in L-Pedia page docs: search via the read-only `confluence` MCP server (mcp__confluence__* tools) or scripts/lpedia, fetch the matching pages, and return a cited case brief. Read-only against Confluence."
---

# L-Pedia Search Agent

L-Pedia is the Confluence space `LPedia` — the page-by-page documentation of L-DX screens and flows. Two trees matter most: **EN / Manuals** (page manuals) and **EN / Ringi** (Ringi decision documents). This skill turns a case question ("how does Store Sales cancellation work?") into a cited answer from L-Pedia.

## Gateways and safety

Two supported gateways — never anything else:

1. **`confluence` MCP server (primary)** — read-only `mcp__confluence__*` tools (search, get page, page tree, children). Registered in `.mcp.json`, launched by `scripts/confluence-mcp` with `--read-only`.
2. **`./scripts/lpedia` (CLI fallback)** — same API surface for terminal use, debugging, and `--print-cql` query inspection.

- Never use WebFetch/web readers on `l-dx.atlassian.net` (auth-gated; they cannot see the space).
- Never call the Confluence REST API inline with curl; the MCP server and the script own auth, pagination, and URL building.
- Credentials live in `.env` only (`CONFLUENCE_URL`, `CONFLUENCE_USERNAME`, `CONFLUENCE_API_TOKEN`). Never print, copy, or persist the token or unrelated `.env` values into any artifact.
- Never create, edit, move, or delete anything in Confluence. This skill is read-only.

## Setup gate (every session)

1. If `mcp__confluence__*` tools are available → done, continue.
2. If the server is missing/failed: check `.env` has `CONFLUENCE_URL`, `CONFLUENCE_USERNAME`, `CONFLUENCE_API_TOKEN`. If missing, stop and tell the user exactly:
   1. create an Atlassian API token at https://id.atlassian.com/manage-profile/security/api-tokens;
   2. add the three keys to this repo's `.env` (gitignored; see `.env.example`);
   3. restart the session (or reconnect the MCP server) so the client picks it up.

   Do not ask the user to paste the token into the chat.
3. If MCP is unavailable but creds exist → fall back to `./scripts/lpedia check` and proceed CLI-only; note the degradation in your output.

## Tool map

| Need                                  | MCP tool (primary)                                        | CLI fallback                          |
| ------------------------------------- | --------------------------------------------------------- | ------------------------------------- |
| Verify access                         | any search returning results                              | `./scripts/lpedia check`              |
| Whole space tree / find Manual+Ringi roots | `confluence_get_space_page_tree` (spaceKey `LPedia`) | `./scripts/lpedia roots`              |
| Children of a node                    | `confluence_get_page_children`                            | `./scripts/lpedia tree <id>`          |
| Search                                | `confluence_search` (CQL)                                 | `./scripts/lpedia search`             |
| Read a page                           | `confluence_get_page`                                     | `./scripts/lpedia page <id-or-url>`   |

## Case-understanding workflow

1. **Discover structure** (cheap; once per session): pull the space page tree and locate the **EN / Manuals** and **EN / Ringi** roots (record their page/folder IDs for `ancestor` scoping). The tree drifts — resolve IDs fresh each session, never reuse IDs from an earlier session or artifact.
2. **Search broadly, then scoped**: first `space = "LPedia" AND text ~ "<keywords>"`; then narrow with `AND ancestor = "<root-id>"` per tree. Iterate the keywords: screen name in English, the Japanese term verbatim (e.g. `仕訳`, `締め`), feature wording, Ringi number. Use `title ~` when hunting a page by name; use `./scripts/lpedia search --print-cql` to debug a query.
3. **Read before citing**: search results are summaries/excerpts. Always fetch the full page before citing its details; walk children/parents when context matters.
4. **Synthesize the case brief** — in chat by default; write a file only if the user asks for one.

## Case-brief output contract

- **Answer** — one paragraph answering the case question directly.
- **Sources** — a table of `Title | L-Pedia path | URL` for every page used.
- **Evidence** — short verbatim excerpts per source. Japanese domain terms stay verbatim with an English gloss in parentheses — never translated away (same rule as design specs).
- **Gaps** — what L-Pedia does not answer, stated as "not found in L-Pedia" items that become open questions. Never invent documentation or fill gaps from assumption.

## Scope semantics

| Scope            | Meaning                                                 |
| ---------------- | ------------------------------------------------------- |
| whole space      | `space = "LPedia"` (default)                            |
| EN / Manuals     | `ancestor = "<id of the Manuals root>"`                 |
| EN / Ringi       | `ancestor = "<id of the Ringi root>"`                   |
| CLI shortcut     | `--scope manuals\|ringi\|<title-substring>` resolves by title automatically |

When using MCP tools, resolve the root IDs yourself in the discovery step and keep CQL explicit.

## Limitations

- CQL `text ~` is stemmed full-text search — recall-oriented. Try several phrasings (EN + JP) before concluding something is "not documented".
- `confluence_get_space_page_tree` on a large space can be heavy; prefer targeted searches once you know the roots.
- Confluence returns 404 both for a wrong key and for an account that cannot see a space — on auth-shaped 404s, check the `CONFLUENCE_*` values in `.env` before assuming the space key is wrong.
- Keep query volume modest; do not loop hundreds of queries per case.

## Integration with brainstorming (wired)

The `brainstorming` skill fans this skill out as its parallel **L-Pedia researcher**
agent during spec work (see `brainstorming/SKILL.md` → Parallel research agents). The
case-brief output contract below is what brainstorming consumes. This skill itself stays
read-only and standalone — it can also be used directly for ad-hoc case questions.
