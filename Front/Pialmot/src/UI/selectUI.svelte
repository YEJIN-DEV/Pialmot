<script>
    import { rotation } from "../SharedStore";

    let bright = [0.6, 0.6, 0.6, 0.6, 0.6];
    let blur = [1, 1, 1, 1, 1];
    let player_onCursor = 0;
    let transValue = [20, 20, 20, 20, 20];

    export let onAnswer = (i) => {};
    export let questions = [];
</script>

<body>
    <div class="images">
        {#each { length: 5 } as _, i}
            <div
                class="container"
                style="min-{$rotation
                    ? `height: calc(var(--vh, 1vh)*${transValue[i]}`
                    : `width: calc(var(--vw, 1vw)*${transValue[i]}`}"
            >
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <button
                    style="border: none; height: 100%;"
                    on:click={() => onAnswer(i)}
                >
                    <img
                        class="question"
                        on:mouseenter={() => {
                            bright[i] = 1;
                            blur[i] = 0;
                            player_onCursor = 1;
                            transValue = [19, 19, 19, 19, 19].map((e, index) =>
                                index == i ? 24 : e
                            );
                        }}
                        on:mouseleave={() => {
                            bright[i] = 0.6;
                            blur[i] = 1;
                            player_onCursor = 0;
                            transValue = [20, 20, 20, 20, 20];
                        }}
                        style="filter: brightness({player_onCursor == 0
                            ? 1
                            : bright[i]}) blur({player_onCursor == 0
                            ? 0
                            : blur[i]}px);"
                        src={questions[i].path}
                        alt={questions[i].name}
                    />
                    <h2 style="text-align: center">
                        {questions[i].name}
                    </h2>
                </button>
            </div>
        {/each}
    </div>
</body>

<style>
    .images {
        height: calc(var(--vh, 1vh) * 100);
    }

    .container {
        position: relative;
        overflow: hidden;
    }

    .question {
        box-shadow: inset 0px 4px 4px rgba(0, 0, 0, 0.25);
        transition: all 0.1s linear;
    }

    h2 {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        color: rgb(34, 34, 34);
    }

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

    @media (orientation: portrait) {
        /*세로*/
        .images {
            display: flex;
            flex-direction: column;
        }

        .question {
            width: calc(var(--vw, 1vw) * 100);
        }
    }

    @media (orientation: landscape) {
        /*가로*/
        .images {
            display: flex;
        }

        .question {
            height: 100%;
            position: absolute;
            left: 50%;
            transform: translate(-50%, -50%);
        }
    }
</style>
