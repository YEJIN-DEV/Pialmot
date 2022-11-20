<script>
	import * as client from "./client";
</script>

<svelte:head>
	<script type="text/javascript" src="//www.midijs.net/lib/midi.js"></script>
</svelte:head>

<main>
	<p id="current_music">재생:없다맨이야</p>
	<button on:click={() => client.getRandMusic("liella")}>리에라 재생ㄱ</button
	>
	<button on:click={() => client.getRandMusic("nijigasaki")}
		>니지동 재생ㄱ</button
	>
	<button on:click={() => client.playOriginal()}>원곡 재생/정지</button>
	<br />
	<select on:change={() => client.onAnswer()} id="questions" size="5" />
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>
