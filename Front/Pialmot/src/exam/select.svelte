<script>
    import { slide } from "svelte/transition";
    import { Bar } from "svelte-chartjs";
    import { Chart as ChartJS } from "chart.js";
    import annotationPlugin from "chartjs-plugin-annotation";
    import "chart.js/auto";
    import { _ } from "svelte-i18n";
    import { Stretch } from "svelte-loading-spinners";
    import { addMessages, init, getLocaleFromNavigator } from "svelte-i18n";
    import { isLoading as i18nloading } from "svelte-i18n";

    import en from "../../i18n/en.json";
    import ko from "../../i18n/ko.json";
    import ja from "../../i18n/ja.json";

    addMessages("en", en);
    addMessages("ko", ko);
    addMessages("ja", ja);

    if (i18nloading) {
        init({
            fallbackLocale: "en",
            initialLocale: getLocaleFromNavigator(),
        });
    }
    export let params = {}; // 라우터에서 넘어온 파라미터를 받아오기위해

    ChartJS.register(annotationPlugin);

    let isMobile = checkMobile();
    let graphData = {
        datasets: [
            {
                label: "명",
                data: [0, 0, 0, 0, 0],
                borderColor: "#70675E",
                borderWidth: 2,
            },
        ],
    };

    let options = {
        maintainAspectRatio: false,
        plugins: {
            annotation: {
                annotations: {
                    line1: {
                        type: "line",
                        label: {
                            content: "평균",
                            display: true,
                            position: "start",
                        },
                        xMax: -1,
                        xMin: -1,
                        borderColor: "#FF6767",
                        borderWidth: 2,
                    },
                    line2: {
                        type: "line",
                        label: {
                            content: "아나타",
                            display: true,
                            position: "end",
                        },
                        xMax: -1,
                        xMin: -1,
                        borderColor: "#000000",
                        borderWidth: 2,
                    },
                },
            },
            legend: {
                display: false,
            },
        },
    };

    let before = 0;
    let snd = new Audio();
    let inQuestion = false;
    let loading = true;
    let fetchEnd = false;
    let firstFetch = true;
    let rotation = isLandScape();
    let musicData = {
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

    let rank = {
        rank: -1,
        best: -1,
        average: -1,
        count: -1,
        pertange: -1,
    };
    let kind = [
        "anime", // 애니 삽입곡
        "original", // 오리지널
        "single", // 싱글
        "game", // 게임 삽입곡
        "unit", // 유닛
        "special", // 특전
        "album", // 정규 앨범
    ];
    let isKindSelect = true;

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

    function getRandMusic(target, delay) {
        if (MIDIjsloaded) {
            fetch(`/music/${target}?kind=${kind.join("&kind=")}&original`)
                .then((response) => response.json())
                .then((data) => {
                    setTimeout(() => {
                        loading = true;
                        MIDI.loadPlugin({
                            soundfontUrl:
                                "https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/",
                            instrument: "acoustic_grand_piano",
                            onsuccess: function () {
                                MIDI.Player.loadFile(
                                    musicData.midi,
                                    function () {
                                        console.log("midi file loaded");
                                        loading = false;
                                        fetchEnd = true;
                                        if (!firstFetch) MIDI.Player.start();
                                    },
                                    undefined,
                                    function (e) {
                                        console.log(e);
                                    }
                                );
                            },
                        });
                        snd.src = data.mp3;
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
        } else {
            setTimeout(() => {
                getRandMusic(target, delay);
            }, 50);
        }
    }

    function Answer(index) {
        firstFetch = false;
        if (inQuestion) {
            if (MIDI.Player.currentTime > 0) {
                let selected = musicData.questions[index].name;
                let answer = musicData.name;
                if (selected == answer) {
                    let after = new Date();
                    let time = after - before;
                    snd.currentTime = MIDI.Player.currentTime / 1000;
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
                                    `~ ${(
                                        ((x + 1) * data.interval.IQR) /
                                        1000
                                    ).toFixed(2)}초`
                            );

                            let meanX = -1;
                            let youX = -1;
                            for (let i = 0; i < 5; i++) {
                                if (
                                    i * data.interval.IQR <= rank.average &&
                                    rank.average <= (i + 1) * data.interval.IQR
                                ) {
                                    meanX = i;
                                }

                                if (
                                    i * data.interval.IQR <= time &&
                                    time <= (i + 1) * data.interval.IQR
                                ) {
                                    youX = i;
                                }
                            }
                            options.plugins.annotation.annotations.line1.xMin =
                                meanX;
                            options.plugins.annotation.annotations.line1.xMax =
                                meanX;
                            options.plugins.annotation.annotations.line2.xMin =
                                youX;
                            options.plugins.annotation.annotations.line2.xMax =
                                youX;

                            options.plugins.annotation.annotations.line1.label.content = `${$_(
                                "mean"
                            )}\n${(rank.average / 1000).toFixed(3)}`;
                            options.plugins.annotation.annotations.line2.label.content = `${$_(
                                "you"
                            )}\n${(time / 1000).toFixed(3)}`;
                            graphData.datasets[0].data = data.interval.count;
                            inQuestion = false;
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
                    fetch(`/rank/${musicData.group}/${answer}`)
                        .then((response) => response.json())
                        .then((data) => {
                            rank = data;

                            graphData.labels = Array.from(
                                Array(5),
                                (_, x) =>
                                    `~ ${(
                                        ((x + 1) * data.interval.IQR) /
                                        1000
                                    ).toFixed(2)}초`
                            );

                            let meanX = -1;
                            for (let i = 0; i < 5; i++) {
                                if (
                                    i * data.interval.IQR <= rank.average &&
                                    rank.average <= (i + 1) * data.interval.IQR
                                ) {
                                    meanX = i;
                                }
                            }
                            options.plugins.annotation.annotations.line1.xMin =
                                meanX;
                            options.plugins.annotation.annotations.line1.xMax =
                                meanX;

                            options.plugins.annotation.annotations.line2.xMin =
                                -1;
                            options.plugins.annotation.annotations.line2.xMax =
                                -1;

                            options.plugins.annotation.annotations.line1.label.content = `${$_(
                                "mean"
                            )}\n${(rank.average / 1000).toFixed(3)}`;

                            inQuestion = false;
                            getRandMusic(groups[musicData.group], 5000);
                        });
                }
            } else {
                alert("음원이 재생되지 않았습니다.");
                getRandMusic(groups[musicData.group]);
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
        }, 100 /*프레임워크 버그때문에 딜레이가 필수*/);
    });

    function setScreenSize() {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty("--vh", `${vh}px`);
        let vw = window.innerWidth * 0.01;
        document.documentElement.style.setProperty("--vw", `${vw}px`);
    }
    setScreenSize();
    window.addEventListener("resize", setScreenSize);

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
            MIDI.Player.pause();
        } else {
            MIDI.Player.resume();
        }
    });

    let MIDIjsloaded = false;
    function MIDIjsChecker() {
        if (typeof MIDI === "undefined") {
            setTimeout(MIDIjsChecker, 50);
            return;
        }
        console.log("MIDI loaded");
        MIDIjsloaded = true;
    }
    MIDIjsChecker();

    function kindSel() {
        isKindSelect = false;
        kind = kind.filter((item) => {
            switch (params.group) {
                case "us":
                    break;
                case "aqours":
                    if (item == "original" || item == "single") return false;
                case "nijigasaki":
                    if (item == "single") return false;
                case "liella":
                    if (item == "unit" || item == "game") return false;
            }
            return true;
        });
        getRandMusic(params.group);
    }
</script>

<svelte:head>
    <script src="/inc/shim/Base64.js" type="text/javascript"></script>
    <script src="/inc/shim/Base64binary.js" type="text/javascript"></script>
    <script src="/inc/shim/WebAudioAPI.js" type="text/javascript"></script>
    <script src="/inc/jasmid/stream.js"></script>
    <script src="/inc/jasmid/midifile.js"></script>
    <script src="/inc/jasmid/replayer.js"></script>
    <script type="text/javascript" src="/MIDI.js"></script>
    <meta name="viewport" content="width=device-width" />
    <style>
        @import url("https://fonts.googleapis.com/css2?family=Inter&display=swap");
    </style>
</svelte:head>
<svelte:window on:keydown|preventDefault={onKeyDown} />

<body>
    {#if isKindSelect}
        <!-- svelte-ignore a11y-media-has-caption -->
        <div class="linachanboard">
            <img src="board.jpg" alt="" />
            {#if params.group == "aqours"}
                <form on:submit|preventDefault={kindSel}>
                    <h4>한판,,하쉴?</h4>
                    <input
                        type="checkbox"
                        bind:group={kind}
                        value="anime"
                    />애니<br />
                    <input
                        type="checkbox"
                        bind:group={kind}
                        value="original"
                    />오리지널<br />
                    <input
                        type="checkbox"
                        bind:group={kind}
                        value="single"
                    />싱글<br />
                    <input
                        type="checkbox"
                        bind:group={kind}
                        value="special"
                    />스페셜<br />
                    <input
                        type="checkbox"
                        bind:group={kind}
                        value="album"
                    />정규 앨범<br />
                    <input type="checkbox" bind:group={kind} value="game" />게임
                    삽입곡
                    <br />
                    <button class="startbtn">게임 스타토</button>
                </form>
            {:else if params.group == "nijigasaki"}
                <form on:submit|preventDefault={kindSel}>
                    <h4>한판,,하쉴?</h4>
                    <input
                        type="checkbox"
                        bind:group={kind}
                        value="anime"
                    />애니<br />
                    <input
                        type="checkbox"
                        bind:group={kind}
                        value="original"
                    />오리지널<br />
                    <input
                        type="checkbox"
                        bind:group={kind}
                        value="unit"
                    />유닛<br />
                    <input
                        type="checkbox"
                        bind:group={kind}
                        value="special"
                    />스페셜<br />
                    <input
                        type="checkbox"
                        bind:group={kind}
                        value="album"
                    />정규 앨범<br />
                    <input type="checkbox" bind:group={kind} value="game" />게임
                    삽입곡
                    <br />
                    <button class="startbtn">게임 스타토</button>
                </form>
            {:else if params.group == "liella"}
                <form on:submit|preventDefault={kindSel}>
                    <h4>한판,,하쉴?</h4>
                    <input
                        type="checkbox"
                        bind:group={kind}
                        value="anime"
                    />애니<br />
                    <input
                        type="checkbox"
                        bind:group={kind}
                        value="original"
                        checked
                    />오리지널<br />
                    <input
                        type="checkbox"
                        bind:group={kind}
                        value="single"
                    />싱글<br />
                    <input
                        type="checkbox"
                        bind:group={kind}
                        value="special"
                    />스페셜<br />
                    <input
                        type="checkbox"
                        bind:group={kind}
                        value="album"
                    />정규 앨범<br />
                    <button class="startbtn">게임 스타토</button>
                </form>
            {/if}
        </div>
    {:else if loading && firstFetch}
        <div class="linachanboard">
            <img src="board.jpg" alt="" />
            <div
                style="position: absolute;
            left: 50%;
            top: 55%;
            transform: translate(-50%, -50%);"
            >
                <Stretch size="100" color="#FF3E00" unit="px" duration="1s" />
            </div>
        </div>
    {:else if fetchEnd && firstFetch}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div class="linachanboard">
            <img src="board.jpg" alt="" />
            <btn
                on:click={() => {
                    loading = false;
                    fetchEnd = false;
                    MIDI.Player.start();
                }}
            >
                <img
                    style="width: 80%; height: 80%;"
                    src="logo/Lovelive.png"
                    alt=""
                />
            </btn>
        </div>
    {:else if inQuestion}
        <div class="images">
            {#each { length: 5 } as _, i}
                <div class="container">
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <button
                        style="border: none; height: 100%;"
                        on:click={() => {
                            Answer(i);
                            snd.play();
                        }}
                    >
                        <img
                            class="question"
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
                                : blur[i]}px);"
                            src={musicData.questions[i].path}
                            alt={musicData.questions[i].name}
                        />
                        <h2 style="text-align: center">
                            {musicData.questions[i].name}
                        </h2>
                    </button>
                </div>
            {/each}
        </div>
    {:else}
        <div class="result" transition:slide={{ delay: 150, duration: 600 }}>
            <div>
                <h1
                    style="background-color:#0078D7; color:white; font-size:64px;"
                >
                    {rank.rank == -1 ? $_("wrong") : `#${rank.rank}`}
                </h1>
                <h3
                    style="padding-top:5px; font-size:24px;font-weight:400;margin-bottom:2rem"
                >
                    {rank.rank == -1 ? $_("correctis") : `/${rank.count}`}
                </h3>
                <h1 id="title">
                    {musicData.name}
                </h1>
                <h4 id="ablumName">
                    {musicData.album.name}
                </h4>
                <div class="chart">
                    <Bar data={graphData} {options} />
                </div>
            </div>
            <img class="album" src={musicData.album.path} alt="" />
        </div>
    {/if}
</body>

<style>
    /* vw vh 다음줄에 있는 calc 함수들은 딱맡개 처리를 하기위해*/
    .linachanboard {
        position: absolute;
        top: 0;
        bottom: 0;
        width: calc(var(--vw, 1vw) * 100);
        height: calc(var(--vh, 1vh) * 100);
        overflow: hidden;
    }

    .linachanboard > img {
        /* Make video to at least 100% wide and tall */
        min-width: 100%;
        min-height: 100%;

        /* Setting width & height to auto prevents the browser from stretching or squishing the video */
        width: auto;
        height: auto;

        /* Center the video */
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    .linachanboard > form,
    btn {
        position: absolute;
        left: 50%;
        top: 55%;
        transform: translate(-50%, -50%);
    }

    .linachanboard form button {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;

        background: var(--button-bg-color);
        color: var(--button-color);

        margin-top: 30px;
        padding: 0.5rem 1rem;

        font-family: "Noto Sans KR", sans-serif;
        font-size: 1rem;
        font-weight: 400;
        text-align: center;
        text-decoration: none;

        border: none;
        border-radius: 4px;

        display: inline-block;
        width: auto;

        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06);

        cursor: pointer;

        transition: 0.5s;
    }

    body {
        text-align: center;
        margin: 0 auto;
        background-color: #f0eeec;
        height: calc(var(--vh, 1vh) * 100);
        width: calc(var(--vw, 1vw) * 100);
    }

    .images {
        height: calc(var(--vh, 1vh) * 100);
    }

    .container {
        position: relative;
        overflow: hidden;
        min-width: calc(var(--vw, 1vw) * 20);
    }

    .question {
        box-shadow: inset 0px 4px 4px rgba(0, 0, 0, 0.25);
        transition: all 0.1s linear;
    }

    .result {
        width: 100%;

        height: calc(var(--vh, 1vh) * 100);
        display: flex;
        flex-flow: row wrap;
        flex-shrink: 1;
        align-items: center;
        justify-content: center;
    }

    #ablumName,
    #title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-weight: 400;
    }

    .album {
        filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25));
        max-width: calc(var(--vw, 1vw) * 90);
        max-height: calc(var(--vh, 1vh) * 90);
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
        /*세로*/

        .images {
            display: flex;
            flex-direction: column;
        }

        .question {
            width: calc(var(--vw, 1vw) * 100);
        }

        .chart {
            width: 100%;
            min-height: 15%;
        }

        #ablumName,
        #title {
            min-width: 0;
            max-width: calc(var(--vw, 1vw) * 90);
        }

        .album {
            padding-top: 3%;
        }
    }

    @media (orientation: landscape) {
        /*가로*/
        .result {
            flex-flow: column wrap;
        }

        .images {
            display: flex;
        }

        .question {
            height: 100%;
            transform: translateX(-300px);
        }

        .chart {
            width: 100%;
            min-height: 15%;
        }

        #ablumName,
        #title {
            min-width: 0;
            max-width: calc(var(--vw, 1vw) * 50);
        }

        .album {
            padding-left: 3%;
        }
    }
</style>
