<script>
    import { slide } from "svelte/transition";
    import { Bar } from "svelte-chartjs";
    import "chart.js/auto";
    export let params = {}; // 라우터에서 넘어온 파라미터를 받아오기위해
    let isMobile = checkMobile();
    export let graphData = {
        datasets: [
            {
                label: "명",
                data: [0, 0, 0, 0, 0],
                borderColor: "#70675E",
                borderWidth: 2,
            },
        ],
    };

    let before = 0;
    let snd = new Audio();
    let inQuestion = true;
    let rotation = isLandScape();
    export let musicData = {
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
    let bright = [0.6, 0.6, 0.6, 0.6, 0.6];
    let blur = [1, 1, 1, 1, 1];
    let player_onCursor = 0;
    let transValue = [20, 20, 20, 20, 20];

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
        fetch(`/music/${target}?kind=anime&original`)
            .then((response) => response.json())
            .then((data) => {
                setTimeout(() => {
                    MIDIjs.play("data:audio/midi;base64," + data.midi_buffer);
                    snd.src = "data:audio/mp3;base64," + data.mp3_buffer;
                    snd.volume = 0.05;
                    snd.load();

                    before = new Date();

                    musicData = data;
                    inQuestion = true;

                    bright = [0.6, 0.6, 0.6, 0.6, 0.6];
                    blur = [1, 1, 1, 1, 1];
                    player_onCursor = 0;
                    transValue = [20, 20, 20, 20, 20];
                }, delay ?? 0);
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
        if (inQuestion) {
            let selected = musicData.questions[index].name;
            let answer = musicData.name;
            if (selected == answer) {
                let after = new Date();
                let time = after - before;
                //alert("정답입니다! 당신의 시간은 " + time / 1000 + "초 입니다.");

                fetch(`/rank/${musicData.group}/${answer}`, {
                    method: "POST",
                    body: time.toString(),
                })
                    .then((response) => response.json())
                    .then((data) => {
                        rank = data;
                        graphData.labels = Array.from(
                            Array(5),
                            (_, x) =>
                                `${(x * data.interval.IQR) / 1000}초 ~ ${
                                    ((x + 1) * data.interval.IQR) / 1000
                                }초`
                        );
                        graphData.datasets[0].data = data.interval.count;
                        inQuestion = false;
                        playOriginal();
                        getRandMusic(groups[musicData.group], 5000);
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
                graphData.labels = undefined;
                graphData.datasets[0].data = [0, 0, 0, 0, 0];
                fetch(`/rank/${musicData.group}/${answer}`)
                    .then((response) => response.json())
                    .then((data) => {
                        rank = data;
                        inQuestion = false;
                        playOriginal();
                        getRandMusic(groups[musicData.group], 5000);
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

    function checkMobile() {
        let check = false;
        (function (a) {
            if (
                /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
                    a
                ) ||
                /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
                    a.substr(0, 4)
                )
            )
                check = true;
        })(navigator.userAgent || navigator.vendor || window.opera);
        return check;
    }

    function isLandScape() {
        return window.matchMedia("screen and (orientation:portrait)").matches;
    }

    window.addEventListener("orientationchange", (event) => {
        setTimeout(() => {
            rotation = isLandScape();
        }, 100 /**프레임워크 버그때문에 딜레이가 필수*/);
    });

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
            MIDIjs.pause();
        } else {
            MIDIjs.resume();
        }
    });

    setTimeout(() => {
        if (typeof MIDIjs != "undefined") {
            getRandMusic(params.group);
        }
    }, 500);
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
    {#if inQuestion}
        <div class="images">
            {#each { length: 5 } as _, i}
                <div class="container">
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <img
                        class="question"
                        on:click={() => Answer(i)}
                        on:mouseenter={() => {
                            if (!isMobile) {
                                bright[i] = 1;
                                blur[i] = 0;
                                player_onCursor = 1;
                                transValue = [19, 19, 19, 19, 19].map(
                                    (e, index) => (index == i ? 24 : e)
                                );
                            }
                        }}
                        on:mouseleave={() => {
                            if (!isMobile) {
                                bright[i] = 0.6;
                                blur[i] = 1;
                                player_onCursor = 0;
                                transValue = [20, 20, 20, 20, 20];
                            }
                        }}
                        style="filter: brightness({player_onCursor == 0
                            ? 1
                            : bright[i]}) blur({player_onCursor == 0
                            ? 0
                            : blur[i]}px); {rotation
                            ? `height:${transValue[i]}vh; width: 100vw;`
                            : `width:${transValue[i]}vw; height: 100vh;`}"
                        src={"data:image/jpeg;base64," +
                            musicData.questions[i].data}
                        alt={musicData.questions[i].name}
                    />
                    <h2 style="text-align: center">
                        {musicData.questions[i].name}
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
                class="album"
                style="filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25));"
                src={"data:image/jpeg;base64," + musicData.album.data}
                alt=""
            />
            <h1 style="font-weight:400;">{musicData.name}</h1>
            <h4 style="font-weight:400;">{musicData.album.name}</h4>
        </div>
        {#if !isMobile}
            <div class="chart" style="width:500px; height: 700px;">
                <Bar data={graphData} options={{ responsive: true }} />
            </div>
        {/if}
    {/if}
</body>

<style>
    body {
        text-align: center;
        margin: 0 auto;
        background-color: #f0eeec;
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

    .chart {
        position: absolute;
        left: 80%;
        top: 50%;
        transform: translate(-50%, -20%);
    }

    .question {
        box-shadow: inset 0px 4px 4px rgba(0, 0, 0, 0.25);
        object-fit: cover;
        transition: all 0.1s linear;
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
    @media (orientation: portrait) {
        /*모바일*/
        .album {
            width: 300px;
            height: 300px;
        }

        .images {
            display: flex;
            flex-direction: column;
        }
    }

    @media (orientation: landscape) {
        .album {
            width: 500px;
            height: 500px;
        }

        .images {
            display: flex;
            height: 100vh;
        }
    }
</style>
