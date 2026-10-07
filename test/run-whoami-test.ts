import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverPath = resolve(__dirname, '../dist/mcp-server.js');

const child = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
});

let buffer = '';
const pendingRequests = new Map<number, (res: any) => void>();
let reqId = 1;

child.stderr.on('data', (data) => {
  // Stderr holds diagnostic logs
  process.stderr.write(`[SERVER-STDERR] ${data.toString()}`);
});

child.stdout.on('data', (chunk) => {
  buffer += chunk.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id && pendingRequests.has(msg.id)) {
        const resolveFn = pendingRequests.get(msg.id)!;
        pendingRequests.delete(msg.id);
        resolveFn(msg);
      }
    } catch (e) {
      console.error('Error parsing line:', line);
    }
  }
});

function callRpc(method: string, params: any = {}): Promise<any> {
  const id = reqId++;
  return new Promise((resolve) => {
    pendingRequests.set(id, resolve);
    const msg = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };
    child.stdin.write(JSON.stringify(msg) + '\n');
  });
}

function notify(method: string, params: any = {}) {
  const msg = {
    jsonrpc: '2.0',
    method,
    params,
  };
  child.stdin.write(JSON.stringify(msg) + '\n');
}

async function run() {
  // Step 0: MCP Handshake
  await callRpc('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test-runner', version: '1.0.0' },
  });
  notify('notifications/initialized');

  // Step 1: open_binary
  console.log('=== STEP 1: open_binary ===');
  const res1 = await callRpc('tools/call', {
    name: 'open_binary',
    arguments: {
      filePath: 'C:\\Windows\\System32\\whoami.exe',
    },
  });
  console.log(JSON.stringify(res1.result, null, 2));

  // Step 2: list_functions
  console.log('\n=== STEP 2: list_functions (limit: 10) ===');
  const res2 = await callRpc('tools/call', {
    name: 'list_functions',
    arguments: {
      limit: 10,
    },
  });
  console.log(JSON.stringify(res2.result, null, 2));

  // Step 3: get_strings
  console.log('\n=== STEP 3: get_strings (minLen: 5, limit: 15) ===');
  const res3 = await callRpc('tools/call', {
    name: 'get_strings',
    arguments: {
      minLen: 5,
      limit: 15,
    },
  });
  console.log(JSON.stringify(res3.result, null, 2));

  // Step 4: close_session
  console.log('\n=== STEP 4: close_session ===');
  const res4 = await callRpc('tools/call', {
    name: 'close_session',
    arguments: {},
  });
  console.log(JSON.stringify(res4.result, null, 2));

  child.kill();
  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal error during test:', err);
  child.kill();
  process.exit(1);
});
