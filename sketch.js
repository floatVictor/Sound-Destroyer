let i = 0;
let j = 0;
let p = 0;
let u = 0;
let put = 0;
let right = 1;
let left;
let up = 1;
let up2 = 1;
let down = 0;
let val1;
let val2;
let STATE;
let foundC3, foundCD3, foundD3, foundDD3, foundE3, foundF3, foundFD3, foundG3;

function setup() {
	colorMode(RGB, 100);
	canvas = createCanvas(window.innerWidth, window.innerHeight, WEBGL).parent(
		"canvas"
	);
	background(0);
	canvas.position(0, 0);
	noStroke();
	STATE = SUBTRACT;
}
function detect() {
	foundC3 = NOTETAB.find((element) => element == "C3");
	foundCD3 = NOTETAB.find((element) => element == "C#3");
	foundD3 = NOTETAB.find((element) => element == "D3");
	foundDD3 = NOTETAB.find((element) => element == "D#3");
	foundE3 = NOTETAB.find((element) => element == "E3");
	foundF3 = NOTETAB.find((element) => element == "F3");
	foundFD3 = NOTETAB.find((element) => element == "F#3");
	foundG3 = NOTETAB.find((element) => element == "G3");
}

function elbox(x, y, z, px, py, rx, ry, rz, t) {
	push();
	rotateX(i / rx);
	rotateY(i / ry);
	rotateZ(i / rz);
	translate(0, t, 0);
	box(x, y, z, px, py);
	pop();
}

function elCirlcle(r, px, py, rx, ry, rz, t) {
	push();
	rotateX(i / rx);
	rotateY(i / ry);
	rotateZ(i / rz);
	translate(0, t, 0);
	sphere(r, px, py);
	pop();
}

function mouseClicked() {
	if (STATE === SUBTRACT) STATE = BLEND;
	else STATE = SUBTRACT;
}
function feedback(n) {
	push();
	blendMode(STATE);
	fill(255, 255, 255, n);
	if (
		mstShiftQuery.value > -15 &&
		mstShiftQuery.value < 15 &&
		chain2Query.value <= -2 &&
		chain2Query.value >= -23
	)
		box(4000, 4000, 4000, 100);

	pop();
	blendMode(BLEND);
}

function kick(on, x, y, z, px, py, rx, ry, rz) {
	p = 0;
	if (j > 60) j = 0;
	elbox(x, y + exp(j * 0.01) * j, z + j * 2, px, py, rx, ry, rz, 0);
	if (on == 1) j += 1;
	else {
		if (j > 0) j -= 1;
	}
}
function Lkick() {
	left = 0;
	if (foundC3 == "C3") {
		left = 20;
		put = 1;
	} else {
		put = 0;
	}
}
function Rkick() {
	if (foundG3 == "G3" || foundF3 == "F3") {
		right = 3;
	} else if (right > 0.1) right -= 0.1;
}
function Ukick() {
	if (foundDD3 == "D#3" || foundFD3 == "F#3") {
		if (up < 40) up += 5;
	} else if (up > 0.5) up -= 0.45;
}
function Dkick() {
	if (foundE3 == "E3") {
		if (up2 < 40) up2 += 5;
	} else if (up2 > 1) up2 -= 1;
}

function Bkick() {
	if (foundCD3 == "C#3" || foundD3 == "D3") {
		down = 100;
	} else if (down > 0) down -= -10;
}

function draw() {
	document.querySelector(".button2").addEventListener("click", () => {
		background(0);
	});
	//background(0);
	ambientMaterial(255, 255, 255);
	detect();
	//console.log(foundC3);
	camera(
		sin((winMouseX + i * bpmQuery.value * 0.02) / 200) *
			(150 + ((winMouseY / 100) % 400)),
		cos(winMouseY / 200) * 150,
		cos((winMouseX + i) / 200) * (150 + ((winMouseY / 100) % 400)),
		0,
		0,
		0,
		0,
		-1,
		0
	);
	ambientLight(
		(120 + 0.01275 * lpQuery.value - i / 40) % 135,
		100 - ((i / 6) % 90),
		(20 + hpQuery.value * 0.051) % 255
	);
	directionalLight(
		(i / 200) % 100,
		120 - mstShiftQuery.value,
		(mstShiftQuery.value + 60) * 2,
		0,
		0,
		1
	);
	directionalLight(20 + ((i / 100) % 224), 200, 170 / (i % 170), 0, 1, -1);
	directionalLight(i % 255, 12 + ((i / 100) % 90), 46, 1, -1, 0);
	feedback(1);
	Ukick();
	Dkick();

	push();
	translate(40, 30, 50);
	rotateX(-i / 200);
	rotateZ(-i / 200);
	cylinder((-chain1Query.value - 24) / 1.5, up2, 10, 500);
	pop();
	push();
	translate(-40, -30, -50);
	rotateX(-i / 200);
	rotateZ(-i / 200);
	cylinder((-chain1Query.value - 24) / 1.5, up2, 10, -500);
	pop();

	Bkick();
	elbox(
		10 + down * 0.001,
		down,
		4 + (mstShiftQuery.value + 60) * 0.1,
		3000,
		30,
		43,
		21,
		273,
		166
	);
	Rkick();
	//console.log("oiluyuthrgm0", mstDistQuery.value);
	if (mstDistQuery.value != 0) {
		elCirlcle(right + mstDistQuery.value * 0.9, 10, 20, 400, 21, i, 100);
		elCirlcle(right + mstDistQuery.value * 0.9, 10, 20, 400, 21, i, 110);
	} else {
		elCirlcle(right, 10, 20, 400, 21, i, 100);
		elCirlcle(right, 10, 20, 400, 21, i, 110);
	}
	Lkick();
	kick(
		put,
		left + (i % 150),
		left + 5,
		left + 10 + hpQuery.value * 0.005,
		100,
		9,
		80,
		378,
		i
	);
	rotateZ(i % 7);
	ambientMaterial(60, (70 + i / 20) % 255, 100);
	val2 = (-chain2Query.value - 24) * 0.01;
	for (let p = 0; p < 4; p++) {
		for (let q = 0; q < p; q++) {
			for (let s = 0; s < 4; s++) {
				push();
				translate(
					distQuery.value * 5 * q * 0.2 * -(up - 70),
					p * 0.2 * -(up - 40) + 15,
					-s * 0.2 * -(up - 40)
				);
				elbox(
					0.3 * p + val2 * 2,
					0.3 * p + val2,
					0.3 * p + val2,
					0,
					0,
					20,
					30,
					90,
					0
				);
				pop();
			}
		}
	}
	i++;
}
