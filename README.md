# L-DX Cross-Repository Control Plane

This repository provides read-only planning and review context across the independent frontend, backend, and E2E repositories.

## Codebase-memory MCP

Repository locations come from `.env`:

```dotenv
FE_PWD=/path/to/ldx-frontend
BE_PWD=/path/to/L-DX_Backend
E2E_PWD=/path/to/L-DX-E2E
```

Install the runtime locally once:

```bash
npm install --prefix .code-intelligence/runtime codebase-memory-mcp@latest --save-exact
```

Index or refresh all three repositories from this directory:

```bash
./scripts/index-all-repo
```

The backend index is deliberately scoped to `BE_PWD/ldx_addons`. Indexes and MCP configuration state live under the ignored `.code-intelligence/` directory. Indexing uses `persistence=false`, so no graph artifact is written to FE, BE, or E2E.

MCP clients discover the project-local server through `.mcp.json`.

Useful diagnostics:

```bash
./scripts/codebase-memory-mcp --version
./scripts/codebase-memory-mcp config list
./scripts/codebase-memory-mcp cli list_projects
```
