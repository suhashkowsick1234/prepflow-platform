import { spawn } from 'node:child_process';
import http from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Load .env file
const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const envFile = readFileSync(resolve(__dirname, '.env'), 'utf8');
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (key && !process.env[key]) process.env[key] = val;
  }
  console.log('Loaded .env file');
} catch {
  // No .env file, that's ok
}

const API_PORT = 5000;
const FRONTEND_PORT = 23488;
const PROXY_PORT = 3000;

console.log('Starting PrepFlow AI local development servers...');

// 1. Start API Server
const apiProcess = spawn('npx', [
  'cross-env',
  `PORT=${API_PORT}`,
  'NODE_ENV=development',
  'pnpm',
  '--filter',
  '@workspace/api-server',
  'run',
  'dev'
], {
  shell: true,
  stdio: 'pipe',
  env: { ...process.env, PORT: String(API_PORT) }
});

apiProcess.stdout.on('data', (data) => {
  const lines = data.toString().split('\n');
  for (const line of lines) {
    if (line.trim()) console.log(`[API] ${line.trim()}`);
  }
});
apiProcess.stderr.on('data', (data) => {
  const lines = data.toString().split('\n');
  for (const line of lines) {
    if (line.trim()) console.error(`[API ERROR] ${line.trim()}`);
  }
});

// 2. Start Frontend Server
const frontendProcess = spawn('npx', [
  'cross-env',
  `PORT=${FRONTEND_PORT}`,
  'BASE_PATH=/',
  'NODE_ENV=development',
  'pnpm',
  '--filter',
  '@workspace/prepflow',
  'run',
  'dev'
], {
  shell: true,
  stdio: 'pipe',
  env: { ...process.env, PORT: String(FRONTEND_PORT), BASE_PATH: '/' }
});

frontendProcess.stdout.on('data', (data) => {
  const lines = data.toString().split('\n');
  for (const line of lines) {
    if (line.trim()) console.log(`[Frontend] ${line.trim()}`);
  }
});
frontendProcess.stderr.on('data', (data) => {
  const lines = data.toString().split('\n');
  for (const line of lines) {
    if (line.trim()) console.error(`[Frontend ERROR] ${line.trim()}`);
  }
});

// 3. Start Local Proxy Server
const server = http.createServer((req, res) => {
  const isApi = req.url.startsWith('/api');
  const targetHost = '127.0.0.1';
  const targetPort = isApi ? API_PORT : FRONTEND_PORT;
  
  const proxyReq = http.request({
    host: targetHost,
    port: targetPort,
    path: req.url,
    method: req.method,
    headers: req.headers
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  
  proxyReq.on('error', (err) => {
    res.writeHead(502);
    res.end(`Proxy error connecting to ${isApi ? 'API' : 'Frontend'} server: ${err.message}`);
  });
  
  req.pipe(proxyReq);
});

server.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log('\n======================================================');
  console.log(` PrepFlow AI is running!`);
  console.log(` Open your browser at: http://localhost:${PROXY_PORT}`);
  console.log(`======================================================\n`);
});

// Handle termination
const cleanup = () => {
  console.log('\nStopping servers...');
  apiProcess.kill();
  frontendProcess.kill();
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
