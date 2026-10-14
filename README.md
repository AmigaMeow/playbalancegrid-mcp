# PlayBalanceGrid MCP Server

Takuzu (Binairo) puzzle tools as an MCP server.

## Tools

- **generate_puzzle** — Generate a Takuzu puzzle (6x6, 8x8, or 10x10)
- **validate_solution** — Validate a completed puzzle against all Takuzu rules
- **get_puzzle_hint** — Get a hint for the next move

## Install

```bash
npm install
Use with Claude Desktop
json


{
  "mcpServers": {
    "playbalancegrid": {
      "command": "node",
      "args": ["/path/to/playbalancegrid-mcp/src/index.js"]
    }
  }
}
Links
Website: https://playbalancegrid.com
Registry: https://registry.modelcontextprotocol.io
MIT License.
