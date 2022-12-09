<script>
    import Router from "svelte-spa-router";
    import routes from "./routes";
    import { kind, group, allkindchoices, inited } from "./KindStore";

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
        }
    }
</script>

<Router {routes} on:routeLoading={routeEvent} />
