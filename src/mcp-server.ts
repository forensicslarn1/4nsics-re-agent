// Redirect all stdout console.log calls to stderr to keep JSON-RPC stdio stream clean
console.log = (...args: any[]) => {
  console.error(...args);
};

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { BinaryAnalyzer } from './analyzer.js';

const analyzer = new BinaryAnalyzer();

const server = new Server(
  {
    name: '4nsics-re-agent',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'open_binary',
        description: 'Open and analyze a binary file using radare2 session',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: 'Path to the binary file to analyze',
            },
          },
          required: ['filePath'],
        },
      },
      {
        name: 'list_functions',
        description: 'List analyzed functions from the binary, excluding external library imports (sym.imp.*)',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum number of functions to return',
            },
          },
        },
      },
      {
        name: 'get_strings',
        description: 'Extract printable strings from the binary',
        inputSchema: {
          type: 'object',
          properties: {
            minLen: {
              type: 'number',
              description: 'Minimum string length (default: 4)',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of strings to return',
            },
          },
        },
      },
      {
        name: 'get_sections',
        description: 'List binary sections with their memory addresses, sizes, and permissions',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_xrefs',
        description: 'Retrieve cross-references to and from a specific function, address, or symbol (axtj / axfj)',
        inputSchema: {
          type: 'object',
          properties: {
            target: {
              type: 'string',
              description: 'Target function name, symbol, or hex address (e.g. entry0, 0x140003ab0)',
            },
          },
          required: ['target'],
        },
      },
      {
        name: 'decompile_function',
        description: 'Disassemble/decompile a function into structured assembly instructions and opcodes (pdfj)',
        inputSchema: {
          type: 'object',
          properties: {
            target: {
              type: 'string',
              description: 'Function name or memory address to disassemble (e.g. entry0, main, 0x140001000)',
            },
          },
          required: ['target'],
        },
      },
      {
        name: 'close_session',
        description: 'Safely close the active radare2 session and release resources',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  console.error(`[MCP Tool Request] Executing tool: ${name}`);

  try {
    switch (name) {
      case 'open_binary': {
        const filePath = String(args?.filePath || '');
        if (!filePath) {
          throw new Error("Parameter 'filePath' is required");
        }
        const result = await analyzer.initialize(filePath);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'list_functions': {
        const limit = typeof args?.limit === 'number' ? args.limit : undefined;
        const result = await analyzer.getFunctions(limit);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_strings': {
        const minLen = typeof args?.minLen === 'number' ? args.minLen : 4;
        const limit = typeof args?.limit === 'number' ? args.limit : undefined;
        const result = await analyzer.getStrings(minLen, limit);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_sections': {
        const result = await analyzer.getSections();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get_xrefs': {
        const target = String(args?.target || '');
        if (!target) {
          throw new Error("Parameter 'target' is required");
        }
        const result = await analyzer.getXrefs(target);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'decompile_function':
      case 'disassemble_function': {
        const target = String(args?.target || '');
        if (!target) {
          throw new Error("Parameter 'target' is required");
        }
        const result = await analyzer.disassembleFunction(target);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'close_session': {
        await analyzer.close();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ status: 'Session closed successfully' }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    console.error(`[MCP Tool Error] Failure in ${name}:`, error?.message || error);
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Error: ${error?.message || String(error)}`,
        },
      ],
    };
  }
});

const cleanup = async () => {
  try {
    await analyzer.close();
  } catch {}
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[MCP Server] 4nsics-re-agent MCP server is running on stdio');
}

runServer().catch((error) => {
  console.error('[MCP Server Fatal Error]:', error);
  process.exit(1);
});
