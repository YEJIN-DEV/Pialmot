<script>
    import { push } from "svelte-spa-router";
    import { _ } from "svelte-i18n";
    import { addMessages, init, getLocaleFromNavigator } from "svelte-i18n";
    import { isLoading as i18nloading } from "svelte-i18n";

    import en from "../i18n/en.json";
    import ko from "../i18n/ko.json";
    import ja from "../i18n/ja.json";

    addMessages("en", en);
    addMessages("ko", ko);
    addMessages("ja", ja);

    if (i18nloading) {
        init({
            fallbackLocale: "en",
            initialLocale: getLocaleFromNavigator(),
        });
    }
    function setScreenSize() {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty("--vh", `${vh}px`);
        let vw = window.innerWidth * 0.01;
        document.documentElement.style.setProperty("--vw", `${vw}px`);
    }
    setScreenSize();
    window.addEventListener("resize", setScreenSize);

    let mute = true;
</script>

<svelte:head>
    <style>
        @import url("https://fonts.googleapis.com/css2?family=Inter&display=swap");
    </style>
</svelte:head>

<body>
    <div class="video-container">
        <!-- svelte-ignore a11y-media-has-caption -->
        <video bind:muted={mute} autoplay loop playsinline>
            <source src="main.mp4" />
        </video>
    </div>
    <div class="text">
        <h1 style="color:white; font-size:64px;">{$_("title")}</h1>
        <h3 style="color:white">{$_("edtion")}</h3>
        <button
            class="btnGroups"
            on:click={() => {
                push("/select/aqours");
            }}
        >
            <img src="logo/Aqours.png" alt="" />
        </button>
        <button
            class="btnGroups"
            on:click={() => {
                push("/select/nijigasaki");
            }}
        >
            <img src="logo/Nijigasaki_{$_('filesuffix')}.png" alt="" />
        </button>
        <button
            class="btnGroups"
            on:click={() => {
                push("/select/liella");
            }}
        >
            <img src="logo/Liella.png" alt="" />
        </button>
        <!--
        <button
            class="btnGroups"
            on:click={() => {
                push("/select/musical");
            }}
        >
            <img src="logo/Musical.png" alt="" />
        </button>
        -->
    </div>
    <button
        on:click={() => {
            mute = !mute;
        }}
    >
        <img
            src={mute ? "icon/volume_off.svg" : "icon/volume_up.svg"}
            alt=""
            style="height:2.5rem;width:2.5rem"
        />
    </button>
</body>

<style>
    .video-container {
        position: absolute;
        top: 0;
        bottom: 0;
        width: calc(var(--vw, 1vw) * 100);
        height: calc(var(--vh, 1vh) * 100);
        overflow: hidden;
        z-index: -1;
    }

    .video-container video {
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

    .text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
    }

    button {
        background-color: rgba(255, 255, 255, 0);
        border: none;
    }

    img {
        width: 200px;
        margin: 1rem;
    }

    .btnGroups {
        transition: all 0.1s linear;
    }

    .btnGroups:hover {
        transform: scale(1.2);
    }

    * {
        padding: 0;
        margin: 0;
        font-family: "Inter", sans-serif;
    }
</style>
