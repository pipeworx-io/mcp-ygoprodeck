# mcp-ygoprodeck

YGOPRODeck MCP — Yu-Gi-Oh! trading card game (TCG) database.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

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

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Ygoprodeck data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
