//Importações necessárias
const express = require('express');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const cors = require('cors');
const session = require('express-session');
const http = require('http');
const routes = require('./routes');
const { Server } = require('socket.io');

const app = express();
const { sequelize } = require('./models');

sequelize.sync({ alter: true }).then(() => {
  console.log('✅ Banco sincronizado');
});
app.set('trust proxy', 1);

// ========== CONFIGURAÇÃO DE ORIGENS PERMITIDAS ==========
// Exemplo: CONEXAO=http://localhost:4200,https://ango-vota-adm-fron.vercel.app
const allowedOrigins = process.env.CONEXAO
  ? process.env.CONEXAO.split(',').map(origin => origin.trim())
  : ['http://localhost:4200', 'https://ango-vota-adm-fron.vercel.app'];

const corsOptions = {
  origin: function (origin, callback) {
    console.log('Origem recebida:', origin);
    console.log('Allowed origins:', allowedOrigins);
    if (!origin) return callback(null, true);
    // Permitir origens com ou sem barra no final
    const normalizedOrigin = origin.replace(/\/$/, '');
    const allowed = allowedOrigins.some(allowed => allowed.replace(/\/$/, '') === normalizedOrigin);
    if (allowed) {
      callback(null, true);
    } else {
      callback(new Error('Origem não permitida pelo CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessão
app.use(session({
  secret: process.env.KeySession,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60
  }
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(routes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Origem não permitida pelo CORS no Socket.IO'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

app.set('io', io);
module.exports = { server, io };