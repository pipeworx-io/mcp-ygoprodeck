# mcp-ygoprodeck

YGOPRODeck MCP — Yu-Gi-Oh! trading card game (TCG) database.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `search_cards` | Search Yu-Gi-Oh! trading card game (TCG) cards by name (fuzzy), card type, attribute, monster race/type, archetype, or level. Returns matching cards with names, types, descriptions, ATK/DEF, attributes, archetypes, images, and TCGplayer card prices. |
| `get_card` | Look up a single Yu-Gi-Oh! trading card game (TCG) card by its exact name. Returns full card details including type, description, ATK/DEF, level, attribute, archetype, banlist status, printed sets with rarities, and card prices (TCGplayer, Cardmarket, eBay, Amazon). |
| `random_card` | Get a random Yu-Gi-Oh! trading card game (TCG) card with full details including type, description, ATK/DEF, attribute, archetype, sets, and card prices. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "ygoprodeck": {
      "url": "https://gateway.pipeworx.io/ygoprodeck/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/ygoprodeck/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Ygoprodeck data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/ygoprodeck_search_cards \
  -H 'Content-Type: application/json' \
  -d '{"name":"Dark Magician","type":"Effect Monster","num":10}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/ygoprodeck_search_cards`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.
