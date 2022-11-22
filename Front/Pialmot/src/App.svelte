<script>
    import Router from "svelte-spa-router";
    import routes from "./routes";
    function routeEvent(event) {
        if (event.detail.location === "/") {
            MIDIjs.stop();
        }
    }
</script>

<Router {routes} on:routeLoading={routeEvent} />
