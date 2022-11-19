var before = 0;
var snd = new Audio();

function getRandMusic(group){
    fetch('http://112.164.62.41:8000/music/'+group+'?kind=anime&original')
    .then((response) => response.json())
    .then((data) => {
        MIDI.Player.loadFile("data:audio/midi;base64,"+data.midi_buffer, function() {
            document.getElementById('current_music').innerText = data.name;
            MIDI.Player.start();
            before = new Date();
            snd.src = "data:audio/mp3;base64,"+data.mp3_buffer;
            snd.volume = 0.05;
            snd.load();
        });
    });
}

function playOriginal(){
    if (snd.paused){
        snd.currentTime = MIDI.Player.currentTime/1000;
        snd.play();
    } else{
        snd.pause();
    }
}

window.onload = function () {
    MIDI.loadPlugin({
        soundfontUrl: "https://gleitz.github.io/midi-js-soundfonts/MusyngKite/",
        instrument: "gunshot"
    });
};