import * as express from 'express';
import http from 'http'
import https from 'https'
import fetch from 'node-fetch'; //인증서인증좀 비활성화좀 해야되서..
import * as socketio from 'socket.io';
import fs from 'fs'

const credentials = {
    key: fs.readFileSync('cert/private.key.pem'),
    cert: fs.readFileSync('cert/domain.cert.pem'),
};

const app = express.default();

const server = http.createServer(app);
const io = new socketio.Server(server);


io.on('connection', (socket) => {
    socket.on('join', (username, hash) => {
        socket.data.username = username;
        socket.join(hash);
        socket.emit('OK');
    });

    socket.on('users', (room) => {
        io.in(room).fetchSockets().then((sockets) => {
            io.to(room).emit('users',
                JSON.stringify(
                    sockets.map((socket) => socket.data.username)
                )
            );
        });
    });

    socket.on('question', (room) => {
        const httpsAgent = new https.Agent({
            rejectUnauthorized: false, //인증서 비활성화
        });

        fetch('https://127.0.0.1:8000/music/liella?kind=anime&kind=original&kind=single&kind=special&kind=album&original=&allkindchoices=', { agent: httpsAgent })
            .then((response) => response.text())
            .then((data) => {
                io.to(room).emit('question', data);
            });
    })

    socket.on('answer', (room, answer) => {
        io.to(room).emit('answer', socket.data.username, answer);
    })

    socket.on('end', (room) => {
        io.to(room).emit('end');
        io.in(room).socketsLeave(room);
    })
});


server.listen(4004, () => {
    console.log('Running at localhost:4004');
});

