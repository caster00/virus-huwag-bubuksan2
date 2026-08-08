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

// ---- Short celebratory jingle for new high scores ----
function playHighScoreJingle() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const jingle = [523, 659, 784, 1046];
  jingle.forEach((freq, i) => {
    const osc = audioCtx.createOscillator(); const g = audioCtx.createGain();
    osc.type = 'square'; osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.11);
    g.gain.setValueAtTime(0.001, audioCtx.currentTime + i * 0.11);
    g.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + i * 0.11 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.11 + 0.18);
    osc.connect(g); g.connect(audioCtx.destination);
    osc.start(audioCtx.currentTime + i * 0.11); osc.stop(audioCtx.currentTime + i * 0.11 + 0.2);
  });
}

let gameScore = 0; let chickenX = 105; let chickenY = 205; let gameLoopInterval = null; let obstacles = []; let currentSpeedMultiplier = 1.0;
let highScore = parseInt(localStorage.getItem('hedgeChickenHighScore') || '0', 10);

function updateHighScoreDisplay() {
  const el = document.getElementById('highScoreDisplay');
  if (el) el.textContent = `HIGH SCORE: ${highScore}`;
}

function initChickenGame() {
  const canvas = document.getElementById('gameCanvas');
  document.getElementById('dpadContainer').style.display = 'grid';
  canvas.innerHTML = `<div class="lane lane-1"></div><div class="lane lane-2"></div><div class="lane lane-3"></div><div class="lane lane-4"></div><div class="goal-cake">🎂</div><div id="chicken">🐔</div>`;
  chickenX = 105; chickenY = 205; obstacles = []; updateChickenPosition();
  updateHighScoreDisplay();
  const carPool = ['🚘', '🚕', '🏎️', '🚙', '🚗'];
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

    if (gameScore > highScore) {
      highScore = gameScore;
      localStorage.setItem('hedgeChickenHighScore', String(highScore));
      updateHighScoreDisplay();
      launchConfetti(50);
      playHighScoreJingle();
    }
  }
}

function flipCard(el) { el.classList.toggle('flipped'); }

// Green confetti palette — matches the pixel aesthetic
const confettiShades = ['#eafcef', '#a9e0bc', '#5cad79', '#2e6b45', '#9fdcb3', '#f0fff3'];

function launchConfetti(count) {
  for (let i = 0; i < count; i++) {
    const conf = document.createElement('div'); conf.className = 'confetti';
    const shade = confettiShades[Math.floor(Math.random() * confettiShades.length)];
    conf.style.cssText = `left:${Math.random()*100}vw; width:8px; height:8px; background:${shade}; animation-duration:${2.5 + Math.random()*2.5}s;`;
    document.body.appendChild(conf); setTimeout(() => conf.remove(), 5000);
  }
}

function sendWish() {
  const txt = document.getElementById('wishInput').value.trim();
  if (!txt) { document.getElementById('wishInput').focus(); return; }
  if (wishSent) return; wishSent = true;
  if (!isPlaying) toggleBirthdayMusic();
  launchConfetti(120);
  document.getElementById('mainTitle').textContent = `★ HAPPY 22nd BIRTHDAY, PORSTIA ★`;
  document.getElementById('subTitle').textContent = 'Your secret 22nd birthday wish has been launched into the universe!';
  document.getElementById('wishVault').style.display = 'block';
  document.getElementById('vaultWishText').textContent = `"${txt}"`;
  document.getElementById('wishBtn').disabled = true; document.getElementById('wishInput').disabled = true;
  document.getElementById('bonusSection').style.display = 'block';
  document.getElementById('cardsSection').style.display = 'block';
}

// ---- Floating balloon background animation ----
const balloonEmojis = ['🎈'];
function spawnBalloon() {
  const b = document.createElement('div');
  b.className = 'balloon';
  b.textContent = balloonEmojis[0];
  b.style.left = Math.random() * 96 + 'vw';
  b.style.animationDuration = (9 + Math.random() * 6) + 's';
  b.style.fontSize = (22 + Math.random() * 20) + 'px';
  b.style.filter = `hue-rotate(${Math.random() > 0.5 ? 90 : -20}deg) saturate(0.6)`;
  document.body.appendChild(b);
  setTimeout(() => b.remove(), 16000);
}
setInterval(spawnBalloon, 3500);
spawnBalloon();

// ---- Hidden easter egg: click the title 6 times ----
let titleClickCount = 0;
function setupEasterEgg() {
  const title = document.getElementById('mainTitle');
  if (!title) return;
  title.style.cursor = 'pointer';
  title.addEventListener('click', () => {
    titleClickCount++;
    if (titleClickCount === 6) {
      titleClickCount = 0;
      showEasterEggMessage();
    }
  });
}

function showEasterEggMessage() {
  const overlay = document.createElement('div');
  overlay.className = 'egg-overlay';
  overlay.innerHTML = `<div class="egg-box">
      <p>▪ SECRET UNLOCKED ▪</p>
      <p class="egg-msg">You found the hidden message! Happy 22nd, Hedge — here's to more levels, more laughs, and more birthdays with the whole vaur squad. ★</p>
      <button class="egg-close">CLOSE</button>
    </div>`;
  document.body.appendChild(overlay);
  launchConfetti(60);
  overlay.querySelector('.egg-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

document.getElementById('wishBtn').addEventListener('click', sendWish);
document.getElementById('wishInput').addEventListener('keydown', e => { if(e.key === 'Enter') sendWish(); });
setupEasterEgg();
