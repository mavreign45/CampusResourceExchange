// scripts/test-server.js
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

const server = http.createServer((req, res) => {
  const filePath = path.join(distDir, req.url === '/' ? 'index.html' : req.url);
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath);
    const contentType = ext === '.html' ? 'text/html' : ext === '.js' ? 'application/javascript' : ext === '.css' ? 'text/css' : 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(fs.readFileSync(filePath));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(4999, '127.0.0.1', () => {
  console.log('Test static server running on http://127.0.0.1:4999');

  http.get('http://127.0.0.1:4999', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('HTTP Status Code:', res.statusCode);
      console.assert(res.statusCode === 200, 'Expected status 200');
      console.assert(data.includes('Campus Resource Exchange'), 'HTML title missing');
      console.assert(data.includes('assets/index-'), 'Asset script tags missing');
      console.log('✓ Successfully rendered and served production dist build over HTTP (Status: 200, Length: ' + data.length + ' bytes)');
      server.close(() => {
        console.log('Server stopped cleanly.');
        process.exit(0);
      });
    });
  }).on('error', (err) => {
    console.error('HTTP Request failed:', err);
    server.close(() => process.exit(1));
  });
});
