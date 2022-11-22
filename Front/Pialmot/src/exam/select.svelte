<script>
    import { slide } from "svelte/transition";
    export let params = {}; // 라우터에서 넘어온 파라미터를 받아오기위해

    let before = 0;
    let snd = new Audio();
    let inquestion = true;
    export let musicdata = {
        answer: "None",
        album: { data: "" },
        questions: [
            { name: "", data: "" },
            { name: "", data: "" },
            { name: "", data: "" },
            { name: "", data: "" },
            { name: "", data: "" },
        ],
    };

    export let rank = {
        rank: -1,
        best: -1,
        average: -1,
        count: -1,
        pertange: -1,
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
    export function getRandMusic(target, delay) {
        MIDIjs.player_callback = (ev) => {
            player_seek = ev.time;
        };
        fetch(`http://112.164.62.41:8000/music/${target}?kind=anime&original`)
            .then((response) => response.json())
            .then((data) => {
                setTimeout(
                    () => {
                        MIDIjs.play(
                            "data:audio/midi;base64," + data.midi_buffer
                        );
                        snd.src = "data:audio/mp3;base64," + data.mp3_buffer;
                        snd.volume = 0.05;
                        snd.load();

                        before = new Date();

                        musicdata = data;
                        inquestion = true;
                    },
                    delay == undefined ? 0 : delay
                );
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
        if (inquestion) {
            let selected = musicdata.questions[index].name;
            let answer = musicdata.name;
            if (selected == answer) {
                let after = new Date();
                let time = after - before;
                //alert("정답입니다! 당신의 시간은 " + time / 1000 + "초 입니다.");

                fetch(
                    `http://112.164.62.41:8000/rank/${musicdata.group}/${answer}`,
                    {
                        method: "POST",
                        body: time.toString(),
                    }
                )
                    .then((response) => response.json())
                    .then((data) => {
                        rank = data;
                        inquestion = false;
                        playOriginal();
                        getRandMusic(groups[musicdata.group], 5000);
                        /*
                    alert(
                        `[${data.rank}위/${data.count}명]\n최고:${
                            data.best
                        }ms\n평균:${data.average}ms\n상위:${
                            data.pertange * 100
                        }%`
                    );
                    */
                    });
            } else {
                fetch(
                    `http://112.164.62.41:8000/rank/${musicdata.group}/${answer}`
                )
                    .then((response) => response.json())
                    .then((data) => {
                        rank = data;
                        inquestion = false;
                        playOriginal();
                        getRandMusic(groups[musicdata.group], 5000);
                    });
            }
        }
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
        while (true) {
            if (typeof MIDIjs != "undefined") {
                getRandMusic(params.group);
                break;
            }
        }
    }, 100);
</script>

<svelte:head>
    <script type="text/javascript" src="//www.midijs.net/lib/midi.js"></script>
    <meta name="viewport" content="width=device-width" />
    <style>
        @import url("https://fonts.googleapis.com/css2?family=Inter&display=swap");
    </style>
</svelte:head>
<svelte:window on:keydown|preventDefault={onKeyDown} />

<body>
    {#if inquestion}
        <div class="images">
            {#each { length: 5 } as _, i}
                <div class="container">
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <img
                        class="question"
                        on:click={() => Answer(i)}
                        on:mouseenter={() => (
                            (bright[i] = 1),
                            (blur[i] = 0),
                            (player_onCursor = 1),
                            (widthValue = [19, 19, 19, 19, 19].map((e, index) =>
                                index == i ? 24 : e
                            ))
                        )}
                        on:mouseleave={() => (
                            (bright[i] = 0.6),
                            (blur[i] = 1),
                            (player_onCursor = 0),
                            (widthValue = [20, 20, 20, 20, 20])
                        )}
                        style="filter: brightness({player_onCursor == 0
                            ? 1
                            : bright[i]}) blur({player_onCursor == 0
                            ? 0
                            : blur[i]}px); width: {widthValue[i]}vw;"
                        src={"data:image/jpeg;base64," +
                            musicdata.questions[i].data}
                        alt={musicdata.questions[i].name}
                    />
                    <h2 style="text-align: center">
                        {musicdata.questions[i].name}
                    </h2>
                </div>
            {/each}
        </div>
    {:else}
        <div class="result" transition:slide={{ duration: 600 }}>
            <h1 style="font-size:64px;">
                {rank.rank == -1 ? "오답입니다" : `#${rank.rank}`}
            </h1>
            <h3 style="font-size:24px;font-weight:400;margin-bottom:2rem">
                {rank.rank == -1 ? "정답은..." : `/${rank.count}`}
            </h3>
            <img
                width="500rem"
                height="500rem"
                style="filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25));"
                src={"data:image/jpeg;base64," + musicdata.album.data}
                alt=""
            />
            <h1 style="font-weight:400;">{musicdata.name}</h1>
            <h4 style="font-weight:400;">{musicdata.album.name}</h4>
        </div>
    {/if}
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

    .result {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
    }

    .question {
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

    * {
        padding: 0;
        margin: 0;
        font-family: "Inter", sans-serif;
    }
    @media (min-width: 640px) {
        body {
            max-width: none;
        }
    }
</style>
