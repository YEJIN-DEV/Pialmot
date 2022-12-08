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

enum groups {
    us,
    aqours,
    nijigasaki,
    liella
}

const app = express.default();

const server = http.createServer(app);
const io = new socketio.Server(server);

const httpsAgent = new https.Agent({
    rejectUnauthorized: false, //인증서 비활성화
});

io.on('connection', (socket) => {
    socket.on('join', (username, hash) => {
        socket.data.username = username;
        socket.join(hash);
        io.in(hash).fetchSockets().then((sockets) => {
            socket.data.host = sockets.length == 1 ? true : false;
            socket.emit('join', socket.data.host);
        });
    });

    socket.on('users', () => {
        let room = Array.from(socket.rooms)[1]
        io.in(room).fetchSockets().then((sockets) => {
            io.to(room).emit('users',
                sockets.map((socket) => socket.data.username)
            );
        });
    });

    socket.on('question', (group) => {
        let room = Array.from(socket.rooms)[1]
        nextQuestion(group, room);
    })

    socket.on('answer', (Isanswer, group, name) => {
        let room = Array.from(socket.rooms)[1]
        fetch(`https://pialmot.lol/rank/${group}/${name}`, { agent: httpsAgent })
            .then((response) => response.json())
            .then((data) => {
                if (Isanswer) {
                    io.to(room).emit('answer', socket.data.username, data);
                    socket.data.status = 'success';
                } else {
                    socket.emit('answer', "다틀렸을때 처리해줘야됨", data);
                    socket.data.status = 'fail';
                }

                io.in(room).fetchSockets().then((sockets) => {
                    if (sockets.every((socket) => socket.data.status !== 'wait') || Isanswer) {
                        setTimeout(() => {
                            nextQuestion(groups[group], room);
                        }, 5000);
                    }
                })
            });
    })

    socket.on('end', (room) => {
        io.to(room).emit('end');
        io.in(room).socketsLeave(room);
    })

    function nextQuestion(group: any, room: any) {
        fetch(`https://pialmot.lol/music/${group}?kind=anime&original=`, { agent: httpsAgent })
            .then((response) => response.json())
            .then((data) => {
                io.in(room).fetchSockets().then((sockets) => {
                    sockets.forEach((socket) => {
                        socket.data.status = 'wait';
                    });
                });
                io.to(room).emit('question', data);
            });
    }

});


server.listen(4004, () => {
    console.log('Running at localhost:4004');
});

