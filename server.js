const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// Objeto para armazenar as salas e suas mensagens na memória RAM
const salas = {}; 

io.on('connection', (socket) => {
    
    socket.on('entrar-na-sala', (salaId) => {
        socket.join(salaId);
        console.log(`Usuário entrou na sala: ${salaId}`);

        // Se a sala já existir e tiver mensagens, envia para o usuário que acabou de chegar
        if (salas[salaId]) {
            salas[salaId].forEach(msg => {
                socket.emit('receber-mensagem', msg);
            });
        }
    });
    
    socket.on('enviar-mensagem', (dados) => {
        const { salaId } = dados;

        // Se a sala não existe no objeto, cria ela
        if (!salas[salaId]) {
            salas[salaId] = [];
        }

        // Adiciona a mensagem ao histórico da sala no servidor
        salas[salaId].push(dados);

        // Envia para os outros na sala em tempo real
        socket.to(salaId).emit('receber-mensagem', dados);

        // --- SEGURANÇA ARX: DESTRUIÇÃO EM 10 MINUTOS ---
        // Remove esta mensagem específica do servidor após 10 minutos (600.000 ms)
        setTimeout(() => {
            if (salas[salaId]) {
                salas[salaId] = salas[salaId].filter(m => m !== dados);
                
                // Se a sala ficar vazia após remover a mensagem, deleta a sala da memória
                if (salas[salaId].length === 0) {
                    delete salas[salaId];
                    console.log(`Sala ${salaId} limpa por inatividade.`);
                }
            }
        }, 600000); 
    });

    socket.on('disconnect', () => {
        console.log('Usuário desconectado temporariamente.');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('ARX Server rodando com persistência de 10 minutos!');
});
