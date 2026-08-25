const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { requestLogger, errorLogger, logger } = require('@mapatur/logger');
const { prisma } = require('@mapatur/database');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
// const stagingRoutes = require('./routes/staging.routes'); // DESATIVADO - modelo removido (migração para turismo)
const unidadeRoutes = require('./routes/unidade.routes');
const categoriaRoutes = require('./routes/categoria.routes');
// const medicoRoutes = require('./routes/medico.routes'); // DESATIVADO - modelo removido (migração para turismo)
// const especialidadeRoutes = require('./routes/especialidade.routes'); // DESATIVADO - modelo removido
const bairroRoutes = require('./routes/bairro.routes');
// const ofertaEnsinoRoutes = require('./routes/oferta-ensino.routes'); // DESATIVADO - modelo removido (migração para turismo)
const iconeRoutes = require('./routes/icone.routes');
const auditRoutes = require('./routes/audit.routes');
const etlRoutes = require('./routes/etl.routes');
const uploadRoutes = require('./routes/upload.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const guiaRoutes = require('./routes/guia.routes');

const { errorHandler } = require('./middleware/error.middleware');

// ============================================================================
// EXPRESS APP SETUP
// ============================================================================

const app = express();
const PORT = process.env.API_PORT || 8008;

// Trust proxy - Necessário quando atrás de um proxy reverso (nginx)
// IMPORTANTE: usar o número exato de proxies (1 = apenas o nginx local) em vez de "true".
// Com "true" o Express confia na cadeia inteira de X-Forwarded-For, que o cliente pode
// forjar, permitindo burlar o rate limit. Com 1, o IP considerado é o que o nginx
// realmente enxergou, e não pode ser falsificado pelo cliente.
app.set('trust proxy', 1);

// ============================================================================
// MIDDLEWARE
// ============================================================================

// ----------------------------------------------------------------------------
// Isenção de rate limit para redes confiáveis
// ----------------------------------------------------------------------------
// Motivo: usuários atrás de NAT corporativo (ex.: rede interna da Prefeitura)
// chegam todos com o MESMO IP de origem. Como o rate limit é por IP, a organização
// inteira divide uma única cota e o limite estoura em minutos, derrubando a API
// só para quem está na rede interna — enquanto usuários externos, cada um com seu
// IP, nunca chegam perto do limite.
//
// Faixas privadas já vêm isentas por padrão. Se a rede interna sair por um IP
// PÚBLICO de NAT, adicione-o em RATE_LIMIT_WHITELIST no .env, separado por vírgula.
// Aceita IP isolado ou CIDR. Ex.: RATE_LIMIT_WHITELIST=200.100.50.10,45.4.16.0/22
const FAIXAS_ISENTAS_PADRAO = [
  '127.0.0.0/8',
  '10.0.0.0/8',
  '172.16.0.0/12',
  '192.168.0.0/16',
];

const faixasIsentas = [
  ...FAIXAS_ISENTAS_PADRAO,
  ...(process.env.RATE_LIMIT_WHITELIST || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean),
];

// Converte IPv4 (aceitando o formato IPv6-mapeado ::ffff:a.b.c.d) em inteiro 32 bits
const ipv4ParaInt = (ip) => {
  if (!ip) return null;
  const limpo = String(ip).replace(/^::ffff:/i, '').trim();
  const partes = limpo.split('.');
  if (partes.length !== 4) return null;
  let total = 0;
  for (const parte of partes) {
    const octeto = Number(parte);
    if (!Number.isInteger(octeto) || octeto < 0 || octeto > 255) return null;
    total = total * 256 + octeto;
  }
  return total;
};

const ipDentroDaFaixa = (ip, faixa) => {
  const [base, bitsTexto] = faixa.split('/');
  const ipInt = ipv4ParaInt(ip);
  const baseInt = ipv4ParaInt(base);
  if (ipInt === null || baseInt === null) return false;
  const bits = bitsTexto === undefined ? 32 : Number(bitsTexto);
  if (!Number.isInteger(bits) || bits < 0 || bits > 32) return false;
  if (bits === 0) return true;
  const mascara = (0xffffffff << (32 - bits)) >>> 0;
  return (ipInt & mascara) === (baseInt & mascara);
};

const isRedeIsenta = (req) => {
  const ip = req.ip;
  return faixasIsentas.some((faixa) => ipDentroDaFaixa(ip, faixa));
};

const isRequisicaoAutenticada = (req) =>
  Boolean(req.headers.authorization && req.headers.authorization.startsWith('Bearer '));

// Rate Limiting
// Limiter específico para rotas públicas (mapa público)
//
// Abrir o mapa dispara várias chamadas de uma vez, então o teto precisa ser um
// múltiplo confortável disso. Ajustável por RATE_LIMIT_PUBLIC_MAX no .env.
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: Number(process.env.RATE_LIMIT_PUBLIC_MAX) || 1000,
  message: { success: false, error: 'Muitas requisições. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false }, // Desabilitar validação de trust proxy
  // Não limitar admins autenticados nem redes internas/confiáveis
  skip: (req) => isRequisicaoAutenticada(req) || isRedeIsenta(req),
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas de login
  skipSuccessfulRequests: true,
  message: { success: false, error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false }, // Desabilitar validação de trust proxy
});

// Rate limiter específico para analytics (mais permissivo)
const analyticsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: Number(process.env.RATE_LIMIT_ANALYTICS_MAX) || 300,
  message: { success: false, error: 'Limite de eventos excedido' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false }, // Desabilitar validação de trust proxy
  // Mesma razão do publicLimiter: sob NAT a organização inteira dividiria uma cota
  skip: (req) => isRedeIsenta(req),
});

// Security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "http://localhost:8010", "http://localhost:3002", "http://localhost:8009", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://172.16.1.109:8010"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// CORS - aceitar múltiplas origens
const allowedOrigins = [
  'http://localhost:8009',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'https://mapatur.corumba.ms.gov.br',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sem origin (como curl, postman, etc)
    if (!origin) return callback(null, true);

    // Permitir qualquer origem localhost ou IP local (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
    const isLocalIP = /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)\d{1,3}\.\d{1,3}:\d{4,5}$/.test(origin);
    
    if (allowedOrigins.includes(origin) || isLocalhost || isLocalIP) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos da pasta uploads
app.use('/uploads', express.static(path.join(__dirname, '../../../uploads')));

// Request logging
app.use(requestLogger);

// ============================================================================
// ROUTES
// ============================================================================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
// Aplicar rate limit geral apenas em rotas públicas específicas
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
// app.use('/api/staging', stagingRoutes); // DESATIVADO - modelo removido (migração para turismo)
app.use('/api/unidades', publicLimiter, unidadeRoutes); // Rate limit público para mapa
app.use('/api/categorias', publicLimiter, categoriaRoutes); // Rate limit público para filtros
// app.use('/api/medicos', publicLimiter, medicoRoutes); // DESATIVADO - modelo removido (migração para turismo)
// app.use('/api/especialidades', publicLimiter, especialidadeRoutes); // DESATIVADO - modelo removido
app.use('/api/bairros', bairroRoutes);
// app.use('/api/ofertas-ensino', ofertaEnsinoRoutes); // DESATIVADO - modelo removido (migração para turismo)
app.use('/api/icones', iconeRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/etl', etlRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/analytics', analyticsLimiter, analyticsRoutes);
app.use('/api/guias', publicLimiter, guiaRoutes); // Guias turísticos (público com rate limit)

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use(errorLogger);
app.use(errorHandler);

// ============================================================================
// SERVER START
// ============================================================================

app.listen(PORT, () => {
  logger.info(`SIGLS API Server running on port ${PORT}`, {
    port: PORT,
    env: process.env.NODE_ENV || 'development',
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = app;



