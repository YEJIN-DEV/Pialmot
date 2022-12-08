<script>
    import Result from "../UI/resultUI.svelte";
    import Select from "../UI/selectUI.svelte";
    import Linachanboard from "../UI/linachanboard.svelte";
    import { slide } from "svelte/transition";
    import { _ } from "svelte-i18n";
    import io from "socket.io-client";
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

    let before = 0;
    let username = "";
    let end = false;
    let started = false;
    let inQuestion = false;
    let firstFetch = true;
    let IamHost = false;
    let joined = false;
    let OriginalPlayer = document.getElementById("original");
    let MIDIPlayer = document.getElementById("midi");

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

    const socket = io("ws://112.164.62.89:4004");

    socket.on("connect", () => {
        console.log("서버와 WS 연결 성공");
    });

    socket.on("disconnect", () => {
        if (!end) {
            console.error("서버와 WS 연결 끊김");
        }
    });

    socket.on("users", (data) => {
        console.log(data);
    });

    socket.on("join", (iamHost) => {
        IamHost = iamHost;
        joined = true;
    });

    socket.on("question", (data) => {
        started = true;
        firstFetch = false;
        console.log(data);

        MIDIPlayer.src = data.midi;
        MIDIPlayer.load();
        if (!firstFetch) MIDIPlayer.play();

        OriginalPlayer.src = data.mp3;
        OriginalPlayer.volume = 0.05;
        OriginalPlayer.load();

        before = new Date();

        musicData = data;
        inQuestion = true;
    });

    socket.on("answer", (username, data) => {
        console.log(data);
        data.rank = `${username}이.. 승리했습니다!`;
        rank = data;
        let sec = $_("sec");
        graphData.labels = Array.from(
            Array(5),
            (_, x) =>
                `~ ${(((x + 1) * data.interval.IQR) / 1000).toFixed(2)}${sec}`
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
        options.plugins.annotation.annotations.line1.xMin = meanX;
        options.plugins.annotation.annotations.line1.xMax = meanX;

        options.plugins.annotation.annotations.line2.xMin = -1;
        options.plugins.annotation.annotations.line2.xMax = -1;

        options.plugins.annotation.annotations.line1.label.content = `${$_(
            "mean"
        )}\n${(rank.average / 1000).toFixed(3)}`;

        inQuestion = false;
    });

    socket.on("result", (data) => {
        console.log(data);
    });

    socket.on("end", (data) => {
        console.log("해산");
        end = true;
    });

    function Answer(index) {
        firstFetch = false;
        if (inQuestion) {
            let selected = musicData.questions[index].name;
            let answer = musicData.name;
            if (selected == answer) {
                OriginalPlayer.currentTime = MIDIPlayer.currentTime;

                socket.emit(
                    "answer",
                    true,
                    musicData.group,
                    answer,
                    params.hash
                );
            } else {
                socket.emit(
                    "answer",
                    false,
                    musicData.group,
                    answer,
                    params.hash
                );
            }
        }
    }
</script>

<body>
    {#if !started}
        <Linachanboard>
            <form>
                <input
                    placeholder="닉네임을 입력해주세요!"
                    bind:value={username}
                    disabled={joined}
                />
                {#if !joined}
                    <button
                        on:click={() => {
                            socket.emit("join", username, params.hash);
                        }}>참여</button
                    >
                {:else if IamHost}
                    <button
                        on:click={() => {
                            socket.emit("users");
                            socket.emit("question", "nijigasaki");
                        }}>시작하기!</button
                    >
                {:else}
                    <h1>대기하십쇼.</h1>
                {/if}
            </form>
        </Linachanboard>
    {:else if firstFetch}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <Linachanboard>
            <btn
                on:click={() => {
                    MIDIPlayer.play();
                }}
            >
                <img
                    style="width: 80%; height: 80%;"
                    src="logo/Lovelive.png"
                    alt=""
                />
            </btn>
        </Linachanboard>
    {:else if inQuestion}
        <Select
            onAnswer={(i) => {
                Answer(i);
                OriginalPlayer.play();
            }}
            questions={musicData.questions}
        />
    {:else if !inQuestion}
        <div transition:slide={{ delay: 150, duration: 600 }}>
            <Result
                {rank}
                title={musicData.name}
                album={musicData.album}
                {graphData}
                {options}
            />
        </div>
    {/if}
</body>

<style>
</style>
