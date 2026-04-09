const { server } = require('./app');

server.listen(process.env.PORT || 3003, "0.0.0.0", ()=>{
    console.log(`Servidor rodando na porta ${process.env.PORT}`);
});