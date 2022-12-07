<script>
    import io from "socket.io-client";
    export let params = {}; // 라우터에서 넘어온 파라미터를 받아오기위해

    let username;
    let end;
    const socket = io("http://localhost:4004");

    socket.on("connect", () => {
        console.log("서버와 WS 연결 성공");
    });

    socket.on("disconnect", () => {
        if (!end) {
            console.error("서버와 WS 연결 끊김");
        }
    });

    socket.on("users", (data) => {
        console.log(JSON.parse(data));
    });

    socket.on("question", (data) => {
        console.log(JSON.parse(data));
    });

    socket.on("answer", (data) => {
        console.log(data);
    });

    socket.on("result", (data) => {
        console.log(data);
    });

    socket.on("end", (data) => {
        console.log("해산");
        end = true;
    });
</script>

<body>
    <input bind:value={username} />
    <button
        on:click={() => {
            socket.emit("join", username, params.hash);
        }}>join</button
    >
    <button
        on:click={() => {
            socket.emit("users", params.hash);
            socket.emit("question", params.hash);
        }}>start</button
    >
</body>

<style>
</style>
