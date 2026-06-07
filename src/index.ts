interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * YGOPRODeck MCP — Yu-Gi-Oh! trading card game (TCG) database.
 * Keyless. Sends a User-Agent. Base: https://db.ygoprodeck.com/api/v7
 *
 * Note: YGOPRODeck returns HTTP 400 with { error: "No card matching..." }
 * when nothing matches; we surface that message.
 */


const BASE = 'https://db.ygoprodeck.com/api/v7';
const UA = 'pipeworx/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'search_cards',
    description:
      'Search Yu-Gi-Oh! trading card game (TCG) cards by name (fuzzy), card type, attribute, monster race/type, archetype, or level. Returns matching cards with names, types, descriptions, ATK/DEF, attributes, archetypes, images, and TCGplayer card prices.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Fuzzy card name match, e.g. "Dark Magician", "Blue-Eyes".' },
        type: { type: 'string', description: "Card type, e.g. 'Effect Monster', 'Normal Monster', 'Spell Card', 'Trap Card', 'XYZ Monster'." },
        attribute: { type: 'string', description: "Monster attribute, e.g. 'DARK', 'LIGHT', 'EARTH', 'WATER', 'FIRE', 'WIND', 'DIVINE'." },
        race: { type: 'string', description: "Monster type/race, e.g. 'Spellcaster', 'Dragon', 'Warrior'. For Spell/Trap, the property e.g. 'Continuous', 'Quick-Play'." },
        archetype: { type: 'string', description: 'Card archetype, e.g. "Blue-Eyes", "Dark Magician", "Sky Striker".' },
        level: { type: 'number', description: 'Monster level/rank, e.g. 7.' },
        num: { type: 'number', description: 'Number of results to return (default 20, max 50).' },
        offset: { type: 'number', description: 'Pagination offset (default 0).' },
      },
    },
  },
  {
    name: 'get_card',
    description:
      'Look up a single Yu-Gi-Oh! trading card game (TCG) card by its exact name. Returns full card details including type, description, ATK/DEF, level, attribute, archetype, banlist status, printed sets with rarities, and card prices (TCGplayer, Cardmarket, eBay, Amazon).',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Exact card name, e.g. "Dark Magician".' },
      },
      required: ['name'],
    },
  },
  {
    name: 'random_card',
    description:
      'Get a random Yu-Gi-Oh! trading card game (TCG) card with full details including type, description, ATK/DEF, attribute, archetype, sets, and card prices.',
    inputSchema: { type: 'object', properties: {} },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'search_cards': {
      const params = new URLSearchParams();
      const fname = args.name as string | undefined;
      if (fname && fname.trim()) params.set('fname', fname);
      for (const key of ['type', 'attribute', 'race', 'archetype'] as const) {
        const v = args[key];
        if (typeof v === 'string' && v.trim()) params.set(key, v);
      }
      if (typeof args.level === 'number') params.set('level', String(args.level));
      // YGOPRODeck requires num AND offset together for pagination — always send both.
      const num = Math.min(Math.max(typeof args.num === 'number' ? args.num : 20, 1), 50);
      const offset = typeof args.offset === 'number' ? args.offset : 0;
      params.set('num', String(num));
      params.set('offset', String(offset));
      const res = await ygoGet(`/cardinfo.php?${params.toString()}`);
      if (isError(res)) return res;
      const data = ((res as { data?: unknown[] }).data || []) as Array<Record<string, unknown>>;
      return {
        count: data.length,
        cards: data.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          frameType: c.frameType,
          desc: ((c.desc as string | undefined) || '').slice(0, 400),
          atk: c.atk,
          def: c.def,
          level: c.level,
          race: c.race,
          attribute: c.attribute,
          archetype: c.archetype,
          image: (c.card_images as Array<Record<string, unknown>> | undefined)?.[0]?.image_url,
          price_tcgplayer: (c.card_prices as Array<Record<string, unknown>> | undefined)?.[0]?.tcgplayer_price,
        })),
      };
    }
    case 'get_card': {
      const name = reqStr(args, 'name', '"Dark Magician"');
      const res = await ygoGet(`/cardinfo.php?name=${encodeURIComponent(name)}`);
      if (isError(res)) return res;
      const data = ((res as { data?: unknown[] }).data || []) as Array<Record<string, unknown>>;
      if (data.length === 0) return { error: 400, message: 'No card matching your query was found in the database.' };
      return mapCard(data[0]);
    }
    case 'random_card': {
      const res = await ygoGet('/randomcard.php');
      if (isError(res)) return res;
      return mapCard(res as Record<string, unknown>);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function mapCard(c: Record<string, unknown>): unknown {
  return {
    id: c.id,
    name: c.name,
    type: c.type,
    frameType: c.frameType,
    desc: c.desc,
    atk: c.atk,
    def: c.def,
    level: c.level,
    race: c.race,
    attribute: c.attribute,
    archetype: c.archetype,
    scale: c.scale,
    linkval: c.linkval,
    banlist: c.banlist_info,
    sets: (c.card_sets as Array<Record<string, unknown>> | undefined)?.map((s) => ({
      set_name: s.set_name,
      rarity: s.set_rarity,
      price: s.set_price,
    })),
    prices: (c.card_prices as Array<Record<string, unknown>> | undefined)?.[0],
    image: (c.card_images as Array<Record<string, unknown>> | undefined)?.[0]?.image_url,
  };
}

async function ygoGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: 'application/json', 'User-Agent': UA },
  });
  if (!res.ok) {
    const text = await res.text();
    let message = text.slice(0, 300);
    try {
      const body = JSON.parse(text) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // non-JSON body; keep raw text slice
    }
    return { error: res.status, message };
  }
  return res.json();
}

function isError(res: unknown): boolean {
  return typeof res === 'object' && res !== null && 'error' in res;
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
