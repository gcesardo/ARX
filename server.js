const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const salas = {}; 

io.on('connection', (socket) => {
    
    socket.on('entrar-na-sala', (salaId) => {
        socket.join(salaId);
        
        // Se a sala não existe, criamos o tempo de criação dela
        if (!salas[salaId]) {
            salas[salaId] = {
                mensagens: [],
                criadaEm: Date.now()
            };
        }

        // Envia as mensagens existentes e o tempo restante para o usuário
        const tempoPassado = Date.now() - salas[salaId].criadaEm;
        const tempoRestante = Math.max(0, 599000 - tempoPassado);

        socket.emit('info-sala', { tempoRestante });

        salas[salaId].mensagens.forEach(msg => {
            socket.emit('receber-mensagem', msg);
        });
    });
    
    socket.on('enviar-mensagem', (dados) => {
        const { salaId } = dados;
        if (salas[salaId]) {
            salas[salaId].mensagens.push(dados);
            socket.to(salaId).emit('receber-mensagem', dados);
        }
    });
});

// Limpeza automática da memória a cada 1 minuto para salas expiradas
setInterval(() => {
    const agora = Date.now();
    for (const id in salas) {
        if (agora - salas[id].criadaEm > 599000) {
            delete salas[id];
            console.log(`Sala ${id} auto-destruída.`);
        }
    }
}, 10000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('ARX Server: Sala dura 9:59');
});
