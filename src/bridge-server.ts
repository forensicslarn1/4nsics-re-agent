import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BinaryAnalyzer } from './analyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

// Setup upload directory
const uploadsDir = resolve(__dirname, '../uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const safeName = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    cb(null, safeName);
  },
});

const upload = multer({ storage });
const analyzer = new BinaryAnalyzer();

app.use(cors());
app.use(express.json());

// 1. Health & Status
app.get('/api/status', (_req, res) => {
  res.json({
    status: 'online',
    engine: 'radare2 (r2pipe)',
    activeFile: analyzer.getActiveFilePath(),
    mode: 'live',
  });
});

// 2. Open binary file by local path
app.post('/api/open', async (req, res) => {
  try {
    const { filePath } = req.body;
    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ error: "Missing or invalid 'filePath' parameter" });
    }

    console.log(`[Bridge Server] Initializing file: ${filePath}`);
    const result = await analyzer.initialize(filePath);

    res.json({
      success: true,
      filePath: result.filePath,
      fileName: basename(result.filePath),
      info: result.info,
    });
  } catch (error: any) {
    console.error('[Bridge Server Error /open]:', error);
    res.status(500).json({ error: error?.message || 'Failed to initialize binary file' });
  }
});

// 3. Upload binary file from browser
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No binary file uploaded' });
    }

    const uploadedPath = resolve(req.file.path);
    console.log(`[Bridge Server] Uploaded file received: ${req.file.originalname} -> ${uploadedPath}`);

    const result = await analyzer.initialize(uploadedPath);

    res.json({
      success: true,
      fileName: req.file.originalname,
      filePath: uploadedPath,
      size: req.file.size,
      info: result.info,
    });
  } catch (error: any) {
    console.error('[Bridge Server Error /upload]:', error);
    res.status(500).json({ error: error?.message || 'Failed to process uploaded binary' });
  }
});

// 4. List Functions
app.get('/api/functions', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(String(req.query.limit)) : undefined;
    const functions = await analyzer.getFunctions(limit);
    res.json(functions);
  } catch (error: any) {
    console.error('[Bridge Server Error /functions]:', error);
    res.status(500).json({ error: error?.message || 'Failed to fetch functions' });
  }
});

// 5. Disassemble Function
app.get('/api/disassemble', async (req, res) => {
  try {
    const target = req.query.target ? String(req.query.target) : 'entry0';
    const disasm = await analyzer.disassembleFunction(target);
    res.json(disasm);
  } catch (error: any) {
    console.error('[Bridge Server Error /disassemble]:', error);
    res.status(500).json({ error: error?.message || 'Failed to disassemble function' });
  }
});

// 6. Get Strings
app.get('/api/strings', async (req, res) => {
  try {
    const minLen = req.query.minLen ? parseInt(String(req.query.minLen)) : 4;
    const limit = req.query.limit ? parseInt(String(req.query.limit)) : undefined;
    const strings = await analyzer.getStrings(minLen, limit);
    res.json(strings);
  } catch (error: any) {
    console.error('[Bridge Server Error /strings]:', error);
    res.status(500).json({ error: error?.message || 'Failed to fetch strings' });
  }
});

// 7. Get Sections
app.get('/api/sections', async (_req, res) => {
  try {
    const sections = await analyzer.getSections();
    res.json(sections);
  } catch (error: any) {
    console.error('[Bridge Server Error /sections]:', error);
    res.status(500).json({ error: error?.message || 'Failed to fetch sections' });
  }
});

// 8. Get Cross References
app.get('/api/xrefs', async (req, res) => {
  try {
    const target = req.query.target ? String(req.query.target) : 'entry0';
    const xrefs = await analyzer.getXrefs(target);
    res.json(xrefs);
  } catch (error: any) {
    console.error('[Bridge Server Error /xrefs]:', error);
    res.status(500).json({ error: error?.message || 'Failed to fetch xrefs' });
  }
});

// 9. Close session
app.post('/api/close', async (_req, res) => {
  try {
    await analyzer.close();
    res.json({ success: true, status: 'closed' });
  } catch (error: any) {
    console.error('[Bridge Server Error /close]:', error);
    res.status(500).json({ error: error?.message || 'Failed to close session' });
  }
});

const server = app.listen(PORT, () => {
  console.log(`[4nsics Bridge] REST / WebSocket API server listening on http://localhost:${PORT}`);
});

const shutdown = async () => {
  console.log('[4nsics Bridge] Shutting down server...');
  try {
    await analyzer.close();
  } catch {}
  server.close(() => {
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
