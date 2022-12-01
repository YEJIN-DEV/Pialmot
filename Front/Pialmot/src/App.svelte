<script>
    import Router from "svelte-spa-router";
    import routes from "./routes";

    function routeEvent(event) {
        if (typeof MIDI != "undefined" && event.detail.location === "/") {
            MIDI.Player.stop();
        }
    }
</script>

<Router {routes} on:routeLoading={routeEvent} />
