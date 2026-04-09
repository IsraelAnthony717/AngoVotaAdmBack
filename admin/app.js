//Importações necessárias
const express = require('express');

require('dotenv').config();

const cors = require('cors');

const session = require('express-session');

const http = require('http');

const routes = require('./routes');

const { Server } = require('socket.io');

const app = express();




app.set('trust proxy', 1);

//Middleware necessários
app.use(cors({
    origin: process.env.CONEXAO,
    
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
   // allowedHeaders: ['content-type', 'Authorization'],
    credentials: true
}));// conexão com o frontend
app.use(express.json()); //trata toda estrutura em json
app.use(express.urlencoded({ extended: true }));
// Configurações da sessão
app.use(session({
secret: process.env.KeySession, //Chave secreta
resave: false, // em false, não salva a sessão se não mudou
saveUninitialized: false, // em false, não cria sessão vazia
cookie:{
    secure: true, //true quando tiver em produção
    httpOnly: true, //Impede ataques de injeção de javascript
    sameSite: 'lax', // Strict -> Só permite o envio de cookies que veem do mesmo domínio
    maxAge: 1000 * 60 * 60 // Equivale a 1 hora  
}
}));




const path = require('path');

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(routes);





const server = http.createServer(app);

const io = new Server(server, {
    cors:{

      origin: process.env.CONEXAO,

        methods:['GET', 'POST'],

        credentials: true
},
 transports:['websocket', 'polling']


});

app.set('io', io);







module.exports = { server, io };



