var before = 0;
var snd = new Audio();
var answer = '';
var group = 0

function getRandMusic(group) {
    fetch(`http://112.164.62.41:8000/music/${group}?kind=anime&original`)
        .then((response) => response.json())
        .then((data) => {
            MIDI.Player.loadFile("data:audio/midi;base64," + data.midi_buffer, function () {
                document.getElementById('current_music').innerText = data.name;
                MIDI.Player.start();
                snd.src = "data:audio/mp3;base64," + data.mp3_buffer;
                snd.volume = 0.05;
                snd.load();
            });

            before = new Date();
            let selectbox = document.getElementById('questions')
            while (selectbox.options.length > 0) {
                selectbox.remove(0);
            }

            for (let option of data.questions) {
                let opt = document.createElement('option');
                opt.value = option;
                opt.innerText = option;
                selectbox.appendChild(opt);
            }
            answer = data.name.substring(4)
            this.group = data.group
        });
}

function playOriginal() {
    if (snd.paused) {
        snd.currentTime = MIDI.Player.currentTime / 1000;
        snd.play();
    } else {
        snd.pause();
    }
}

function onAnswer() {
    let selectbox = document.getElementById('questions');
    let selected = selectbox.options[selectbox.selectedIndex].value;
    if (selected == answer) {
        let after = new Date();
        let time = after - before;
        alert('정답입니다! 당신의 시간은 ' + time / 1000 + '초 입니다.');

        fetch(`http://112.164.62.41:8000/rank/${group}/${answer}`,
            {
                method: 'POST',
                body: time.toString()
            })
            .then((response) => response.json())
            .then((data) => {
                alert(`[${data.rank}위]\n최고:${data.best}ms\n평균:${data.average}ms\n상위:${data.pertange}%`);
            })
    } else {
        alert('오답입니다!');
    }
}

window.onload = function () {
    MIDI.loadPlugin({
        soundfontUrl: "https://gleitz.github.io/midi-js-soundfonts/MusyngKite/",
        instrument: "gunshot"
    });
};