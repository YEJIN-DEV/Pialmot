<script>
	let before = 0;
	let snd = new Audio();
	export let musicdata = { answer: "None" };
	let player_seek = 0;
	export let albumArt = "";

	const groups = {
		0: "us",
		1: "aqours",
		2: "nijigasaki",
		3: "liella",
	};
	export function getRandMusic(target) {
		MIDIjs.player_callback = (ev) => {
			player_seek = ev.time;
		};
		fetch(`http://112.164.62.41:8000/music/${target}?kind=anime&original`)
			.then((response) => response.json())
			.then((data) => {
				MIDIjs.play("data:audio/midi;base64," + data.midi_buffer);
				snd.src = "data:audio/mp3;base64," + data.mp3_buffer;
				snd.volume = 0.05;
				snd.load();

				albumArt = "data:image/jpeg;base64," + data.album.data;
				before = new Date();

				let selectbox = document.getElementById("questions");
				while (selectbox.options.length > 0) {
					selectbox.remove(0);
				}

				for (let option of data.questions) {
					let opt = document.createElement("option");
					opt.value = option.name;
					opt.innerText = option.name;
					selectbox.appendChild(opt);
				}

				musicdata = data;
			});
	}

	export function playOriginal() {
		if (snd.paused) {
			snd.currentTime = player_seek;
			snd.play();
		} else {
			snd.pause();
		}
	}

	export function changeArt() {
		let selectbox = document.getElementById("questions");
		let selected = selectbox.options[selectbox.selectedIndex].value;
		albumArt =
			"data:image/jpeg;base64," +
			musicdata.questions.find((x) => x.name == selected).data;
	}

	export function Answer() {
		let selectbox = document.getElementById("questions");
		let selected = selectbox.options[selectbox.selectedIndex].value;
		let answer = musicdata.name.substring(4);
		if (selected == answer) {
			let after = new Date();
			let time = after - before;
			alert("정답입니다! 당신의 시간은 " + time / 1000 + "초 입니다.");

			fetch(
				`http://112.164.62.41:8000/rank/${musicdata.group}/${answer}`,
				{
					method: "POST",
					body: time.toString(),
				}
			)
				.then((response) => response.json())
				.then((data) => {
					alert(
						`[${data.rank}위]\n최고:${data.best}ms\n평균:${data.average}ms\n상위:${data.pertange}%`
					);
				});
			getRandMusic(groups[musicdata.group]);
		} else {
			alert("오답입니다!");
		}
	}
</script>

<svelte:head>
	<script type="text/javascript" src="//www.midijs.net/lib/midi.js"></script>
</svelte:head>

<body>
	<div class="texts">
		<img
			on:click={() => Answer()}
			src={albumArt}
			alt="album Art"
			height="700px"
			width="700px"
		/>
		<div class="btns">
			<p>{musicdata.name}</p>
			<div class="search">
				<input type="text" class="searchTerm" placeholder="곡 검색" />
				<button type="submit" class="searchButton">
					<i class="fa fa-search" />
				</button>
			</div>
			<button on:click={() => getRandMusic("liella")}
				>리에라 재생ㄱ</button
			>
			<button on:click={() => getRandMusic("nijigasaki")}
				>니지동 재생ㄱ</button
			>
			<button on:click={() => playOriginal()}>원곡 재생/정지</button>
		</div>
		<select on:change={() => changeArt()} id="questions" size="5" />
	</div>
</body>

<style>
	body {
		text-align: center;
		margin: 0 auto;
		background-color: #f0eeec;
	}

	img {
		box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
	}

	p {
		font-family: "Inter";
		font-style: normal;
		font-weight: bold;
		font-size: 30px;
	}

	.texts {
		display: flex;
		padding: 10rem 0 0 10rem;
		height: 300px;
	}

	.btns {
		flex: none;
		padding: 0rem 0 0 2rem;
		height: 300px;
	}

	@media (min-width: 640px) {
		body {
			max-width: none;
		}
	}
</style>
