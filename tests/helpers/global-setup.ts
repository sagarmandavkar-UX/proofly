import { createServer, type Server } from 'http';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 8080;
const TEST_URL = `http://localhost:${PORT}/test.html`;

let server: Server | null = null;
let serverStartedByUs = false;

async function isServerRunning(): Promise<boolean> {
  try {
    const response = await fetch(TEST_URL);
    return response.ok;
  } catch {
    return false;
  }
}

async function startServer(): Promise<void> {
  const repoRoot = join(__dirname, '../..');

  server = createServer(async (req, res) => {
    try {
      const filePath = join(repoRoot, req.url || '');
      const content = await readFile(filePath, 'utf-8');

      const ext = filePath.split('.').pop();
      const contentType = ext === 'html' ? 'text/html' : 'text/plain';

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (error) {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  return new Promise((resolve) => {
    server!.listen(PORT, () => {
      console.log(`✅ Web server started on port ${PORT}`);
      resolve();
    });
  });
}

export default async function setup() {
  console.log('🔍 Checking if web server is already running...');

  const running = await isServerRunning();

  if (running) {
    console.log(`✅ Web server already running at ${TEST_URL}`);
  } else {
    console.log('🚀 Starting web server...');
    await startServer();
    serverStartedByUs = true;
  }

  return async () => {
    if (serverStartedByUs && server) {
      console.log('🧹 Shutting down web server...');
      server.close();
      console.log('✅ Web server closed');
    }
  };
}
