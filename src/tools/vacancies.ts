import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { WorkLinkClient } from "../api-client.js";
import type { PaginatedResponse, SingleResponse, Vacancy } from "../types.js";

function formatVacancy(v: Vacancy): string {
  const lines: string[] = [];
  lines.push(`# ${v.title}`);
  lines.push("");

  if (v.company) lines.push(`**Company:** ${v.company.name}`);
  if (v.category) lines.push(`**Category:** ${v.category.name}`);
  if (v.type) lines.push(`**Type:** ${v.type}`);
  if (v.salary) lines.push(`**Salary:** ${v.salary}`);
  if (v.locations?.length) lines.push(`**Locations:** ${v.locations.join(", ")}`);
  if (v.deadline) lines.push(`**Deadline:** ${v.deadline}`);
  lines.push(`**Link:** ${v.url}`);
  lines.push("");

  if (v.description) {
    const text = stripHtml(v.description);
    lines.push(text);
  }

  return lines.join("\n");
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(p|div|h[1-6]|li|tr)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen).trimEnd() + "...";
}

function formatList(result: PaginatedResponse<Vacancy>, label: string): string {
  const lines: string[] = [];
  lines.push(`## ${label} (page ${result.meta.current_page}/${result.meta.last_page}, ${result.meta.total} total)`);
  lines.push("");

  for (const v of result.data) {
    const company = v.company?.name ?? "Unknown";
    const type = v.type ?? "";
    const category = v.category?.name ?? "";
    const salary = v.salary ?? "Not specified";
    const locations = v.locations?.join(", ") ?? "";
    const deadline = v.deadline ?? "None";

    lines.push(`### ${v.title}`);
    lines.push(`- **Company:** ${company}`);
    if (type) lines.push(`- **Type:** ${type}`);
    if (category) lines.push(`- **Category:** ${category}`);
    lines.push(`- **Salary:** ${salary}`);
    if (locations) lines.push(`- **Locations:** ${locations}`);
    lines.push(`- **Deadline:** ${deadline}`);
    if (v.description) {
      const preview = truncate(stripHtml(v.description), 200);
      lines.push(`- **Preview:** ${preview}`);
    }
    lines.push(`- **Link:** ${v.url}`);
    lines.push("");
  }

  if (result.meta.last_page > result.meta.current_page) {
    lines.push(`_More pages available (page ${result.meta.current_page + 1} of ${result.meta.last_page}). Use page parameter to see more._`);
  }

  return lines.join("\n");
}

export function registerVacancyTools(server: McpServer, client: WorkLinkClient): void {
  server.registerTool(
    "list_vacancies",
    {
      description: "List active job vacancies from WorkLink Syria. Returns paginated results with title, company, salary, locations, and apply link.",
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
        const result = await client.getVacancies(args) as PaginatedResponse<Vacancy>;
        return {
          content: [{ type: "text", text: formatList(result, "Job Vacancies") }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error listing vacancies: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    }
  );

  server.registerTool(
    "get_vacancy",
    {
      description: "Get full details of a single job vacancy by its slug. Returns title, description (HTML), salary, type, company, locations, deadline, and apply link.",
      inputSchema: {
        slug: z.string().describe("The vacancy slug (from the URL or from list_vacancies results)"),
      },
    },
    async (args) => {
      try {
        const result = await client.getVacancy(args.slug) as SingleResponse<Vacancy>;
        return {
          content: [{ type: "text", text: formatVacancy(result.data) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error getting vacancy: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        };
      }
    }
  );
}
