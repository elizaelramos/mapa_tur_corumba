import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8009;

// Proxy para a API
app.use('/api', createProxyMiddleware({
  target: process.env.VITE_API_URL || 'http://localhost:8010',
  changeOrigin: true,
}));

// Proxy para uploads
app.use('/uploads', createProxyMiddleware({
  target: process.env.VITE_API_URL || 'http://localhost:8010',
  changeOrigin: true,
}));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'dist')));

// Todas as rotas retornam o index.html (para React Router funcionar)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend server running on http://0.0.0.0:${PORT}`);
});
