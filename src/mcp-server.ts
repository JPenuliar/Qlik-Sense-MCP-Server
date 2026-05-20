import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { qlikAppService } from "./services/qlik-app-service.js";
import { defaultContext } from "./handlers/context.js";

// Initialize standard MCP Server
export const mcpServer = new McpServer({
  name: "qlik-sense-mcp-server",
  version: "1.0.0",
});

// Register Tool: get_tenant_info
mcpServer.registerTool(
  "get_tenant_info",
  {
    description: "Retrieves metadata for a specific Qlik tenant.",
    inputSchema: z.object({
      tenantId: z.string().describe("The unique UUID of the Qlik tenant"),
    }),
  },
  async ({ tenantId }) => {
    try {
      const result = await qlikAppService.getTenantInfo(tenantId, defaultContext);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  }
);

// Register Tool: compare_scripts
mcpServer.registerTool(
  "compare_scripts",
  {
    description: "Compares scripts from two Qlik Sense applications and generates a summary report of differences.",
    inputSchema: z.object({
      appId1: z.string().describe("The UUID of the first Qlik Sense application"),
      appId2: z.string().describe("The UUID of the second Qlik Sense application"),
    }),
  },
  async ({ appId1, appId2 }) => {
    try {
      const result = await qlikAppService.compareScripts(appId1, appId2, defaultContext);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  }
);
