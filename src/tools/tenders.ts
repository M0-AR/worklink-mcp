import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { WorkLinkClient } from "../api-client.js";
import type { PaginatedResponse, SingleResponse, Tender } from "../types.js";

function formatTender(t: Tender): string {
  const lines: string[] = [];
  lines.push(`# ${t.title}`);
  lines.push("");

  if (t.company) lines.push(`**Company:** ${t.company.name}`);
  if (t.category) lines.push(`**Category:** ${t.category.name}`);
  if (t.location) lines.push(`**Location:** ${t.location}`);
  if (t.deadline) lines.push(`**Deadline:** ${t.deadline}`);
  lines.push("");

  lines.push("**Preview:**");
  lines.push(t.preview);
  lines.push("");

  lines.push(`**View full tender and apply:** ${t.url}`);

  return lines.join("\n");
}

function formatList(result: PaginatedResponse<Tender>, label: string): string {
  const lines: string[] = [];
  lines.push(`## ${label} (page ${result.meta.current_page}/${result.meta.last_page}, ${result.meta.total} total)`);
  lines.push("");

  for (const t of result.data) {
    const company = t.company?.name ?? "Unknown";
    const category = t.category?.name ?? "";
    const location = t.location ?? "Not specified";
    const deadline = t.deadline ?? "None";

    lines.push(`### ${t.title}`);
    lines.push(`- **Company:** ${company}`);
    if (category) lines.push(`- **Category:** ${category}`);
    lines.push(`- **Location:** ${location}`);
    lines.push(`- **Deadline:** ${deadline}`);
    const preview = t.preview.length > 300
      ? t.preview.substring(0, 300).trimEnd() + "..."
      : t.preview;
    lines.push(`- **Preview:** ${preview}`);
    lines.push(`- **Link:** ${t.url}`);
    lines.push("");
  }

  if (result.meta.last_page > result.meta.current_page) {
    lines.push(`_More pages available (page ${result.meta.current_page + 1} of ${result.meta.last_page}). Use page parameter to see more._`);
  }

  return lines.join("\n");
}

export function registerTenderTools(server: McpServer, client: WorkLinkClient): void {
  server.registerTool(
    "list_tenders",
    {
      description: "List published tenders from WorkLink Syria. Returns paginated results with title, company, location, preview text, and link to full tender.",
      inputSchema: {
        page: z.number().int().min(1).optional().describe("Page number (default: 1)"),
        per_page: z.number().int().min(1).max(50).optional().describe("Results per page, 1-50 (default: 20)"),
        category: z.number().int().optional().describe("Filter by category ID"),
        company: z.number().int().optional().describe("Filter by company ID"),
        open: z.union([z.literal(0), z.literal(1)]).optional().describe("1 = only currently-open items (no deadline or deadline is today or later)"),
      },
    },
    async (args) => {
      try {
        const result = await client.getTenders(args) as PaginatedResponse<Tender>;
        return {
          content: [{ type: "text", text: formatList(result, "Tenders") }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error listing tenders: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    "get_tender",
    {
      description: "Get details of a single tender by its slug. Returns preview text only (full body is on WorkLink). Always includes link to view full tender and apply.",
      inputSchema: {
        slug: z.string().describe("The tender slug (from the URL or from list_tenders results)"),
      },
    },
    async (args) => {
      try {
        const result = await client.getTender(args.slug) as SingleResponse<Tender>;
        return {
          content: [{ type: "text", text: formatTender(result.data) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error getting tender: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    }
  );
}
