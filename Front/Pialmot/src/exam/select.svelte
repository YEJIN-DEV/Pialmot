<script>
    let before = 0;
    let snd = new Audio();
    export let musicdata = {
        answer: "None",
        questions: [
            { name: "", data: "" },
            { name: "", data: "" },
            { name: "", data: "" },
            { name: "", data: "" },
            { name: "", data: "" },
        ],
    };
    let player_seek = 0;
    export let bright = [0.6, 0.6, 0.6, 0.6, 0.6];
    export let blur = [1, 1, 1, 1, 1];
    let player_onCursor = 0;
    export let widthValue = [20, 20, 20, 20, 20];

    const groups = {
        0: "us",
        1: "aqours",
        2: "nijigasaki",
        3: "liella",
    };
    export function getRandMusic(target) {
        MIDIjs.player_callback = (ev) => {
            player_seek = ev.time;
        };
        fetch(`http://112.164.62.41:8000/music/${target}?kind=anime&original`)
            .then((response) => response.json())
            .then((data) => {
                MIDIjs.play("data:audio/midi;base64," + data.midi_buffer);
                snd.src = "data:audio/mp3;base64," + data.mp3_buffer;
                snd.volume = 0.05;
                snd.load();

                before = new Date();

                musicdata = data;
            });
    }

    export function playOriginal() {
        if (snd.paused) {
            snd.currentTime = player_seek;
            snd.play();
        } else {
            snd.pause();
        }
    }

    export function Answer(index) {
        let selected = musicdata.questions[index].name;
        let answer = musicdata.name.substring(4);
        if (selected == answer) {
            let after = new Date();
            let time = after - before;
            playOriginal();
            alert("정답입니다! 당신의 시간은 " + time / 1000 + "초 입니다.");

            fetch(
                `http://112.164.62.41:8000/rank/${musicdata.group}/${answer}`,
                {
                    method: "POST",
                    body: time.toString(),
                }
            )
                .then((response) => response.json())
                .then((data) => {
                    alert(
                        `[${data.rank}위/${data.count}명]\n최고:${
                            data.best
                        }ms\n평균:${data.average}ms\n상위:${
                            data.pertange * 100
                        }%`
                    );
                });
        } else {
            alert("오답입니다!");
        }

        getRandMusic(groups[musicdata.group]);
    }

    function onKeyDown(e) {
        switch (e.key) {
            case "1":
                Answer(0);
                break;
            case "2":
                Answer(1);
                break;
            case "3":
                Answer(2);
                break;
            case "4":
                Answer(3);
                break;
            case "5":
                Answer(4);
                break;
        }
    }
    setTimeout(() => {
        getRandMusic("liella");
    }, 1000);
</script>

<svelte:head>
    <script type="text/javascript" src="//www.midijs.net/lib/midi.js"></script>
    <meta name="viewport" content="width=device-width" />
</svelte:head>
<svelte:window on:keydown|preventDefault={onKeyDown} />

<body>
    <div class="images">
        <div class="container">
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <img
                on:click={() => Answer(0)}
                on:mouseenter={() => (bright[0] = 1, blur[0] = 0, player_onCursor = 1, widthValue = [24, 19, 19, 19, 19])}
                on:mouseleave={() => (bright[0] = 0.6, blur[0] = 1, player_onCursor = 0, widthValue = [20, 20, 20, 20, 20])}
                style="filter: brightness({player_onCursor == 0 ? 1 : bright[0]}) blur({player_onCursor == 0 ? 0 : blur[0]}px); width: {widthValue[0]}vw;"
                src={"data:image/jpeg;base64," + musicdata.questions[0].data}
                alt={musicdata.questions[0].name}
            />
            <h2 style="text-align: center">{musicdata.questions[0].name}</h2>
        </div>
        <div class="container">
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <img
                on:click={() => Answer(1)}
                on:mouseenter={() => (bright[1] = 1, blur[1] = 0, player_onCursor = 1, widthValue = [19, 24, 19, 19, 19])}
                on:mouseleave={() => (bright[1] = 0.6, blur[1] = 1, player_onCursor = 0, widthValue = [20, 20, 20, 20, 20])}
                style="filter: brightness({player_onCursor == 0 ? 1 : bright[1]}) blur({player_onCursor == 0 ? 0 : blur[1]}px); width: {widthValue[1]}vw;"
                src={"data:image/jpeg;base64," + musicdata.questions[1].data}
                alt={musicdata.questions[1].name}
            />
            <h2>{musicdata.questions[1].name}</h2>
        </div>
        <div class="container">
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <img
                on:click={() => Answer(2)}
                on:mouseenter={() => (bright[2] = 1, blur[2] = 0, player_onCursor = 1, widthValue = [19, 19, 24, 19, 19])}
                on:mouseleave={() => (bright[2] = 0.6, blur[2] = 1, player_onCursor = 0, widthValue = [20, 20, 20, 20, 20])}
                style="filter: brightness({player_onCursor == 0 ? 1 : bright[2]}) blur({player_onCursor == 0 ? 0 : blur[2]}px); width: {widthValue[2]}vw;"
                src={"data:image/jpeg;base64," + musicdata.questions[2].data}
                alt={musicdata.questions[2].name}
            />
            <h2>{musicdata.questions[2].name}</h2>
        </div>
        <div class="container">
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <img
                on:click={() => Answer(3)}
                on:mouseenter={() => (bright[3] = 1, blur[3] = 0, player_onCursor = 1, widthValue = [19, 19, 19, 24, 19])}
                on:mouseleave={() => (bright[3] = 0.6, blur[3] = 1, player_onCursor = 0, widthValue = [20, 20, 20, 20, 20])}
                style="filter: brightness({player_onCursor == 0 ? 1 : bright[3]}) blur({player_onCursor == 0 ? 0 : blur[3]}px); width: {widthValue[3]}vw;"
                src={"data:image/jpeg;base64," + musicdata.questions[3].data}
                alt={musicdata.questions[3].name}
            />
            <h2>{musicdata.questions[3].name}</h2>
        </div>
        <div class="container">
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <img
                on:click={() => Answer(4)}
                on:mouseenter={() => (bright[4] = 1, blur[4] = 0, player_onCursor = 1, widthValue = [19, 19, 19, 19, 24])}
                on:mouseleave={() => (bright[4] = 0.6, blur[4] = 1, player_onCursor = 0, widthValue = [20, 20, 20, 20, 20])}
                style="filter: brightness({player_onCursor == 0 ? 1 : bright[4]}) blur({player_onCursor == 0 ? 0 : blur[4]}px); width: {widthValue[4]}vw;"
                src={"data:image/jpeg;base64," + musicdata.questions[4].data}
                alt={musicdata.questions[4].name}
            />
            <h2>{musicdata.questions[4].name}</h2>
        </div>
    </div>
</body>

<style>
    body {
        text-align: center;
        margin: 0 auto;
        background-color: #f0eeec;
    }

    .images {
        display: flex;
        height: 100vh;
    }

    .container {
        position: relative;
    }

    img {
        box-shadow: inset 0px 4px 4px rgba(0, 0, 0, 0.25);
        width: 20vw;
        height: 100vh;
        object-fit: cover;
    }

    h2 {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        color: rgb(34, 34, 34);
    }
    @media (min-width: 640px) {
        body {
            max-width: none;
        }
    }
</style>
