let BPM = 105;
let STEPS = 16;
let BARDIV = 4;
let puissanceNotes = 0;
let DENSITY = 0.07;

let START = 0;
Tone.start();
let kit = 0;

let NOTETAB = new Array();

const instrument_player = [
	"/KICK.mp3",
	"/SD.mp3",
	"/CLAP.mp3",
	"/CH.mp3",
	"/CHIRP.mp3",
	"/PERC1.mp3",
	"/PERC2.mp3",
	"/PERC3.mp3",
];
//giveup

const KITS = ["/Sound-Destroyer/Sound-Destroyer/Sound-Destroyer/sounds/wav/A", "/Sound-Destroyer/Sound-Destroyer/Sound-Destroyer/sounds/wav/B", "/Sound-Destroyer/Sound-Destroyer//Sound-Destroyer/Sound-Destroyersounds/wav/C"];
let samplerA, samplerB;

samplerA = new Tone.Sampler({
	//init du sampler
	urls: {
		C3: instrument_player[0],
		"C#3": instrument_player[1],
		D3: instrument_player[2],
		"D#3": instrument_player[3],
		E3: instrument_player[4],
		F3: instrument_player[5],
		"F#3": instrument_player[6],
		G3: instrument_player[7],
	},
	baseUrl: "/Sound-Destroyer/sounds/A",
	release: 1,
});

samplerB = new Tone.Sampler({
	//init du sampler
	urls: {
		C3: instrument_player[0],
		"C#3": instrument_player[1],
		D3: instrument_player[2],
		"D#3": instrument_player[3],
		E3: instrument_player[4],
		F3: instrument_player[5],
		"F#3": instrument_player[6],
		G3: instrument_player[7],
	},
	baseUrl: "/Sound-Destroyer/sounds/B",
	release: 1,
});

samplerC = new Tone.Sampler({
	//init du sampler
	urls: {
		C3: instrument_player[0],
		"C#3": instrument_player[1],
		D3: instrument_player[2],
		"D#3": instrument_player[3],
		E3: instrument_player[4],
		F3: instrument_player[5],
		"F#3": instrument_player[6],
		G3: instrument_player[7],
	},
	baseUrl: "/Sound-Destroyer/sounds/C",
	release: 1,
});

//initialization du modele
music_rnn = new mm.MusicRNN(
	"https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/drum_kit_rnn"
);
music_rnn.initialize();

rnn_steps = 16;
rnn_temperature = 1.2;

// parametres de la generation de la premiere sequence
let prob = [1, 0.5, 0.6, 1, 0.6, 0.4, 0.8, 0.7];
let probWarp = [1, 0.8, 0.5, 0.2, 0.8, 0.5, 0.3, 0.2];
let divWarp = [1, 0.5, 4, 4, 0.5, 2, 4, 4];
let pitches = [60, 61, 62, 63, 64, 65, 66, 67];

let drumsTab = new Array(8).fill(new Array());

let infoTab;
let trigsSong;
let seqSong;

// const defaultNoteLen = 0.125;
// const delay = 0;

DRUMS = {
	notes: [{}],
	tempos: [{ time: 0, qpm: BPM }],
	totalTime: 16,
};

/*----------------------------------------------------*/ //fonction generant la premiere sequence DRUMS

function generateInitSeq(prob, probWarp, div, divWarp, pitch) {
	let initSeq = [];
	div = Math.floor(div / divWarp);
	for (let i = 0; i < STEPS; i++) {
		if (Math.random() / DENSITY < prob) initSeq[i] = pitch;
		else initSeq[i] = null;
	}
	for (let i in initSeq) {
		if (initSeq[i] != null && Math.random() * 1 < probWarp) {
			initSeq[Math.floor(i / div) * div] = initSeq[i];
			initSeq[i] = null;
		}
	}
	return initSeq;
}

function initDrumsTab() {
	for (let i = 0; i < 8; i++) {
		drumsTab[i] = generateInitSeq(
			prob[i],
			probWarp[i],
			BARDIV,
			divWarp[i],
			pitches[i]
		);
	}
	//console.log(drumsTab);
}

function initDRUMS() {
	let cpt = 0;
	for (let i = 0; i < 8; i++) {
		for (let j = 0; j < 16; j++) {
			if (drumsTab[i][j] != null) {
				if (cpt == 0)
					DRUMS.notes[0] = {
						pitch: drumsTab[i][j],
						startTime: j,
						endTime: j + 1,
					};
				else
					DRUMS.notes.push({
						pitch: drumsTab[i][j],
						startTime: j,
						endTime: j + 1,
					});
				cpt++;
			}
		}
	}
	//console.log(DRUMS);
}

function initAll() {
	drumsTab = new Array(8).fill(new Array());

	infoTab = null;
	trigsSong = new Array(16);
	for (let i = 0; i < trigsSong.length; i++) {
		trigsSong[i] = [];
	}
	seqSong = null;

	DRUMS = {
		notes: [{}],
		tempos: [{ time: 0, qpm: BPM }],
		totalTime: 16,
	};

	initDrumsTab();
	initDRUMS();
	START = 1;
}

/*----------------------------------------------------*/

function generatePattern(sequence) {
	if (seqSong != null) seqSong.clear();
	if (START) {
		const qns = mm.sequences.quantizeNoteSequence(sequence, 0.1);
		//console.log(qns);
		rnn_temperature = parseFloat(rnn_temperature);
		console.log(
			"density: ",
			DENSITY,
			"rnn_steps: ",
			rnn_steps,
			"rnn_temperature: ",
			rnn_temperature
		);
		return music_rnn
			.continueSequence(qns, rnn_steps, rnn_temperature)
			.then((r) => {
				console.log("algo promise: ", r);
				console.log("qns: ", qns);
				// infoTab = {pitch : r.notes.map(e => (e.pitch)%8), time : r.notes.map(e => (e.quantizedStartStep)%16)};
				infoTab = {
					pitch: r.notes.map((e) => e.pitch % 8),
					time: r.notes.map((e) => e.quantizedStartStep % 16),
				};
				console.log("infoTab: ", infoTab);
				infoToSeq(infoTab);
				console.log("trigsSong: ", trigsSong);
				buildSequence(trigsSong, kit);
				console.log("seqSong: ", seqSong);
				seqSong.start();
			});
	}
}

function infoToSeq(infoTab) {
	//console.log(trigsSong);
	let pitch;
	for (let i = 0; i < infoTab.pitch.length; i++) {
		// infoTab.time[i]%16
		pitch = infoTab.pitch[i];
		if (pitch == 0) trigsSong[infoTab.time[i] % 16].push("C3");
		else if (pitch == 1) trigsSong[infoTab.time[i] % 16].push("C#3");
		else if (pitch == 2) trigsSong[infoTab.time[i] % 16].push("D3");
		else if (pitch == 3) trigsSong[infoTab.time[i] % 16].push("D#3");
		else if (pitch == 4) trigsSong[infoTab.time[i] % 16].push("E3");
		else if (pitch == 5) trigsSong[infoTab.time[i] % 16].push("F3");
		else if (pitch == 6) trigsSong[infoTab.time[i] % 16].push("F#3");
		else trigsSong[infoTab.time[i] % 16].push("G3");
	}
}

function buildSequence(trigsSong, kit) {
	seqSong = new Tone.Part(
		(time, note) => {
			if (kit == 2)
				samplerA.triggerAttack(note, time, Math.random() * (1 - 0.3) + 0.3);
			else if (kit == 3)
				samplerB.triggerAttack(note, time, Math.random() * (1 - 0.3) + 0.3);
			else if (kit == 0)
				samplerC.triggerAttack(note, time, Math.random() * (1 - 0.3) + 0.3);
			NOTETAB = note;

			//console.log(kit);
		},
		[
			["0:0", trigsSong[0]],
			["0:1", trigsSong[1]],
			["0:2", trigsSong[2]],
			["0:3", trigsSong[3]],
			["1:0", trigsSong[4]],
			["1:1", trigsSong[5]],
			["1:2", trigsSong[6]],
			["1:3", trigsSong[7]],
			["2:0", trigsSong[8]],
			["2:1", trigsSong[9]],
			["2:2", trigsSong[10]],
			["2:3", trigsSong[11]],
			["3:0", trigsSong[12]],
			["3:1", trigsSong[13]],
			["3:2", trigsSong[14]],
			["3:3", trigsSong[15]],
		]
	);

	seqSong.humanize = true;
	seqSong.loop = true;
	Tone.Transport.bpm.value = BPM * 2;
	Tone.Transport.loop = false;
	Tone.Transport.swing = 0.6;
	seqSong.loopStart = 0;
	seqSong.loopEnd = "4:0:0";
	Tone.Transport.start();
	//console.log(Tone.Transport.ticks);
}

/*----------------------------------------------------*/

// effets audio

//channel

const masterChannel = new Tone.Channel(6, 0);

//mod et delay
let reverb, shift1, delay, phaser;
let volReverb, volShift1, volDelay, volPhaser;

volReverb = new Tone.Volume(0).connect(masterChannel);
reverb = new Tone.Freeverb().connect(volReverb);
reverb.wet = 1;

shift = new Tone.PitchShift(10);
volShift = new Tone.Channel({
	volume: -12,
}).connect(reverb);

shift.wet = 1;
shift.pitch = 12;
volShift.receive("shift");
shift.connect(shift);

volDelay = new Tone.Volume(0).connect(masterChannel);
delay = new Tone.FeedbackDelay("4n", 0.12).connect(volDelay);
delay.wet = 0.7;

phaser = new Tone.Phaser({
	frequency: 2,
	octaves: 2,
	baseFrequency: 500,
});

volPhaser = new Tone.Channel({
	volume: -12,
}).connect(delay);

phaser.wet = 1;
volPhaser.receive("phaser");
phaser.connect(delay);

//amp et disto

let dist;
let volDist;
let volSend = 0;

dist = new Tone.Distortion({
	distortion: 0,
});

volDist = new Tone.Channel({
	volume: -12,
}).connect(dist);

volDist.receive("dist");
dist.wet = 1;
volDist.send("shift");
volDist.send("phaser");

//effets masterChain

let distMst, shiftMst, multiband, hp, lp;
let volDistMst, volShiftMst;

const limiter = new Tone.Limiter(0).toMaster();

multiband = new Tone.MultibandCompressor({
	lowFrequency: 200,
	highFrequency: 1300,
	low: {
		threshold: -6,
	},
	mid: {
		threshold: -4,
	},
	high: {
		threshold: -2,
	},
});
multiband.connect(limiter);

let lowPassFreq = new Tone.Signal(20000, Tone.Frequency);
lp = new Tone.Filter({
	type: "lowpass",
	frequency: lowPassFreq.value,
}).connect(multiband);

let highPassFreq = new Tone.Signal(20, Tone.Frequency);
hp = new Tone.Filter({
	type: "highpass",
	frequency: highPassFreq.value,
}).connect(lp);

function filterUpdate(value, signal, filter) {
	signal.value = value;
	filter.frequency.value = signal.value;
}

volDistMst = new Tone.Volume(6).connect(hp);
distMst = new Tone.Distortion({
	distortion: 0,
}).connect(volDistMst);
distMst.wet = 1;

volShiftMst = new Tone.Volume(6).connect(distMst);
shiftMst = new Tone.PitchShift(1).connect(volShiftMst);
shiftMst.wet = 1;
shiftMst.pitch = 0;

const playerChannel = new Tone.Channel();
playerChannel.send("dist");
samplerA.connect(playerChannel);
samplerA.connect(masterChannel);
samplerB.connect(playerChannel);
samplerB.connect(masterChannel);
samplerC.connect(playerChannel);
samplerC.connect(masterChannel);

masterChannel.connect(shiftMst);

/*----------------------------------------------------*/

document.querySelector(".button1").addEventListener("click", () => {
	console.log("\n");
	if (seqSong != null) seqSong.clear();
	Tone.start();
	initAll();
	console.log("DRUMS: ", DRUMS);
	generatePattern(DRUMS);
});

document.querySelector(".button2").addEventListener("click", () => {
	Tone.Transport.stop();
	seqSong.clear();
});

//algo parameters
let densityQuery = document.querySelector(".density");
let temperatureQuery = document.querySelector(".temperature");
let bpmQuery = document.querySelector(".bpm");
let kitQuery = document.querySelector(".kit");

densityQuery.addEventListener("input", (rangeValue) => {
	DENSITY = densityQuery.value;
});
temperatureQuery.addEventListener("input", (rangeValue) => {
	rnn_temperature = temperatureQuery.value;
});
bpmQuery.addEventListener("input", (rangeValue) => {
	BPM = bpmQuery.value;
});
kitQuery.addEventListener("input", (rangeValue) => {
	kit = kitQuery.value;
});

//filters query
let lpQuery = document.querySelector(".lp");
let hpQuery = document.querySelector(".hp");

lpQuery.addEventListener("input", (rangeValue) => {
	filterUpdate(lpQuery.value, lowPassFreq, lp);
});
hpQuery.addEventListener("input", (rangeValue) => {
	filterUpdate(hpQuery.value, highPassFreq, hp);
});

//parallele effects
let distQuery = document.querySelector(".dist");
let volDistQuery = document.querySelector(".volDist");
let chain1Query = document.querySelector(".chain1");
let chain2Query = document.querySelector(".chain2");

distQuery.addEventListener("input", (rangeValue) => {
	dist.distortion = distQuery.value;
});
volDistQuery.addEventListener("input", (rangeValue) => {
	volDist.volume.value = parseFloat(volDistQuery.value);
});
chain1Query.addEventListener("input", (rangeValue) => {
	volPhaser.volume.value = parseFloat(chain1Query.value);
});
chain2Query.addEventListener("input", (rangeValue) => {
	volShift.volume.value = parseFloat(chain2Query.value);
});

//mst effects
let mstDistQuery = document.querySelector(".mstDist");
let mstShiftQuery = document.querySelector(".mstShift");

mstDistQuery.addEventListener("input", (rangeValue) => {
	distMst.distortion = mstDistQuery.value;
});
mstShiftQuery.addEventListener("input", (rangeValue) => {
	shiftMst.pitch = mstShiftQuery.value;
});

//white/black

let clickQuery = document.querySelector(".container");
//console.log("clickQuery: ", clickQuery);
clickQuery.addEventListener("click", (event) => {
	//console.log("click");
	document
		.querySelector(".musicContainer")
		.classList.toggle("musicContainerWhite");
});
