# Qlik Sense MCP Server

A Model Context Protocol (MCP) server designed to compare Qlik Sense application scripts and generate summary reports of differences. It exposes tools that allow AI assistants (like Claude, Cursor, and others) to securely fetch tenant metadata, analyze script changes, and compile structural difference diffs.

---

## Features

- **Get Tenant Info**: Fetch environment status, region, and configuration metadata for a Qlik Sense tenant.
- **Compare Scripts**: Perform comparative diffs between two Qlik Sense app scripts, reporting added, modified, or deleted segments along with an evaluation summary.
- **Dual Transport Options**:
  - **Stdio**: Standard input/output transport for direct host integration (Claude Desktop, Cursor, etc.).
  - **SSE (Server-Sent Events)**: Web-based transport hosting an interactive dashboard on port 3000.

---

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)

### Setup

1. Open this directory in your terminal.
2. Install package dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables by copying `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```
4. Edit the `.env` file to configure your Qlik Sense credentials:
   ```env
   QLIK_TENANT_URL="https://your-tenant-name.us.qlikcloud.com"
   QLIK_API_KEY="your-qlik-jwt-or-api-key"
   ```

---

## Usage

### 1. Interactive Web Dashboard (SSE Transport)

To run the server in web mode:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser to view:
- Environment credentials status checklist.
- Active tool registry details.
- An interactive **Tool execution playground** to test responses.
- IDE connection instructions.

### 2. Client Integration (Stdio Transport)

To connect this server to desktop AI tools, first build the production distribution:
```bash
npm run build
```

#### Claude Desktop
Add this server block to your `claude_desktop_config.json` configuration file:
```json
{
  "mcpServers": {
    "qlik-sense-mcp": {
      "command": "node",
      "args": ["C:/Users/JonathanPenuliar/antigravity/Qlik-Sense-MCP-Server/dist/server.cjs", "--stdio"],
      "env": {
        "QLIK_TENANT_URL": "https://your-tenant.us.qlikcloud.com",
        "QLIK_API_KEY": "your-api-key"
      }
    }
  }
}
```

#### Cursor IDE
Go to **Settings > Features > MCP**, click **+ Add New MCP Server**, set the type to **stdio**, and use the following command:
```bash
node "C:/Users/JonathanPenuliar/antigravity/Qlik-Sense-MCP-Server/dist/server.cjs" --stdio
```

#### MCP Inspector (Debugging)
To debug and interact with the server using the official browser GUI:
```bash
npx @modelcontextprotocol/inspector node dist/server.cjs --stdio
```