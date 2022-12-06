import * as express from 'express';
import http from 'http'
import * as socketio from 'socket.io';
import fs from 'fs'

const credentials = {
    key: fs.readFileSync('cert/private.key.pem'),
    cert: fs.readFileSync('cert/domain.cert.pem'),
};

const app = express.default();

app.get('/join/:hash', (_req, res) => {
    res.send({ uptime: process.uptime() });
});


const server = http.createServer(app);
const io = new socketio.Server(server);

let rooms: { [key: string]: string } = {};
io.on('connection', (socket) => {
    socket.on("join", (hash) => {
        socket.join(hash);
    });

    socket.on('chat', (data) => {
        socket.to(data.room).emit('chat', data.message);
    })
});


server.listen(4004, () => {
    console.log('Running at localhost:4004');
});

