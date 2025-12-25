// keep all your existing variables
let frmMax = 24 * 6;
let scaleMax = 12;
let spineMax = 32;

let moveRadius, bodyRadius;

// store head position globally for click detection
let headX = 0;
let headY = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(RGB, 255);
  noSmooth();
  frameRate(30);

  moveRadius = min(width, height) * 0.33;
  bodyRadius = min(width, height) * 0.15;
}

function draw() {
  background(0);
  translate(width / 2, height / 2);

  let prevPvs = [];

  for (let spineCnt = 0; spineCnt < spineMax; spineCnt++) {
    let spineRatio = map(spineCnt, 0, spineMax, 0, 1);

    let moveRatio = (frameCount / frmMax + spineRatio) % 1;
    let t = TWO_PI * moveRatio;

    let spineX = moveRadius * cos(t) * 1.2;
    let spineY = moveRadius * sin(2 * t) * 0.5;

    // store head position for click detection (head = first spine)
    if (spineCnt === 0) {
      headX = width / 2 + spineX;
      headY = height / 2 + spineY;
    }

    let currPvs = [];
    for (let i = 0; i < scaleMax; i++) {
      let u = i / scaleMax;
      let pRadian = TWO_PI * u;
      let pRadius = bodyRadius * (0.2 + 0.4 * spineRatio);

      let x = pRadius * cos(pRadian) + spineX;
      let y = pRadius * sin(pRadian) + spineY;
      currPvs.push(createVector(x, y));
    }

    let alpha = min(1, frameCount / 60);

    if (prevPvs.length != 0) drawSpine(prevPvs, currPvs, spineRatio, alpha);
    prevPvs = currPvs;
  }
}

function drawSpine(prevPvs, currPvs, spineRatio, alpha) {
  let shade = map(spineRatio, 0, 1, 40, 100) * alpha;

  stroke(0);
  strokeWeight((1 + spineRatio * 2) * alpha);
  fill(shade);

  beginShape(TRIANGLE_FAN);
  for (let i = 0; i < currPvs.length; i++) {
    vertex(prevPvs[i].x, prevPvs[i].y);
    vertex(currPvs[i].x, currPvs[i].y);
  }
  endShape(CLOSE);
}

function mousePressed() {
  let d = dist(mouseX, mouseY, headX, headY);
  if (d < bodyRadius * 2) { 
    window.location.href = "cd.html"; 
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
