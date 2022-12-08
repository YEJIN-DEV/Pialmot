<script>
    function setScreenSize() {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty("--vh", `${vh}px`);
        let vw = window.innerWidth * 0.01;
        document.documentElement.style.setProperty("--vw", `${vw}px`);
    }
    setScreenSize();
    window.addEventListener("resize", setScreenSize);
</script>

<body>
    <div class="linachanboard">
        <img src="board.jpg" alt="" />
        <slot />
    </div>
</body>

<style>
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

    div :global(form),
    :global(btn) {
        position: absolute;
        left: 50%;
        top: 55%;
        transform: translate(-50%, -50%);
    }
</style>
