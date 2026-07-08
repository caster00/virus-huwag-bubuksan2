let wishSent = false;
let audioCtx = null; let isPlaying = false; let toneTimer = null;
const notes = [261, 261, 293, 261, 349, 329, 261, 261, 293, 261, 392, 349, 261, 261, 523, 440, 349, 329, 293, 466, 466, 440, 349, 392, 349];
const tempos = [400, 400, 800, 800, 800, 1200, 400, 400, 800, 800, 800, 1200, 400, 400, 800, 800, 800, 800, 800, 400, 400, 800, 800, 800, 1200];

function toggleBirthdayMusic() {
  if (isPlaying) { isPlaying = false; clearTimeout(toneTimer); document.getElementById('musicBtn').textContent = "▸ PLAY BIRTHDAY THEME"; return; }
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  isPlaying = true; document.getElementById('musicBtn').textContent = "■ STOP MUSIC"; playMelody(0);
}

function playMelody(idx) {
  if (!isPlaying || idx >= notes.length) { if(idx >= notes.length && isPlaying) playMelody(0); return; }
  let osc = audioCtx.createOscillator(); let g = audioCtx.createGain();
  osc.type = 'square'; osc.frequency.setValueAtTime(notes[idx], audioCtx.currentTime);
  g.gain.setValueAtTime(0.12, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (tempos[idx]/1000) - 0.04);
  osc.connect(g); g.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + (tempos[idx]/1000));
  toneTimer = setTimeout(() => playMelody(idx + 1), tempos[idx]);
}

let gameScore = 0; let chickenX = 105; let chickenY = 205; let gameLoopInterval = null; let obstacles = []; let currentSpeedMultiplier = 1.0;

function initChickenGame() {
  const canvas = document.getElementById('gameCanvas');
  document.getElementById('dpadContainer').style.display = 'grid';
  canvas.innerHTML = `<div class="lane lane-1"></div><div class="lane lane-2"></div><div class="lane lane-3"></div><div class="lane lane-4"></div><div class="goal-cake">🎂</div><div id="chicken">🐔</div>`;
  chickenX = 105; chickenY = 205; obstacles = []; updateChickenPosition();
  const carPool = ['🚘', '🚕', '🏎️', '🚙', '🚚'];
  for(let i = 1; i <= 4; i++) {
    let laneY = i * 40; let speed = (1.5 + Math.random() * 1.5) * (i % 2 === 0 ? 1 : -1);
    for (let c = 0; c < 2; c++) {
      let el = document.createElement('div'); el.textContent = carPool[Math.floor(Math.random() * carPool.length)]; el.style.position = 'absolute'; el.style.fontSize = '22px'; el.style.top = (laneY + 6) + 'px';
      let startX = c * 140 + Math.random() * 40; el.style.left = startX + 'px'; canvas.appendChild(el);
      obstacles.push({ element: el, y: laneY, speed: speed, x: startX });
    }
  }
  document.removeEventListener('keydown', handleDesktopKeys);
  document.addEventListener('keydown', handleDesktopKeys);
  if (gameLoopInterval) clearInterval(gameLoopInterval);
  gameLoopInterval = setInterval(runGameTick, 30);
}

function handleDesktopKeys(e) {
  if (e.key === "ArrowUp" || e.key === "w") moveChicken('up');
  if (e.key === "ArrowDown" || e.key === "s") moveChicken('down');
  if (e.key === "ArrowLeft" || e.key === "a") moveChicken('left');
  if (e.key === "ArrowRight" || e.key === "d") moveChicken('right');
  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) e.preventDefault();
}

function moveChicken(direction) {
  const box = document.getElementById('gameCanvas'); if (!box || !document.getElementById('chicken')) return;
  let containerWidth = box.clientWidth;
  if (direction === 'up' && chickenY > 5) chickenY -= 40;
  if (direction === 'down' && chickenY < 200) chickenY += 40;
  if (direction === 'left' && chickenX > 10) chickenX -= 25;
  if (direction === 'right' && chickenX < (containerWidth - 35)) chickenX += 25;
  updateChickenPosition(); checkWinCondition();
}

function updateChickenPosition() { const ch = document.getElementById('chicken'); if (ch) { ch.style.top = chickenY + 'px'; ch.style.left = chickenX + 'px'; } }

function runGameTick() {
  const box = document.getElementById('gameCanvas'); if (!box) return;
  let containerWidth = box.clientWidth;
  obstacles.forEach(car => {
    car.x += car.speed * currentSpeedMultiplier;
    if (car.speed > 0 && car.x > containerWidth) car.x = -30;
    if (car.speed < 0 && car.x < -30) car.x = containerWidth;
    car.element.style.left = car.x + 'px';
    if (chickenY === car.y + 5 && Math.abs(chickenX - car.x) < 22) triggerCrashReset();
  });
}

function triggerCrashReset() {
  chickenX = 105; chickenY = 205; updateChickenPosition();
  const ch = document.getElementById('chicken');
  if(ch) { ch.style.transform = 'scale(1.4)'; setTimeout(() => { if(ch) ch.style.transform = 'scale(1)'; }, 150); }
}

function checkWinCondition() {
  if (chickenY < 40) {
    gameScore++; document.getElementById('scoreDisplay').textContent = `SCORE: ${gameScore}`;
    currentSpeedMultiplier += 0.15; chickenX = 105; chickenY = 205; updateChickenPosition();
  }
}

function flipCard(el) { el.classList.toggle('flipped'); }
function openEnvelope() { document.getElementById('birthdayEnvelope').classList.toggle('open'); document.getElementById('envelopeSection').classList.toggle('expanded'); }

// Monochrome confetti palette — grayscale only, matches the pixel aesthetic
const monoConfettiShades = ['#f2f2f0', '#e8e8e5', '#b8b8bd', '#7d7d82', '#4a4a4f', '#ffffff'];

function sendWish() {
  const txt = document.getElementById('wishInput').value.trim();
  if (!txt) { document.getElementById('wishInput').focus(); return; }
  if (wishSent) return; wishSent = true;
  if (!isPlaying) toggleBirthdayMusic();
  for (let i = 0; i < 120; i++) {
    const conf = document.createElement('div'); conf.className = 'confetti';
    const shade = monoConfettiShades[Math.floor(Math.random() * monoConfettiShades.length)];
    conf.style.cssText = `left:${Math.random()*100}vw; width:8px; height:8px; background:${shade}; animation-duration:${2.5 + Math.random()*2.5}s;`;
    document.body.appendChild(conf); setTimeout(() => conf.remove(), 5000);
  }
  document.getElementById('mainTitle').textContent = `★ HAPPY 19th BIRTHDAY, AYESHA! ★`;
  document.getElementById('subTitle').textContent = 'Your secret 19th birthday wish has been launched into the universe!';
  document.getElementById('wishVault').style.display = 'block';
  document.getElementById('vaultWishText').textContent = `"${txt}"`;
  document.getElementById('wishBtn').disabled = true; document.getElementById('wishInput').disabled = true;
  document.getElementById('bonusSection').style.display = 'block';
  document.getElementById('cardsSection').style.display = 'block';
  document.getElementById('envelopeSection').style.display = 'block';
}

document.getElementById('wishBtn').addEventListener('click', sendWish);
document.getElementById('wishInput').addEventListener('keydown', e => { if(e.key === 'Enter') sendWish(); });
