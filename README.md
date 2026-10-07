# 4nsics-re-agent

A high-performance Model Context Protocol (MCP) server for binary analysis and reverse engineering built with **TypeScript**, **Node.js (ESM)**, and **radare2** (`r2pipe`).

## 🚀 Features

- **MCP Protocol via `stdio`**: Seamless integration with Antigravity and any MCP-compatible AI agent or client.
- **radare2 Integration**: Manages `radare2` sessions via Promises.
- **Stdio Isolation**: All diagnostic and analysis logs are strictly redirected to `stderr`, leaving `stdout` dedicated to JSON-RPC messages.
- **Available Tools**:
  - `open_binary`: Opens an executable / binary file, performs structure inspection (`ij`), and initializes analysis (`aa`).
  - `list_functions`: Analyzes functions (`aflj`) and excludes external imported libraries (`sym.imp.*`).
  - `get_strings`: Extracts printable strings (`izj`) with customizable minimum length and limit.
  - `get_sections`: Analyzes binary sections (`iSj`) with addresses, sizes, and permission flags.
  - `close_session`: Safely quits the active radare2 session and releases resources.

---

## 📁 Project Structure

```
4nsics-re-agent/
├── src/
│   ├── types.ts          # TypeScript interfaces (BinaryFunction, BinaryString, BinarySection, FilterOptions)
│   ├── analyzer.ts       # BinaryAnalyzer class managing radare2 sessions via r2pipe
│   └── mcp-server.ts     # MCP server with StdioServerTransport & registered tools
├── test/
│   └── test-server.ts    # End-to-end integration test client
├── dist/                 # Compiled JavaScript files
├── antigravity.mcp.json  # MCP configuration file for Antigravity
├── tsconfig.json         # TypeScript configuration (ES2022, NodeNext)
└── package.json          # Package manifest and scripts
```

---

## 🛠️ Prerequisites

- **Node.js** (v18+)
- **radare2** installed and accessible in `PATH`.

---

## 📦 Getting Started

### 1. Build
```bash
npm run build
```

### 2. Type Check
```bash
npm run typecheck
```

### 3. Run Automated Tests
```bash
npm test
```

### 4. Start Server
```bash
npm start
```
Or for development with automatic TypeScript execution:
```bash
npm run dev
```

---

## ⚙️ MCP Configuration (`antigravity.mcp.json`)

```json
{
  "mcpServers": {
    "4nsics-re-agent": {
      "command": "node",
      "args": [
        "dist/mcp-server.js"
      ]
    }
  }
}
```
