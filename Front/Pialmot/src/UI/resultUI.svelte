<script>
    import { Bar } from "svelte-chartjs";
    import { _ } from "svelte-i18n";
    export let rank;
    export let title;
    export let album = {
        name: "",
        path: "",
    };
    export let graphData;
    export let options;
</script>

<body>
    <!--slide 애니메이션을 여기에 넣지말것. 다음어 보여질 화면을 여기서 렌더링 할수가없음-->
    <div class="result">
        <div>
            <h1 style="background-color:#0078D7; color:white; font-size:64px;">
                {rank.rank == -1 ? $_("wrong") : `#${rank.rank}`}
            </h1>
            <h3
                style="padding-top:5px; font-size:24px;font-weight:400;margin-bottom:2rem"
            >
                {rank.rank == -1 ? $_("correctis") : `/${rank.count}`}
            </h3>
            <h1 id="title">
                {title}
            </h1>
            <h4 id="ablumName">
                {album.name}
            </h4>
            <div class="chart">
                <Bar data={graphData} {options} />
            </div>
        </div>
        <img class="album" src={album.path} alt="" />
    </div>
</body>

<style>
    .result {
        width: 100%;
        height: calc(var(--vh, 1vh) * 100);
        display: flex;
        flex-flow: row wrap; /* 세로화면에서도 row로 해야하는데, 표시할 컨텐츠[글씨/표]가 세로로 길기때문 */
        align-items: center;
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

        .result {
            justify-content: center;
        }
    }

    @media (orientation: landscape) {
        /*가로*/
        .result {
            justify-content: space-evenly;
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
