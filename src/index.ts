#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { WorkLinkClient } from "./api-client.js";
import { registerVacancyTools } from "./tools/vacancies.js";
import { registerTenderTools } from "./tools/tenders.js";

const token = process.env.WORKLINK_API_TOKEN;
if (!token) {
  console.error(
    "Error: WORKLINK_API_TOKEN environment variable is required.\n" +
    "Get a token at https://worklink.sy/api-access"
  );
  process.exit(1);
}

const client = new WorkLinkClient(token);

const server = new McpServer({
  name: "worklink",
  version: "1.0.1",
});

registerVacancyTools(server, client);
registerTenderTools(server, client);

const transport = new StdioServerTransport();
await server.connect(transport);

console.error("worklink-mcp server running on stdio");

process.on("SIGINT", async () => {
  await server.close();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await server.close();
  process.exit(0);
});
