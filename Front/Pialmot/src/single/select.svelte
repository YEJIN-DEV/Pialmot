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
    import "chart.js/auto";
    import { Stretch } from "svelte-loading-spinners";
    import { addMessages, init, getLocaleFromNavigator, _ } from "svelte-i18n";
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
                    line2: {
                        type: "line",
                        label: {
                            content: $_("you"),
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
    let OriginalPlayer = document.getElementById("original");
    let MIDIPlayer = document.getElementById("midi");
    let loading = true;
    let fetchEnd = false;
    let firstFetch = true;
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

    function getRandMusic(delay) {
        fetch(
            `/music/${$group}?kind=${$kind.join("&kind=")}&original${
                $allkindchoices ? "&allkindchoices" : ""
            }`
        )
            .then((response) => response.json())
            .then((data) => {
                setTimeout(() => {
                    ga.games.levelStart("single");
                    loading = true;

                    MIDIPlayer.src = data.midi;
                    MIDIPlayer.load();
                    if (!firstFetch) MIDIPlayer.play();

                    OriginalPlayer.src = data.mp3;
                    OriginalPlayer.volume = 0.05;
                    OriginalPlayer.load();

                    before = new Date();

                    musicData = data;
                    $inQuestion = true;
                    loading = false;
                    fetchEnd = true;
                }, delay ?? 0);
            });
    }

    function Answer(index) {
        firstFetch = false;
        if ($inQuestion) {
            let selected = musicData.questions[index].name;
            let answer = musicData.name;
            if (selected == answer) {
                let after = new Date();
                let time = after - before;
                OriginalPlayer.currentTime = MIDIPlayer.currentTime;

                fetch(`/rank/${musicData.group}/${answer}`, {
                    method: "POST",
                    body: time.toString(),
                })
                    .then((response) => response.json())
                    .then((data) => {
                        rank = data;
                        let sec = `${$_("sec")}`;
                        graphData.labels = Array.from(
                            Array(5),
                            (_, x) =>
                                `~ ${(data.interval.quantile[x] / 1000).toFixed(
                                    2
                                )}${sec}`
                        );

                        let meanX = -1;
                        let youX = -1;
                        for (let i = 0; i < 4; i++) {
                            if (
                                data.interval.quantile[i] <= rank.average &&
                                rank.average <= data.interval.quantile[i + 1]
                            ) {
                                meanX = i;
                            }

                            if (
                                data.interval.quantile[i] <= time &&
                                time <= data.interval.quantile[i + 1]
                            ) {
                                youX = i;
                            }
                        }

                        meanX +=
                            (rank.average - data.interval.quantile[meanX]) /
                            (data.interval.quantile[meanX + 1] -
                                data.interval.quantile[meanX]);
                        youX +=
                            (time - data.interval.quantile[youX]) /
                            (data.interval.quantile[youX + 1] -
                                data.interval.quantile[youX]);
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
                        $inQuestion = false;
                        getRandMusic(5000);
                    });
            } else {
                fetch(`/rank/${musicData.group}/${answer}`)
                    .then((response) => response.json())
                    .then((data) => {
                        rank = data;
                        let sec = $_("sec");
                        graphData.labels = Array.from(
                            Array(5),
                            (_, x) =>
                                `~ ${(data.interval.quantile[x] / 1000).toFixed(
                                    2
                                )}${sec}`
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
                            (data.interval.quantile[meanX + 1] -
                                data.interval.quantile[meanX]);

                        options.plugins.annotation.annotations.line1.xMin =
                            meanX;
                        options.plugins.annotation.annotations.line1.xMax =
                            meanX;

                        options.plugins.annotation.annotations.line2.xMin = -1;
                        options.plugins.annotation.annotations.line2.xMax = -1;

                        options.plugins.annotation.annotations.line1.label.content = `${$_(
                            "mean"
                        )}\n${(rank.average / 1000).toFixed(3)}`;
                        graphData.datasets[0].data = data.interval.count;

                        $inQuestion = false;
                        getRandMusic(5000);
                    });
            }

            ga.games.levelEnd("single", selected == answer);
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

    if (!$inited) {
        alert($_("data_lost"));
        replace("/");
    } else {
        getRandMusic();
    }
</script>

<svelte:head>
    <style>
        @import url("https://fonts.googleapis.com/css2?family=Inter&display=swap");
    </style>
</svelte:head>
<svelte:window on:keydown|preventDefault={onKeyDown} />

<body>
    {#if loading && firstFetch}
        <Linachanboard>
            <form>
                <Stretch size="100" color="#FF3E00" unit="px" duration="1s" />
            </form>
        </Linachanboard>
    {:else if fetchEnd && firstFetch}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <Linachanboard>
            <btn
                on:click={() => {
                    loading = false;
                    fetchEnd = false;
                    $inPlay = true;
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
    {:else if $inQuestion}
        <Select
            onAnswer={(i) => {
                Answer(i);
                OriginalPlayer.play();
            }}
            questions={musicData.questions}
        />
    {:else}
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
    /* calc 함수들과 --vw랑 --vh는 viewport에 딱맞게 처리를 하기위해 있음.*/
    body {
        text-align: center;
        margin: 0 auto;
        background-color: #f0eeec;
        height: calc(var(--vh, 1vh) * 100);
        width: calc(var(--vw, 1vw) * 100);
    }

    * {
        padding: 0;
        margin: 0;
        font-family: "Inter", sans-serif;
    }
</style>
