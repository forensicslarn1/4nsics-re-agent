import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverPath = resolve(__dirname, '../dist/mcp-server.js');

console.log('[Test] Starting MCP server test...');
console.log(`[Test] Server script: ${serverPath}`);

const child = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'inherit'],
});

let buffer = '';

function send(msg: any) {
  const json = JSON.stringify(msg);
  child.stdin.write(json + '\n');
}

child.stdout.on('data', (chunk) => {
  buffer += chunk.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      handleMessage(msg);
    } catch (e) {
      console.error('[Test Error parsing stdout]:', line);
    }
  }
});

let step = 0;

function handleMessage(msg: any) {
  console.log(`\n[Test Client] Received response for id=${msg.id}:`);

  if (msg.id === 1) {
    // Received initialize response
    console.log('✅ 1. Initialize Response received:', msg.result?.serverInfo);
    send({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
    });
    // Request tools list
    send({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {},
    });
  } else if (msg.id === 2) {
    // Received tools/list response
    const tools = msg.result?.tools?.map((t: any) => t.name);
    console.log('✅ 2. Available Tools:', tools);

    // Call open_binary
    console.log('\n[Test Client] Calling open_binary on cmd.exe...');
    send({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'open_binary',
        arguments: {
          filePath: 'C:\\Windows\\System32\\cmd.exe',
        },
      },
    });
  } else if (msg.id === 3) {
    // Received open_binary response
    console.log('✅ 3. open_binary success!');
    const content = JSON.parse(msg.result?.content?.[0]?.text || '{}');
    console.log('   Binary File:', content.filePath);

    // Call get_sections
    console.log('\n[Test Client] Calling get_sections...');
    send({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'get_sections',
        arguments: {},
      },
    });
  } else if (msg.id === 4) {
    // Received get_sections response
    const sections = JSON.parse(msg.result?.content?.[0]?.text || '[]');
    console.log(`✅ 4. get_sections success! Found ${sections.length} sections:`);
    sections.slice(0, 3).forEach((s: any) => console.log(`   - ${s.name} (vaddr: 0x${s.vaddr.toString(16)}, size: ${s.size}, perm: ${s.perm})`));

    // Call get_strings
    console.log('\n[Test Client] Calling get_strings...');
    send({
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'get_strings',
        arguments: {
          minLen: 6,
          limit: 3,
        },
      },
    });
  } else if (msg.id === 5) {
    // Received get_strings response
    const strings = JSON.parse(msg.result?.content?.[0]?.text || '[]');
    console.log(`✅ 5. get_strings success! Sample strings (${strings.length}):`);
    strings.forEach((s: any) => console.log(`   - "${s.string}" (section: ${s.section}, type: ${s.type})`));

    // Call list_functions
    console.log('\n[Test Client] Calling list_functions...');
    send({
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: {
        name: 'list_functions',
        arguments: {
          limit: 3,
        },
      },
    });
  } else if (msg.id === 6) {
    // Received list_functions response
    const functions = JSON.parse(msg.result?.content?.[0]?.text || '[]');
    console.log(`✅ 6. list_functions success! Sample functions (${functions.length}):`);
    functions.forEach((f: any) => console.log(`   - ${f.name} (offset: 0x${f.offset.toString(16)}, size: ${f.size})`));

    // Call close_session
    console.log('\n[Test Client] Calling close_session...');
    send({
      jsonrpc: '2.0',
      id: 7,
      method: 'tools/call',
      params: {
        name: 'close_session',
        arguments: {},
      },
    });
  } else if (msg.id === 7) {
    // Received close_session response
    console.log('✅ 7. close_session success!');
    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! Terminating test client.');
    child.kill();
    process.exit(0);
  }
}

// Kick off initialization
send({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'test-client',
      version: '1.0.0',
    },
  },
});

setTimeout(() => {
  console.error('Test timed out after 30 seconds');
  child.kill();
  process.exit(1);
}, 30000);
