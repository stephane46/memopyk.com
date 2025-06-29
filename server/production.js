import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Basic health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'production'
  });
});

// API health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'production',
    database: 'configured'
  });
});

// Serve static files from dist/public
const staticPath = path.resolve(__dirname, '..', 'dist', 'public');
console.log('Serving static files from:', staticPath);

app.use(express.static(staticPath));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

const port = parseInt(process.env.PORT || '3000', 10);
const server = createServer(app);

server.listen({
  port,
  host: '0.0.0.0'
}, () => {
  console.log(`Production server running on port ${port}`);
});