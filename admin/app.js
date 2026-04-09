// Importações necessárias
const express = require('express');
require('dotenv').config();
const cors = require('cors');
const session = require('express-session');
const http = require('http');
const routes = require('./routes');
const { Server } = require('socket.io');
const path = require('path');

const app = express();

app.set('trust proxy', 1);

// ============================================================
// CONFIGURAÇÃO DE ORIGENS PERMITIDAS
// ============================================================
// Pode ser uma única URL ou várias separadas por vírgula
const conexaoEnv = process.env.CONEXAO ? process.env.CONEXAO.split(',').map(s => s.trim()) : [];
const allowedOrigins = [
  ...conexaoEnv,
  'https://ango-vota-adm-fron.vercel.app/',
  'http://localhost:4200'
].filter(Boolean);

// Configuração CORS robusta
app.use(cors({
  origin: function(origin, callback) {
    // Permite requisições sem origin (ex: Postman, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS bloqueou origem: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Middlewares padrão
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuração da sessão (essencial para cross-origin)
app.use(session({
  secret: process.env.KeySession,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // true em produção (HTTPS)
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 // 1 hora
  }
}));

// Servir arquivos estáticos da pasta uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rotas
app.use(routes);

// Socket.IO com a mesma lista de origens
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

app.set('io', io);

module.exports = { server, io };