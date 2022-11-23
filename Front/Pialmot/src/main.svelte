<script>
    import { push } from "svelte-spa-router";
</script>

<svelte:head>
    <script type="text/javascript" src="//www.midijs.net/lib/midi.js"></script>
    <meta name="viewport" content="width=device-width" />
    <style>
        @import url("https://fonts.googleapis.com/css2?family=Inter&display=swap");
    </style>
</svelte:head>

<body>
    <div class="video-container">
        <!-- svelte-ignore a11y-media-has-caption -->
        <video muted autoplay loop>
            <source src="main.webm" />
        </video>
    </div>
    <div class="text">
        <h1 style="color:white; font-size:64px;">피알못</h1>
        <h3 style="color:white">러브라이브판!</h3>
        <button
            class="btnAqours"
            on:click={() => {
                push("/select/aqours");
            }}
        >
            <img src="logo/Aqours.png" alt="" />
        </button>
        <button
            class="btnNijigaku"
            on:click={() => {
                push("/select/nijigasaki");
            }}
        >
            <img src="logo/Nijigasaki.png" alt="" />
        </button>
        <button
            class="btnLiella"
            on:click={() => {
                push("/select/liella");
            }}
        >
            <img src="logo/Liella.png" alt="" />
        </button>
    </div>
</body>

<style>
    .video-container {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
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

    .btnAqours {
        transition: all 0.1s linear;
    }
    
    .btnAqours:hover {
        transform: scale(1.2);
    }

    .btnNijigaku {
        transition: all 0.1s linear;
    }

    .btnNijigaku:hover {
        transform: scale(1.2);
    }

    .btnLiella {
        transition: all 0.1s linear;
    }

    .btnLiella:hover {
        transform: scale(1.2);
    }

    * {
        padding: 0;
        margin: 0;
        font-family: "Inter", sans-serif;
    }
</style>
