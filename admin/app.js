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

// Lista de origens permitidas (leia da variável CONEXAO ou use fallback)
const conexaoEnv = process.env.CONEXAO ? process.env.CONEXAO.split(',').map(s => s.trim()) : [];
const allowedOrigins = [
  ...conexaoEnv,
  'https://ango-vota-adm-fron.vercel.app',
  'http://localhost:4200'
].filter(Boolean);

console.log('CORS allowed origins:', allowedOrigins); // log para debug

app.use(cors({
  origin: function(origin, callback) {
    // Permite requisições sem origin (ex: Postman)
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

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuração de sessão
app.use(session({
  secret: process.env.KeySession,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60
  }
}));

// Servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// CSP (opcional, para o erro do Google Translate)
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://translate.google.com https://www.gstatic.com; " +
    "style-src 'self' 'unsafe-inline' https://www.gstatic.com; " +
    "font-src 'self' data:; " +
    "img-src 'self' data: https:;"
  );
  next();
});

// Rotas
app.use(routes);

// Socket.IO
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