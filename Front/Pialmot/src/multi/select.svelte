<script>
    import Result from "../UI/resultUI.svelte";
    import Select from "../UI/selectUI.svelte";
    import Linachanboard from "../UI/linachanboard.svelte";
    import {
        kind,
        group,
        allkindchoices,
        inited,
        inQuestion,
        inPlay,
    } from "../SharedStore";
    import { slide } from "svelte/transition";
    import { _ } from "svelte-i18n";
    import io from "socket.io-client";
    import { addMessages, init, getLocaleFromNavigator } from "svelte-i18n";
    import { isLoading as i18nloading } from "svelte-i18n";
    import { ga } from "@beyonk/svelte-google-analytics";
    import { replace } from "svelte-spa-router";

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
    let firstFetch = true;
    let IamHost = false;
    let joined = false;
    let error = false;
    let OriginalPlayer = document.getElementById("original");
    let MIDIPlayer = document.getElementById("midi");

    let graphData = {
        datasets: [
            {
                label: $_("persons"),
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
                            content: $_("mean"),
                            display: true,
                            position: "start",
                        },
                        xMax: -1,
                        xMin: -1,
                        borderColor: "#FF6767",
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

    const socket = io("https://pialmot.lol");

    socket.on("connect", () => {
        console.log($_("connect"));
    });

    socket.on("connect_error", (err) => {
        console.log(`connect_error due to ${err.message}`);
        error = true;
    });

    socket.on("disconnect", () => {
        if (!end) {
            console.error($_("disconnect"));
            error = true;
        }
    });

    let users = [];
    socket.on("users", (data) => {
        console.log(data);
        users = data;
    });

    socket.on("join", (iamHost) => {
        if (iamHost == undefined) {
            alert($_("dup_nick"));
        } else {
            IamHost = iamHost;
            if (IamHost && !$inited) {
                alert($_("data_lost"));
                socket.disconnect();
                replace("/");
            }
            joined = true;
        }
    });

    socket.on("question", (data) => {
        ga.games.levelStart("multi");
        started = true;

        MIDIPlayer.src = data.midi;
        MIDIPlayer.load();
        if (!firstFetch) MIDIPlayer.play();

        OriginalPlayer.src = data.mp3;
        OriginalPlayer.volume = 0.05;
        OriginalPlayer.load();

        before = new Date();

        musicData = data;
        $inQuestion = true;
    });

    socket.on("answer", (username, data) => {
        data.rank =
            username == undefined
                ? -1
                : `${username}${
                      jongsung(username) ? $_("jongsung_i") : $_("jongsung_ga")
                  }${$_("correct_answer")}`;
        rank = data;

        let sec = $_("sec");
        graphData.labels = Array.from(
            Array(5),
            (_, x) => `~ ${(data.interval.quantile[x] / 1000).toFixed(2)}${sec}`
        );

        let meanX = -1;
        for (let i = 0; i < 4; i++) {
            if (
                data.interval.quantile[i] <= rank.average &&
                rank.average <= data.interval.quantile[i + 1]
            ) {
                meanX = i;
            }
        }
        meanX +=
            (rank.average - data.interval.quantile[meanX]) /
            (data.interval.quantile[meanX + 1] - data.interval.quantile[meanX]);

        options.plugins.annotation.annotations.line1.xMin = meanX;
        options.plugins.annotation.annotations.line1.xMax = meanX;
        options.plugins.annotation.annotations.line1.label.content = `${$_(
            "mean"
        )}\n${(rank.average / 1000).toFixed(3)}`;
        graphData.datasets[0].data = data.interval.count;
        $inQuestion = false;
        OriginalPlayer.play();
    });

    socket.on("result", (data) => {
        console.log(data);
    });

    socket.on("end", (data) => {
        console.log("해산");
        end = true;
    });

    function Answer(index) {
        if ($inQuestion) {
            let selected = musicData.questions[index].name;
            let answer = musicData.name;
            OriginalPlayer.currentTime = MIDIPlayer.currentTime;
            if (selected == answer) {
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
            ga.games.levelEnd("multi", selected == answer);
        }
    }

    function jongsung(word) {
        const lastLetter = word[word.length - 1];
        const unicode = lastLetter.charCodeAt(0);
        if (unicode < 44032 || unicode > 55203) return null;
        return (unicode - 44032) % 28 != 0;
    }

    socket.emit("users", params.hash);
</script>

<svelte:head>
    <style>
        @import url("https://fonts.googleapis.com/css2?family=Inter&display=swap");
    </style>
</svelte:head>

<body>
    {#if error}
        <h1>{$_("connection_lost")}</h1>
    {:else if !started}
        <Linachanboard>
            <form onsubmit="return false;">
                <input
                    placeholder={$_("nick_placeholder")}
                    bind:value={username}
                    disabled={joined}
                />
                {#if !joined}
                    <button
                        on:click={() => {
                            if (username.length > 0 && username.length <= 10) {
                                socket.emit("join", username, params.hash);
                            } else {
                                alert($_("nick_length"));
                            }
                        }}>{$_("join")}</button
                    >
                {:else if IamHost}
                    <button
                        on:click={() => {
                            socket.emit("init", $kind, $group, $allkindchoices);
                            socket.emit("question");
                        }}>{$_("start_host")}</button
                    >
                    <br />
                    <button
                        on:click={() => {
                            navigator.clipboard.writeText(window.location.href);
                            alert($_("copied"));
                        }}
                    >
                        <a href={window.location.href}
                            >{window.location.href}<br />
                            {$_("share_joinurl")}</a
                        >
                    </button>
                {:else}
                    <h1>{$_("waiting")}</h1>
                {/if}
                <table>
                    <tr>
                        <th>{$_("player")}</th>
                    </tr>
                    {#each users as user}
                        <tr>
                            <td>{user}</td>
                        </tr>
                    {/each}
                </table>
            </form>
        </Linachanboard>

        <p style="visibility: hidden;">
            원래는 필요가 없는데, 모바일 파이어폭스 v106에서 input가 강제로
            확대되는 버그가 있더라. 이걸보는 당신 안녕안녕맨이야.
        </p>
        <!--(https://stackoverflow.com/questions/69495070/prevent-zooming-in-after-input-field-focus-in-firefox-on-mobile)-->
    {:else if firstFetch}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <Linachanboard>
            <btn
                on:click={() => {
                    firstFetch = false;
                    MIDIPlayer.play();
                    $inPlay = true;
                }}
            >
                <img
                    style="width: 80%; height: 80%;"
                    src="logo/Lovelive.png"
                    alt=""
                />
            </btn>
        </Linachanboard>
    {:else if $inQuestion}
        <Select
            onAnswer={(i) => {
                Answer(i);
                OriginalPlayer.play();
            }}
            questions={musicData.questions}
        />
    {:else if !$inQuestion}
        <div transition:slide={{ delay: 150, duration: 600 }}>
            <Result
                {rank}
                title={musicData.name}
                album={musicData.album}
                {graphData}
                {options}
                multi
            />
        </div>
    {/if}
</body>

<style>
    body {
        height: calc(var(--vh, 1vh) * 100);
        width: calc(var(--vw, 1vw) * 100);
        text-align: center;
        margin: 0 auto;
        background-color: #f0eeec;
        overflow: hidden;
    }
    input:focus {
        font-size: 16px !important;
    }

    * {
        font-family: "Inter", sans-serif;
    }
</style>
