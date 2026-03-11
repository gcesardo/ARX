const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

io.on('connection', (socket) => {
    socket.on('entrar-na-sala', (salaId) => {
        socket.join(salaId);
    });
    
    socket.on('enviar-mensagem', (dados) => {
        socket.to(dados.salaId).emit('receber-mensagem', dados);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('ARX Server rodando!');
});
