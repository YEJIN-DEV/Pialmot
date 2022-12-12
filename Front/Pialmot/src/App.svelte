<script>
    import Router from "svelte-spa-router";
    import { location } from "svelte-spa-router";
    import routes from "./routes";
    import {
        kind,
        group,
        allkindchoices,
        inited,
        inQuestion,
        inPlay,
        rotation,
    } from "./SharedStore";

    function routeEvent(event) {
        if (event.detail.location === "/") {
            document.getElementById("midi").pause();
            document.getElementById("original").pause();

            //값 원상복구
            $kind = [
                "anime", // 애니 삽입곡
                "original", // 오리지널
                "single", // 싱글
                "game", // 게임 삽입곡
                "unit", // 유닛
                "special", // 특전
                "album", // 정규 앨범
            ];

            $inited = false;

            $inQuestion = false;
            $inPlay = false;
            $rotation = isLandScape();
        }
    }

    let OriginalPlayer = document.getElementById("original");
    let MIDIPlayer = document.getElementById("midi");

    inQuestion.subscribe((value) => {
        audioControl();
    });

    document.addEventListener("visibilitychange", () => {
        audioControl();
    });

    function audioControl() {
        if (
            $inPlay &&
            ($location == "/single/select/" ||
                $location.startsWith("/multi/select/")) &&
            document.visibilityState === "visible"
        ) {
            MIDIPlayer.play();
            if (!$inQuestion) {
                OriginalPlayer.play();
            }
        } else {
            MIDIPlayer.pause();
            OriginalPlayer.pause();
        }
    }

    function setScreenSize() {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty("--vh", `${vh}px`);
        let vw = window.innerWidth * 0.01;
        document.documentElement.style.setProperty("--vw", `${vw}px`);
    }
    setScreenSize();
    window.addEventListener("resize", setScreenSize);

    function isLandScape() {
        return window.matchMedia("screen and (orientation:portrait)").matches;
    }

    window.addEventListener("orientationchange", (event) => {
        setTimeout(() => {
            $rotation = isLandScape();
        }, 100 /*프레임워크 버그때문에 딜레이가 필수*/);
    });
    $rotation = isLandScape();
</script>

<Router {routes} on:routeLoading={routeEvent} />
