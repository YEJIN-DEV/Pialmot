<script>
    import Router from "svelte-spa-router";
    import routes from "./routes";

    function routeEvent(event) {
        if (event.detail.location === "/") {
            document.getElementById("midi").pause();
            document.getElementById("original").pause();
        }
    }
</script>

<Router {routes} on:routeLoading={routeEvent} />
