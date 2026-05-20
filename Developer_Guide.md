# Qlik Sense MCP Server - Developer Guide

This guide details the codebase structure, architectural layout, and development/testing workflow for the Qlik Sense Model Context Protocol (MCP) server.

## Table of Contents

- [Architectural Overview](#architectural-overview)
- [Project Structure](#project-structure)
- [Directory Structure & Codebase Map](#directory-structure--codebase-map)
  - [1. Transport Layer](#1-transport-layer-serverts--srcmcp-serverts)
  - [2. Handlers & Context Layer](#2-handlers--context-layer-srchandlers)
  - [3. Service Layer](#3-service-layer-srcservices)
  - [4. API Client Wrapper](#4-api-client-wrapper-srcutils)
  - [5. Diagnostics Web UI Dashboard](#5-diagnostics-web-ui-dashboard-srcapptsx--srcmaintsx)
- [Testing Workflows](#testing-workflows)
  - [Running Diagnostics Server](#running-diagnostics-server)
  - [Testing LLM Tool Calling](#testing-llm-tool-calling)

---

## Architectural Overview

```text
┌─────────────────────────────────────────────────────────────────┐
│                     Claude Desktop / MCP Client                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         MCP Server                               │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐     │
│  │ Tool        │  │ Handler      │  │ MCP Server         │     │
│  │ Registry    │→ │ Router       │→ │ (stdio transport)  │     │
│  └─────────────┘  └──────────────┘  └────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Handlers                                 │
│  Route tool calls to appropriate service methods                 │
│  Handle platform routing (Cloud vs On-Premise)                   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Services                                 │
│  Business logic, API calls, data transformation                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Client                               │
│  HTTP requests (Cloud REST API, QRS API)                        │
│  WebSocket connections (Engine API via enigma.js)               │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Qlik Cloud / Qlik Sense Enterprise           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```text
/
├─ dist/                  # Compiled production JS server files
├─ src/
│  ├─ handlers/
│  │  └─ context.ts       # Context configuration & environment loaders
│  ├─ services/
│  │  └─ qlik-app-service.ts # Core business logic (tenant info, script comparisons, lists)
│  ├─ utils/
│  │  ├─ api-client.ts    # Native fetch API network wrapper
│  │  └─ logger.ts        # Stdout/Stderr logs manager
│  ├─ App.tsx             # Interactive dashboard component (SSE diagnostics)
│  ├─ index.css           # Global theme styling (Tailwind CSS custom styles)
│  ├─ main.tsx            # React application startup script
│  └─ mcp-server.ts       # Tool definitions & Zod schema validation registry
├─ .env.example           # Reference configuration for variables
├─ .gitignore
├─ Developer_Guide.md     # Code layout & design documentation
├─ index.html             # Web page frame
├─ package.json           # Scripts, dependencies, and type configuration
├─ README.md              # Installation guide & usage instructions
├─ server.ts              # Transport routing entry point (Stdio & SSE server)
├─ test-mcp-gemini.js     # Diagnostic tool calling test script
├─ tsconfig.json
└─ vite.config.ts         # Vite server bundle config
```

---

## Directory Structure & Codebase Map

### 1. Transport Layer (`server.ts` & `src/mcp-server.ts`)
* **[server.ts](file:///C:/Users/JonathanPenuliar/antigravity/Qlik-Sense-MCP-Server/server.ts)**: Configures and runs the transport layer. Supports standard CLI `stdio` for AI host clients (Claude Desktop, Cursor) or `sse` HTTP server mode on port 3000 to host the developer dashboard.
* **[src/mcp-server.ts](file:///C:/Users/JonathanPenuliar/antigravity/Qlik-Sense-MCP-Server/src/mcp-server.ts)**: The primary registry where MCP tools (`get_tenant_info`, `list_apps`, `compare_scripts`) are declared and their parameter schemas verified using Zod.

### 2. Handlers & Context Layer (`src/handlers/`)
* **[src/handlers/context.ts](file:///C:/Users/JonathanPenuliar/antigravity/Qlik-Sense-MCP-Server/src/handlers/context.ts)**: Manages authentication context (the loaded tenant URL and JWT/API key loaded from `.env`).

### 3. Service Layer (`src/services/`)
* **[src/services/qlik-app-service.ts](file:///C:/Users/JonathanPenuliar/antigravity/Qlik-Sense-MCP-Server/src/services/qlik-app-service.ts)**: Implements the business logic of tools. Handles:
  * Authentication routing.
  * Auto-pagination of Qlik catalog items (using the Items API `GET /api/v1/items?resourceType=app` in chunks of 100).
  * Load script extraction and diffing comparisons.

### 4. API Client Wrapper (`src/utils/`)
* **[src/utils/api-client.ts](file:///C:/Users/JonathanPenuliar/antigravity/Qlik-Sense-MCP-Server/src/utils/api-client.ts)**: Wraps native HTTP fetches to manage Bearer Token authorization headers and generic error handling.

### 5. Diagnostics Web UI Dashboard (`src/App.tsx` & `src/main.tsx`)
* **[src/App.tsx](file:///C:/Users/JonathanPenuliar/antigravity/Qlik-Sense-MCP-Server/src/App.tsx)**: Built with Professional Polish styled Tailwind CSS. Features environment validation checks, connection instructions, and an interactive tool runner hitting `/api/test-tool` to debug live credentials.

---

## Testing Workflows

### Running Diagnostics Server
To start the developer dashboard playground:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** to test credentials live.

### Testing LLM Tool Calling
Use the Google Gen AI client integration helper to test dynamic tool routing:
```bash
node test-mcp-gemini.js
```
This script queries your local running server to extract schemas, sends them as function definitions to Gemini, retrieves tool calls, executes them locally against Qlik, and prints the generated response.
