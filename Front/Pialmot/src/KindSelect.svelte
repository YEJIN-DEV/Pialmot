<script>
    import Linachanboard from "./UI/linachanboard.svelte";
    import { kind, group, allkindchoices, inited } from "./SharedStore";
    import { addMessages, init, getLocaleFromNavigator, _ } from "svelte-i18n";
    import { isLoading as i18nloading } from "svelte-i18n";
    import { ga } from "@beyonk/svelte-google-analytics";
    export let params = {}; // 라우터에서 넘어온 파라미터를 받아오기위해

    import en from "../i18n/en.json";
    import ko from "../i18n/ko.json";
    import ja from "../i18n/ja.json";
    import { replace } from "svelte-spa-router";

    addMessages("en", en);
    addMessages("ko", ko);
    addMessages("ja", ja);

    if (i18nloading) {
        init({
            fallbackLocale: "en",
            initialLocale: getLocaleFromNavigator(),
        });
    }

    function select(multi) {
        $kind = $kind.filter((item) => {
            switch (params.group) {
                case "us":
                    break;
                case "aqours":
                    if (item == "original" || item == "single") return false;
                    break;
                case "nijigasaki":
                    if (item == "single") return false;
                    break;
                case "liella":
                    if (item == "unit" || item == "game") return false;
                    break;
                case "musical":
                    if (!(item == "album")) return false;
                    break;
            }
            return true;
        });
        $group = params.group;
        $inited = true;
        ga.addEvent("screen_view", {
            screen_name: "select",
        });
        ga.setUserProperties({
            single: !multi,
            groups: $group,
            kind: $kind,
        });

        if (multi) {
            replace(
                `/multi/select/${(Math.random() + 1).toString(36).substring(2)}`
            );
        } else {
            replace(`/single/select/`);
        }
    }
</script>

<body>
    <Linachanboard>
        <form>
            <h4>{$_("kindtitle")}</h4>
            {#if params.group == "aqours"}
                {#each ["anime", "original", "single", "special", "album", "game"] as kindStr}
                    <input
                        type="checkbox"
                        bind:group={$kind}
                        value={kindStr}
                    />{$_(kindStr)}<br />
                {/each}
            {:else if params.group == "nijigasaki"}
                {#each ["anime", "original", "unit", "special", "album", "game"] as kindStr}
                    <input
                        type="checkbox"
                        bind:group={$kind}
                        value={kindStr}
                    />{$_(kindStr)}<br />
                {/each}
            {:else if params.group == "liella"}
                {#each ["anime", "original", "single", "special", "album"] as kindStr}
                    <input
                        type="checkbox"
                        bind:group={$kind}
                        value={kindStr}
                    />{$_(kindStr)}<br />
                {/each}
            {:else if params.group == "musical"}
                {#each ["album"] as kindStr}
                    <input
                        type="checkbox"
                        bind:group={$kind}
                        value={kindStr}
                    />{$_(kindStr)}<br />
                {/each}
            {/if}
            <br />
            <input type="checkbox" bind:checked={$allkindchoices} />{$_(
                "kindchoice"
            )}
            <br />
            <button class="singlebtn" on:click={() => select(false)}
                >{$_("singleplay")}</button
            >
            <button class="multibtn" on:click={() => select(true)}
                >{$_("multiplay")}</button
            >
        </form>
    </Linachanboard>
</body>

<style>
    .linachanboard form button {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;

        background: var(--button-bg-color);
        color: var(--button-color);

        margin-top: 30px;
        padding: 0.5rem 1rem;

        font-family: "Noto Sans KR", sans-serif;
        font-size: 1rem;
        font-weight: 400;
        text-align: center;
        text-decoration: none;

        border: none;
        border-radius: 4px;

        display: inline-block;
        width: auto;

        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06);

        cursor: pointer;

        transition: 0.5s;
    }
</style>
