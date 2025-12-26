// === Ouroboros Snake (p5.js) w/ LOW-POLY head (mesh-style) + clean tip lines + fade-in ===

// keep all your existing variables
let frmMax = 24 * 6; // kept (not used now)
let scaleMax = 12;
let spineMax = 32;

let moveRadius, bodyRadius;

// store head position globally for click detection
let headX = 0;
let headY = 0;

// smooth time-based animation
let tSec = 0;
let speed = 0.05; // raise for faster (try 0.6–1.4)

// store last ring for low-poly head
let headRing = null;

// fade-in
let fadeDur = 1.2; // seconds
let fade = 0;      // 0..1

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(RGB, 255);
  noSmooth();
  frameRate(60);

  // nicer line joins so edges don’t look “cut”
  strokeJoin(ROUND);
  strokeCap(ROUND);

  moveRadius = min(width, height) * 0.33;
  bodyRadius = min(width, height) * 0.15;
}

// LOW-POLY head built from last ring (neck) + a tip point.
// Fixes “glitchy” lines near tip by:
// 1) drawing any solid planes FIRST (under the mesh)
// 2) drawing the triangle faces with stroke ON TOP
// 3) explicitly drawing "spoke" lines from ring vertices to tip so none stop short
function drawHeadLowPoly(ring, ang, a) {
  if (!ring || ring.length < 3) return;

  let headLen = bodyRadius * 1.35;

  // forward direction
  let fx = cos(ang), fy = sin(ang);

  // ring center (average)
  let cx = 0, cy = 0;
  for (let v of ring) { cx += v.x; cy += v.y; }
  cx /= ring.length; cy /= ring.length;

  // tip
  let tipX = cx + fx * headLen;
  let tipY = cy + fy * headLen;

  // --- base cap (solid, under the mesh) ---
  noStroke();
  fill(80, 255 * a);
  beginShape();
  for (let v of ring) vertex(v.x, v.y);
  endShape(CLOSE);

  // --- optional ridge plane (draw UNDER mesh so it doesn't "cut" tip lines) ---
  let ridgeX = cx + fx * (headLen * 0.65);
  let ridgeY = cy + fy * (headLen * 0.65);
  let px = -fy, py = fx;
  let ridgeUp = bodyRadius * 0.25;

  fill(95, 255 * a);
  beginShape();
  vertex(cx, cy);
  vertex(ridgeX + px * ridgeUp, ridgeY + py * ridgeUp);
  vertex(tipX, tipY);
  endShape(CLOSE);

  // --- cone faces (mesh on top) ---
  stroke(0, 255 * a);
  strokeWeight(2 * a);

  beginShape(TRIANGLES);
  for (let i = 0; i < ring.length; i++) {
    let A = ring[i];
    let B = ring[(i + 1) % ring.length];

    // subtle low-poly shade variation
    let shade = map(i, 0, ring.length - 1, 55, 95);
    fill(shade, 255 * a);

    vertex(A.x, A.y);
    vertex(B.x, B.y);
    vertex(tipX, tipY);
  }
  endShape();

  // --- IMPORTANT: force all "spokes" to connect to the tip (fixes the 2–3 lines that look cut) ---
  // This guarantees no edge appears to stop early due to overdraw order / triangle winding.
  stroke(0, 255 * a);
  strokeWeight(2 * a);
  for (let i = 0; i < ring.length; i++) {
    line(ring[i].x, ring[i].y, tipX, tipY);
  }

  // --- Eyes (draw last) ---
  let eyeBaseX = cx + fx * (headLen * 0.60);
  let eyeBaseY = cy + fy * (headLen * 0.60);
  let eyeOff = bodyRadius * 0.12;

  push();
  translate(eyeBaseX, eyeBaseY);
  rotate(ang);

  noStroke();
  fill(0, 255 * a);
  ellipse(0, -eyeOff, bodyRadius * 0.35, bodyRadius * 0.05);
  ellipse(0,  eyeOff, bodyRadius * 0.35, bodyRadius * 0.05);

  fill(220, 0, 0, 255 * a);
  circle(bodyRadius * 0.06, -eyeOff, bodyRadius * 0.03);
  circle(bodyRadius * 0.06,  eyeOff, bodyRadius * 0.03);

  fill(0, 255 * a);
  circle(bodyRadius * 0.075, -eyeOff, bodyRadius * 0.035);
  circle(bodyRadius * 0.075,  eyeOff, bodyRadius * 0.035);

  pop();
}

function draw() {
  background(0);
  translate(width / 2, height / 2);

  // smooth time-based animation
  tSec += deltaTime / 1000;

  // fade-in on refresh (entire loop + head)
  fade = constrain(tSec / fadeDur, 0, 1);

  let prevPvs = [];
  let hang = 0;

  for (let spineCnt = 0; spineCnt < spineMax; spineCnt++) {
    let spineRatio = map(spineCnt, 0, spineMax - 1, 0, 1);

    // smooth motion: time + ratio offset
    let moveRatio = (tSec * speed + spineRatio) % 1;
    let t = TWO_PI * moveRatio;

    let spineX = moveRadius * cos(t) * 1.2;
    let spineY = moveRadius * sin(2 * t) * 0.5;

    // build ring
    let currPvs = [];
    for (let i = 0; i < scaleMax; i++) {
      let u = i / scaleMax;
      let pRadian = TWO_PI * u;
      let pRadius = bodyRadius * (0.2 + 0.4 * spineRatio);

      let x = pRadius * cos(pRadian) + spineX;
      let y = pRadius * sin(pRadian) + spineY;
      currPvs.push(createVector(x, y));
    }

    // draw body segment (fade controls opacity + stroke weight)
    let alpha = fade;
    if (prevPvs.length !== 0) drawSpine(prevPvs, currPvs, spineRatio, alpha);
    prevPvs = currPvs;

    // cache LAST segment as head ring + head angle
    if (spineCnt === spineMax - 1) {
      headRing = currPvs.map(v => v.copy());

      // click coords: ring center (screen-space)
      let cx = 0, cy = 0;
      for (let v of currPvs) { cx += v.x; cy += v.y; }
      cx /= currPvs.length; cy /= currPvs.length;
      headX = width / 2 + cx;
      headY = height / 2 + cy;

      // tangent direction for head orientation
      let dx = -moveRadius * 1.2 * sin(t);
      let dy =  moveRadius * cos(2 * t);
      hang = atan2(dy, dx);

      // if head points backwards, uncomment:
      // hang += PI;
    }
  }

  // draw head LAST so it stays on top + fades in with body
  drawHeadLowPoly(headRing, hang, fade);
}

function drawSpine(prevPvs, currPvs, spineRatio, alpha) {
  let shade = map(spineRatio, 0, 1, 40, 100);

  stroke(0, 255 * alpha);
  strokeWeight((1 + spineRatio * 2) * alpha);
  fill(shade, 255 * alpha);

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

  // keep proportions on resize
  moveRadius = min(width, height) * 0.33;
  bodyRadius = min(width, height) * 0.15;
}
