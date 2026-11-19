const CANVAS_W = 1920;
const CANVAS_H = 1080;

const PHOTOS = [
  { file: 'images/sweep.jpg', focus: [0.22, 0.5], fit: 'cover' },
  { file: 'images/bike2.jpg', focus: [0.46, 0.2], fit: 'cover' },
  { file: 'images/lottery.jpg', focus: [0.45, 0.2], fit: 'cover' },
  { file: 'images/dance.jpg', focus: [0.5, 0.15], fit: 'cover' },
];

const PALETTES = [
  { name: 'market day', fabric: '#F1E9DA', threads: ['#2E2A4F', '#B23A48', '#E8A33D', '#7FB7A4', '#F6E7C1'] },
  { name: 'grandma quilt', fabric: '#EFE3CF', threads: ['#3D2B1F', '#2F6B5E', '#C8553D', '#F2A541', '#F7D8B5'] },
  { name: 'indigo and rust', fabric: '#F3EEE4', threads: ['#1B2A4A', '#3E6AA8', '#B5523B', '#E3A66B', '#EEDFC8'] },
  { name: 'tropical', fabric: '#E9F0E6', threads: ['#1F3B2D', '#00798C', '#D1495B', '#EDAE49', '#F4E8C1'] },
  { name: 'temple', fabric: '#F6EAD7', threads: ['#5B1A18', '#C0392B', '#E67E22', '#F4D03F', '#FDF2D0'] },
  { name: 'night market on black', fabric: '#1C1A1E', threads: ['#3B2F5C', '#C2405C', '#5FB49C', '#F28F3B', '#FFE8C2'] },
  { name: 'pastel pop', fabric: '#FBF3F6', threads: ['#4A3B6B', '#E07A9F', '#7EC4CF', '#F6C667', '#FFF1E0'] },
  { name: 'soil and sky', fabric: '#E8DFCF', threads: ['#3A2E28', '#7A5230', '#4F7CAC', '#A3C9A8', '#F2E6D0'] },
  { name: 'photo', fabric: '#E6DCC8', threads: [] },
];

const GROWTH_TYPES = ['from the person', 'from the person', 'from the bottom', 'from one side', 'in patches'];

let img, photo, palette, threads, growth;
let cellSize, stitchedAmount, cols, rows, darkest, lightest;
let photoLeft = 0, photoCols;
let edgeCells = [];

function preload() {
  photo = random(PHOTOS);
  img = loadImage(typeof PHOTO_DATA !== 'undefined' ? PHOTO_DATA[photo.file] : photo.file);
}

function setup() {
  createCanvas(CANVAS_W, CANVAS_H);
  colorMode(HSB, 360, 100, 100, 100);
  noLoop();
  chooseRandomSettings();
  preparePhoto();
  threads = chooseThreads();
}

function draw() {
  drawFabric();
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      drawStitchCell(i, j);
    }
  }
  drawLooseThreads(floor(random(3, 8)));
  showSettings();
}

function chooseRandomSettings() {
  palette = random(PALETTES);
  growth = random(GROWTH_TYPES);
  cellSize = floor(random(10, 19));
  if (photo.fit === 'contain') cellSize = floor(random(7, 12));
  stitchedAmount = random(0.35, 0.85);
  cols = ceil(CANVAS_W / cellSize);
  rows = ceil(CANVAS_H / cellSize);
}

function preparePhoto() {
  if (photo.fit === 'contain') {
    photoCols = round(rows * img.width / img.height);
    photoLeft = floor(random([0.12, 0.5, 0.88]) * (cols - photoCols));
    img.resize(photoCols, rows);
  } else {
    let w = img.width, h = img.height;
    if (w / h > cols / rows) w = h * cols / rows;
    else h = w * rows / cols;
    img = img.get(floor((img.width - w) * photo.focus[0]), floor((img.height - h) * photo.focus[1]), floor(w), floor(h));
    img.resize(cols, rows);
    photoCols = cols;
  }
  findLightRange();
}

function inPhoto(i) {
  return i >= photoLeft && i < photoLeft + photoCols;
}

function lightOf(px) {
  return (0.299 * px[0] + 0.587 * px[1] + 0.114 * px[2]) / 2.55;
}

function findLightRange() {
  darkest = 100;
  lightest = 0;
  for (let i = 0; i < photoCols; i++) {
    for (let j = 0; j < rows; j++) {
      const l = lightOf(img.get(i, j));
      darkest = min(darkest, l);
      lightest = max(lightest, l);
    }
  }
}

function chooseThreads() {
  let list = [];
  for (let k = 0; k < 5; k++) {
    if (palette.name === 'photo') list.push(img.get(floor(random(photoCols)), floor(random(rows))));
    else list.push(hexToRgb(palette.threads[k]));
  }
  list.sort((a, b) => lightOf(a) - lightOf(b));
  return list.map(px => color(`rgb(${px[0]}, ${px[1]}, ${px[2]})`));
}

function hexToRgb(hex) {
  return [unhex(hex.slice(1, 3)), unhex(hex.slice(3, 5)), unhex(hex.slice(5, 7))];
}

function threadColour(px) {
  const k = floor(map(lightOf(px), darkest, lightest, 0, threads.length));
  return threads[constrain(k, 0, threads.length - 1)];
}

function growthScore(i, j) {
  const x = i / cols, y = j / rows;
  const wobble = noise(i * 0.06, j * 0.06) * 0.3;
  if (growth === 'from the person') return dist(x, y, (photoLeft + photo.focus[0] * photoCols) / cols, photo.focus[1]) * 0.8 + wobble;
  if (growth === 'from the bottom') return (1 - y) * 0.7 + wobble;
  if (growth === 'from one side') return x * 0.7 + wobble;
  return map(noise(i * 0.035 + 50, j * 0.035 + 50), 0.3, 0.7, 0, 1);
}

function drawFabric() {
  background(palette.fabric);
  noStroke();
  fill(0, 0, 0, 18);
  for (let i = 0; i <= cols; i++) {
    for (let j = 0; j <= rows; j++) {
      circle(i * cellSize, j * cellSize, cellSize * 0.22);
    }
  }
}

function drawStitchCell(i, j) {
  if (!inPhoto(i)) return;
  const x = i * cellSize, y = j * cellSize;
  const c = threadColour(img.get(i - photoLeft, j));
  const score = growthScore(i, j);
  if (score < stitchedAmount) {
    drawLeg(x, y + cellSize, x + cellSize, y, c);
    drawLeg(x, y, x + cellSize, y + cellSize, c);
  } else if (score < stitchedAmount + 0.03) {
    drawLeg(x, y + cellSize, x + cellSize, y, c);
    edgeCells.push([x, y, c]);
  } else {
    drawPattern(x, y, c);
  }
}

function drawLeg(x1, y1, x2, y2, c) {
  const m = cellSize * 0.12, w = cellSize * 0.3;
  const sx = x1 < x2 ? m : -m, sy = y1 < y2 ? m : -m;
  x1 += sx; y1 += sy; x2 -= sx; y2 -= sy;
  strokeCap(ROUND);
  stroke(0, 0, 0, 25); strokeWeight(w * 1.2); line(x1 + 1, y1 + 1.5, x2 + 1, y2 + 1.5);
  stroke(c); strokeWeight(w); line(x1, y1, x2, y2);
  stroke(hue(c), saturation(c) * 0.6, min(100, brightness(c) + 25), 45);
  strokeWeight(w * 0.25); line(x1 + w * 0.2, y1 - w * 0.2, x2 + w * 0.2, y2 - w * 0.2);
}

function drawPattern(x, y, c) {
  noStroke();
  fill(hue(c), saturation(c), brightness(c), 10);
  rect(x + 1, y + 1, cellSize - 2, cellSize - 2);
  noFill();
  stroke(hue(c), saturation(c), brightness(c), 30);
  strokeWeight(1);
  circle(x + cellSize / 2, y + cellSize / 2, cellSize * 0.35);
}

function drawLooseThreads(count) {
  for (let k = 0; k < count && edgeCells.length > 0; k++) {
    const [x, y, c] = random(edgeCells);
    drawThread(x + cellSize / 2, y + cellSize / 2, c, k === 0);
  }
}

function drawThread(x, y, c, withNeedle) {
  const len = random(150, 350), side = random(-1, 1);
  const ex = x + side * len * 0.5, ey = y + len;
  noFill();
  stroke(c); strokeWeight(cellSize * 0.26);
  bezier(x, y, x + side * 40, y + len * 0.3, ex - side * 50, ey - len * 0.3, ex, ey);
  if (withNeedle) drawNeedle(ex, ey, atan2(len * 0.3, side * 50));
}

function drawNeedle(x, y, angle) {
  push();
  translate(x, y);
  rotate(angle);
  stroke(0, 0, 30); strokeWeight(5); line(-6, 0, 70, 0);
  stroke(0, 0, 90); strokeWeight(3); line(-6, 0, 70, 0);
  pop();
}

function showSettings() {
  const box = document.getElementById('settings');
  if (box) box.textContent = `photo: ${photo.file.slice(7)} · colours: ${palette.name} · stitch: ${cellSize}px · ` +
    `finished: ${round(stitchedAmount * 100)}% · started: ${growth}`;
}
