# worklink-mcp

[![npm version](https://img.shields.io/npm/v/worklink-mcp.svg)](https://www.npmjs.com/package/worklink-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MCP server for the [WorkLink Partner API](https://worklink.sy/api/partner/docs) — search live job vacancies and tenders in Syria.

## Get a Token

1. Go to https://worklink.sy/api-access
2. Fill the form (choose vacancies and/or tenders)
3. Wait for WorkLink to issue your token

## Install

No installation needed — run directly with `npx`:

```bash
npx -y worklink-mcp
```

## Configure

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "worklink": {
      "command": "npx",
      "args": ["-y", "worklink-mcp"],
      "env": {
        "WORKLINK_API_TOKEN": "your-token-here"
      }
    }
  }
}
```

### OpenCode

Add to `.opencode.json`:

```json
{
  "mcp": {
    "worklink": {
      "command": "npx",
      "args": ["-y", "worklink-mcp"],
      "env": {
        "WORKLINK_API_TOKEN": "your-token-here"
      }
    }
  }
}
```

### Cursor / Windsurf

Add to your MCP settings (`.cursor/mcp.json` or equivalent):

```json
{
  "mcpServers": {
    "worklink": {
      "command": "npx",
      "args": ["-y", "worklink-mcp"],
      "env": {
        "WORKLINK_API_TOKEN": "your-token-here"
      }
    }
  }
}
```

### ChatGPT

In ChatGPT settings > MCP Servers > Add server:

- **Command:** `npx -y worklink-mcp`
- **Env:** `WORKLINK_API_TOKEN=your-token-here`

## Tools

| Tool | Description |
|------|-------------|
| `list_vacancies` | List active job vacancies with pagination, category/company/open filters |
| `get_vacancy` | Get full details of a single vacancy by slug |
| `list_tenders` | List published tenders with pagination and filters |
| `get_tender` | Get tender preview by slug (full body on WorkLink) |

## Example Prompts

Once configured, ask your AI assistant:

- "Show me the latest job vacancies in Damascus"
- "Find engineering jobs with salary above 500"
- "What tenders are open this month?"
- "Get details for the vacancy at company X"

## Troubleshooting

### "WORKLINK_API_TOKEN environment variable is required"

The token is missing. Make sure you set `WORKLINK_API_TOKEN` in the MCP server config's `env` block (see Configure section above).

### "WorkLink API error (401): Unauthorized"

Your token is invalid or expired. Get a new one at https://worklink.sy/api-access.

### "WorkLink API error (429): Too Many Requests"

You've hit the rate limit (120 requests/minute). The server automatically retries with exponential backoff, but if this persists, wait a minute before trying again.

### Request timed out

The server has a 30-second timeout per request. If WorkLink's API is slow, the request will be retried up to 3 times before failing.

## Rate Limiting

The server respects WorkLink's 120 requests/minute limit with built-in throttling. If the limit is hit, requests are automatically retried with exponential backoff.

## License

MIT
