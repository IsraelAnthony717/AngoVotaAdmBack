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

// Lista de origens permitidas (HARDCODED para teste)
const allowedOrigins = [
  'https://ango-vota-adm-fron.vercel.app',
  'http://localhost:4200'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`CORS bloqueado: ${origin}`);
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

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(routes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true },
  transports: ['websocket', 'polling']
});

app.set('io', io);
module.exports = { server, io };