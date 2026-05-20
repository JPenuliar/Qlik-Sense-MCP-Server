import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { mcpServer } from "./src/mcp-server.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { qlikAppService } from "./src/services/qlik-app-service.js";

async function startServer() {
  // Check if we should run in Stdio mode (standard CLI for Claude/Cursor/Inspector)
  const isStdio = process.argv.includes("--stdio");

  if (isStdio) {
    // Stdio transport for local MCP clients
    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);
    console.error("Qlik Sense MCP Server running on Stdio transport");
  } else {
    // SSE + HTTP server for remote/web dashboard integration
    const app = express();
    const PORT = parseInt(process.env.PORT || "3000", 10);

    app.use(express.json());

    // Registry for active SSE transports
    const transports: Record<string, SSEServerTransport> = {};

    // Get server status and tool registration info
    app.get("/api/status", (req, res) => {
      res.json({
        status: "ok",
        name: "qlik-sense-mcp-server",
        version: "1.0.0",
        transport: "SSE",
        configuredEnv: {
          QLIK_TENANT_URL: !!process.env.QLIK_TENANT_URL,
          QLIK_API_KEY: !!process.env.QLIK_API_KEY,
          GEMINI_API_KEY: !!process.env.GEMINI_API_KEY
        },
        tools: [
          {
            name: "get_tenant_info",
            description: "Retrieves metadata for a specific Qlik tenant.",
            parameters: {
              tenantId: "string (required)"
            }
          },
          {
            name: "list_apps",
            description: "Lists apps in the Qlik Sense tenant with pagination support.",
            parameters: {
              limit: "number (optional, default 50)",
              next: "string (optional)"
            }
          },
          {
            name: "compare_scripts",
            description: "Compares scripts from two Qlik Sense applications and generates a summary report of differences.",
            parameters: {
              appId1: "string (required)",
              appId2: "string (required)"
            }
          }
        ]
      });
    });

    // Test endpoint to execute tools directly (for dashboard testing)
    app.post("/api/test-tool", async (req, res) => {
      const { name, args } = req.body;
      const context = {
        token: process.env.QLIK_API_KEY,
        tenantUrl: process.env.QLIK_TENANT_URL,
        platformFlags: {}
      };

      try {
        let result: any;
        if (name === "get_tenant_info") {
          result = await qlikAppService.getTenantInfo(args.tenantId, context);
        } else if (name === "list_apps") {
          result = await qlikAppService.listApps({
            limit: args.limit ? parseInt(args.limit, 10) : undefined,
            next: args.next || undefined
          }, context);
        } else if (name === "compare_scripts") {
          result = await qlikAppService.compareScripts(args.appId1, args.appId2, context);
        } else {
          throw new Error("Invalid tool name");
        }
        res.json(result);
      } catch (err: any) {
        console.error(`Error executing test tool ${name}:`, err);
        res.status(500).json({ error: err.message });
      }
    });

    // SSE connection endpoint
    app.get("/sse", async (req, res) => {
      const transport = new SSEServerTransport("/message", res);
      
      // Store the transport under its unique sessionId
      const sessionId = transport.sessionId;
      transports[sessionId] = transport;

      res.on("close", () => {
        delete transports[sessionId];
      });

      await mcpServer.connect(transport);
    });

    // Message handler endpoint
    app.post("/message", async (req, res) => {
      const sessionId = req.query.sessionId as string;
      const transport = transports[sessionId];

      if (transport) {
        await transport.handlePostMessage(req, res);
      } else {
        res.status(400).send("Session not found");
      }
    });

    // Vite middleware for development
    if (process.env.NODE_ENV !== "production") {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
});
