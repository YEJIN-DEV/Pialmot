import * as express from 'express';
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

const server = https.createServer(credentials, app);
const io = new socketio.Server(server);

let roomInfo = new Map();
const httpsAgent = new https.Agent({
    rejectUnauthorized: false, //인증서 비활성화
});

io.of("/").adapter.on("delete-room", (room) => {
    roomInfo.delete(room);
});

io.on('connection', (socket) => {
    socket.on('join', (username, hash) => {
        io.in(hash).fetchSockets().then((sockets) => {
            if (sockets.every((socket) => socket.data.username !== username)) {
                socket.data.username = username;
                socket.join(hash);

                socket.data.host = sockets.length == 0 ? true : false;
                socket.emit('join', socket.data.host);
                sendUserList(hash, sockets);
            } else {
                socket.emit('join', undefined);
            }
        });
    });

    socket.on('users', (room) => {
        io.in(room).fetchSockets().then((sockets) => {
            socket.emit('users',
                sockets.map((socket) => socket.data.username)
            );
        });
    });

    socket.on('users', () => {
        let room = Array.from(socket.rooms)[1]
        io.in(room).fetchSockets().then((sockets) => {
            sendUserList(room, sockets);
        });
    });

    socket.on('init', (kind, group, allkindchoices) => {
        let room = Array.from(socket.rooms)[1];
        roomInfo.set(room, { kind, group, allkindchoices });
    });

    socket.on('question', () => {
        let room = Array.from(socket.rooms)[1]
        nextQuestion(room);
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
                    socket.emit('answer', undefined, data);
                    socket.data.status = 'fail';
                }

                io.in(room).fetchSockets().then((sockets) => {
                    if (sockets.every((socket) => socket.data.status !== 'wait') || Isanswer) {
                        setTimeout(() => {
                            nextQuestion(room);
                        }, 5000);
                    }
                })
            });
    })

    socket.on('end', (room) => {
        io.to(room).emit('end');
        io.in(room).socketsLeave(room);
    })
});

function nextQuestion(room: any) {
    if (roomInfo.get(room) == undefined) return;
    let { kind, group, allkindchoices } = roomInfo.get(room);

    fetch(`https://pialmot.lol/music/${group}?kind=${kind.join("&kind=")}&original${allkindchoices ? "&allkindchoices" : ""}`, { agent: httpsAgent })
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


function sendUserList(room: string, sockets: any[]) {
    io.to(room).emit('users',
        sockets.map((socket) => socket.data.username)
    );
}


server.listen(4004, () => {
    console.log('Running at localhost:4004');
});