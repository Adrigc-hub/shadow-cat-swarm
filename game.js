const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

// --- PERSISTENCIA Y ESTADOS ---
let localLevels = JSON.parse(localStorage.getItem('cat_dash_local_levels')) || [];
let gameState = 'MENU'; 
let activeLevel = null;
let currentScore = 0;
let playerHealth = 100; 
let currentPhase = 1;
let phaseTimer = 0;
let mappedBeats = [];
let mappedDecorations = []; 
let editorSubMode = 'RHYTHM'; 

// Partículas de fondo para ambientación
const level1Stars = [];
for(let i = 0; i < 40; i++) {
    level1Stars.push({ x: Math.random() * 800, y: Math.random() * 600, size: Math.random() * 3 + 1, blinkSpeed: Math.random() * 2 + 1 });
}

// --- MOTOR DE MÚSICA NATIVO (Sintetizador Integrado) ---
const WeezerSynth = {
    ctx: null,
    isPlaying: false,
    startTime: 0,
    elapsedTime: 0,
    nextNoteIndex: 0,
    notes: [],
    duration: 60,

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },
    playTone(freq, type, duration, time, vol = 0.12) {
        let osc = this.ctx.createOscillator();
        let gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(vol, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + duration);
    },
    playDrumKick(time) {
        let osc = this.ctx.createOscillator();
        let gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(120, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.15);
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 0.15);
    },
    buildTrack() {
        this.notes = [];
        let basePattern = [146, 165, 146, 131, 110, 98, 110, 131];
        let t = 0.2;
        for (let loop = 0; loop < 40; loop++) {
            basePattern.forEach((freq, idx) => {
                let modifier = 1 + (currentPhase * 0.05); 
                this.notes.push({ time: t, freq: freq * modifier, type: 'triangle', isKick: idx % 2 === 0 });
                if(idx % 4 === 0) this.notes.push({ time: t, freq: freq * 1.5 * modifier, type: 'square', isKick: false, vol: 0.03 }); 
                t += 0.25; 
            });
        }
        this.duration = t;
    },
    play() {
        this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        this.buildTrack();
        this.isPlaying = true;
        this.startTime = this.ctx.currentTime - this.elapsedTime;
        this.nextNoteIndex = 0;
        while(this.nextNoteIndex < this.notes.length && this.notes[this.nextNoteIndex].time < this.elapsedTime) {
            this.nextNoteIndex++;
        }
    },
    pause() {
        this.isPlaying = false;
        if (this.ctx) this.elapsedTime = this.ctx.currentTime - this.startTime;
    },
    stop() {
        this.isPlaying = false;
        this.elapsedTime = 0;
        this.nextNoteIndex = 0;
    },
    update() {
        if (!this.isPlaying) return;
        let now = this.ctx.currentTime - this.startTime;
        this.elapsedTime = now;
        while (this.nextNoteIndex < this.notes.length && this.notes[this.nextNoteIndex].time < now) {
            let n = this.notes[this.nextNoteIndex];
            this.playTone(n.freq, n.type, 0.22, this.startTime + n.time, n.vol || 0.12);
            if (n.isKick) this.playDrumKick(this.startTime + n.time);
            this.nextNoteIndex++;
        }
    }
};

// --- CONFIGURACIÓN DE NIVELES PRINCIPALES ---
let globalOnlineLevels = [
    { name: "Sweet Dreams (Weezer)", creator: "Adrigc", bg: "#0a0a14", bulletColor: "#00e5ff", beats: [1.2, 2.3, 3.4, 4.5, 5.6, 6.7, 7.8], deco: [] },
    { name: "fun time", creator: "OL666s", bg: "#300303", bulletColor: "#ff2222", beats: [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0], deco: [], isCustomBoss: true },
    { name: "Nivel 3: Cat Step", creator: "Geometry Engine", bg: "#0d1f11", bulletColor: "#ffaa00", beats: [1, 2, 3, 4, 5], deco: [] }
];

// --- PERSONAJE ---
let cat = { 
    x: 400, y: 300, targetX: 400, targetY: 300, radius: 24, 
    color: '#1a1a26', squishX: 1, squishY: 1, tailAngle: 0 
};

// --- CONFIGURACIÓN DEL JEFE ("fun time") ---
let bossData = {
    rotation: 0, pulse: 1, armsExtended: false, armExtensionProgress: 0, weaponType: 0 
};

let bullets = []; let rhythmPoints = []; let particles = []; let afterImages = [];
const rhythmBar = { x: 100, y: 510, width: 600, height: 45, speed: 380 };
const DIRECTIONS = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
const DIR_VECTORS = { 'UP': {x: 0, y: -90}, 'DOWN': {x: 0, y: 90}, 'LEFT': {x: -90, y: 0}, 'RIGHT': {x: 90, y: 0} };

// --- NAVEGACIÓN DE PANTALLAS (SISTEMA CORREGIDO) ---
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    // Ocultar interfaces de juego y editor por defecto al navegar
    document.getElementById('inGameUI').style.display = 'none';
    document.getElementById('editorUI').style.display = 'none';

    if (screenId !== 'none') {
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) targetScreen.classList.add('active');
    }
    
    if(screenId === 'mainMenu') { 
        gameState = 'MENU'; 
        WeezerSynth.stop();
    }
    if(screenId === 'onlineMenu') {
        renderOnlineLevels();
    }
    if(screenId === 'localLevelsMenu') {
        renderLocalLevels();
    }
}
window.switchScreen = switchScreen;

// Carga de niveles en la sección "Play" (Niveles principales)
function renderOnlineLevels(filter = "") {
    const list = document.getElementById('onlineLevelList');
    if (!list) return;
    list.innerHTML = "";
    globalOnlineLevels.forEach(lvl => {
        const item = document.createElement('div');
        item.className = 'level-item';
        item.innerHTML = `<div><strong>${lvl.name}</strong><br><span style="color:#aaa;font-size:12px;">Por: ${lvl.creator}</span></div>`;
        const btn = document.createElement('button');
        btn.className = 'btn-action'; btn.style.background = lvl.isCustomBoss ? '#ff2222' : '#00d2ff'; btn.innerText = '▶';
        btn.addEventListener('click', () => playDirectLevel(lvl));
        item.appendChild(btn);
        list.appendChild(item);
    });
}

// Carga de niveles creados en la sección de "Lupa" (Niveles locales)
function renderLocalLevels() {
    const list = document.getElementById('localLevelList');
    if(!list) return;
    list.innerHTML = localLevels.length === 0 ? '<div style="text-align:center;color:#aaa;padding:20px;">No tienes niveles creados aún.</div>' : '';
    localLevels.forEach((lvl) => {
        const item = document.createElement('div');
        item.className = 'level-item';
        item.innerHTML = `<div><strong>${lvl.name}</strong></div>`;
        const btn = document.createElement('button');
        btn.className = 'btn-action'; btn.style.background = '#52c234'; btn.innerText = '▶';
        btn.addEventListener('click', () => playDirectLevel(lvl));
        item.appendChild(btn);
        list.appendChild(item);
    });
}

// --- EVENTOS DIRECTOS PARA ARREGLAR LOS BOTONES DEL MENÚ ---
document.addEventListener("DOMContentLoaded", () => {
    // 1. Botón PLAY (Normalmente id="playBtn") -> Te manda a los niveles principales donde está "fun time"
    const playBtn = document.getElementById('playBtn');
    if(playBtn) {
        playBtn.addEventListener('click', () => switchScreen('onlineMenu'));
    }

    // 2. Botón LUPA (Normalmente id="searchBtn" o "lupaBtn") -> Te manda a ver tus niveles locales creados
    const searchBtn = document.getElementById('searchBtn') || document.getElementById('lupaBtn');
    if(searchBtn) {
        searchBtn.addEventListener('click', () => switchScreen('localLevelsMenu'));
    }

    // 3. Botón CONSTRUCCIÓN/CREAR (Normalmente id="createBtn" o "buildBtn") -> Te manda al menú de creación
    const createBtn = document.getElementById('createBtn') || document.getElementById('buildBtn');
    if(createBtn) {
        createBtn.addEventListener('click', () => switchScreen('creatorMenu'));
    }
    
    // Botones de regreso al menú principal
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => switchScreen('mainMenu'));
    });
    
    // Render inicial por seguridad
    renderOnlineLevels();
});

// --- ENTRAR A UN NIVEL ---
function playDirectLevel(lvlObj) {
    WeezerSynth.init();
    activeLevel = lvlObj;
    switchScreen('none'); // Oculta los menús HTML de fondo
    document.getElementById('inGameUI').style.display = 'block';
    
    currentScore = 0;
    playerHealth = 100;
    currentPhase = 1;
    phaseTimer = 0;
    
    document.getElementById('scoreHUD').innerText = "PUNTOS: 0";
    bullets = []; particles = []; afterImages = []; rhythmPoints = [];
    gameState = 'PLAYING';

    generatePhaseBeats();
    WeezerSynth.play();
}

function generatePhaseBeats() {
    rhythmPoints = [];
    let baseInterval = Math.max(0.3, 1.2 - (currentPhase * 0.08));
    let startTime = WeezerSynth.elapsedTime + 0.5;
    
    for(let i = 0; i < 12 + currentPhase; i++) {
        let triggerTime = startTime + (i * baseInterval);
        rhythmPoints.push({ 
            triggerTime: triggerTime, 
            direction: DIRECTIONS[Math.floor(Math.random() * 4)], 
            spawned: false, 
            hit: false, 
            x: rhythmBar.x + rhythmBar.width 
        });
    }
}

// --- CONTROLES DE ESQUIVE ---
let touchStart = { x: 0, y: 0 };
let isInteracting = false;

function handleStart(x, y) {
    touchStart.x = x; touchStart.y = y; isInteracting = true;
}

function handleMove(x, y) {
    if (!isInteracting || gameState !== 'PLAYING') return;
    const dx = x - touchStart.x; const dy = y - touchStart.y;
    if (Math.abs(dx) > 25 || Math.abs(dy) > 25) {
        checkSwipe(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'RIGHT' : 'LEFT') : (dy > 0 ? 'DOWN' : 'UP'));
        isInteracting = false;
    }
}

canvas.addEventListener('mousedown', (e) => { const r = canvas.getBoundingClientRect(); handleStart((e.clientX - r.left)*(800/r.width), (e.clientY - r.top)*(600/r.height)); });
canvas.addEventListener('mousemove', (e) => { const r = canvas.getBoundingClientRect(); handleMove((e.clientX - r.left)*(800/r.width), (e.clientY - r.top)*(600/r.height)); });
window.addEventListener('mouseup', () => isInteracting = false);

canvas.addEventListener('touchstart', (e) => { const r = canvas.getBoundingClientRect(); const t = e.touches[0]; handleStart((t.clientX - r.left)*(800/r.width), (t.clientY - r.top)*(600/r.height)); });
canvas.addEventListener('touchmove', (e) => { const r = canvas.getBoundingClientRect(); const t = e.touches[0]; handleMove((t.clientX - r.left)*(800/r.width), (t.clientY - r.top)*(600/r.height)); });
window.addEventListener('touchend', () => isInteracting = false);

function checkSwipe(dir) {
    let success = false;
    for (let pt of rhythmPoints) {
        let distance = Math.abs(pt.x - rhythmBar.x);
        if (distance < 55 && pt.direction === dir && !pt.hit && pt.spawned) {
            pt.hit = true; success = true; currentScore += 15;
            document.getElementById('scoreHUD').innerText = "PUNTOS: " + currentScore;
            
            for(let i = 1; i <= 4; i++) {
                afterImages.push({ x: cat.x, y: cat.y, alpha: 0.6 - (i * 0.12), delay: i * 2, radius: cat.radius });
            }
            const vec = DIR_VECTORS[dir]; 
            cat.targetX = 400 + vec.x * 1.2; 
            cat.targetY = 300 + vec.y * 1.2;
            cat.squishX = (dir === 'LEFT' || dir === 'RIGHT') ? 1.6 : 0.4; 
            cat.squishY = (dir === 'UP' || dir === 'DOWN') ? 1.6 : 0.4;
            
            createParticles(pt.x, rhythmBar.y + rhythmBar.height/2, '#00ffaa');
            break;
        }
    }
    if(!success) { 
        cat.color = '#ff1111'; 
        setTimeout(() => cat.color = '#1a1a26', 150); 
    }
}

function spawnBullet(dir) {
    let sx = cat.x, sy = cat.y;
    if (dir === 'UP') sy = -30; 
    if (dir === 'DOWN') sy = 630; 
    if (dir === 'LEFT') sx = -30; 
    if (dir === 'RIGHT') sx = 830;
    
    let speedBonus = 1 + (currentPhase * 0.1);
    bullets.push({ 
        x: sx, y: sy, targetX: 400, targetY: 300, progress: 0, 
        speed: (1 / (rhythmBar.width / rhythmBar.speed)) * speedBonus 
    });
}

function createParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particles.push({ x, y, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8, radius: Math.random()*4+2, alpha: 1, color });
    }
}

// Controles internos del menú de pausa HUD
const inGamePauseBtn = document.getElementById('pauseBtn');
if(inGamePauseBtn) {
    inGamePauseBtn.addEventListener('click', () => { if(gameState=='PLAYING'){ gameState='PAUSED'; WeezerSynth.pause(); switchScreen('pauseMenu'); } });
}
const resumeBtn = document.getElementById('resumeBtn');
if(resumeBtn) {
    resumeBtn.addEventListener('click', () => { document.getElementById('pauseMenu').classList.remove('active'); document.getElementById('inGameUI').style.display='block'; gameState='PLAYING'; WeezerSynth.play(); });
}
const exitBtn = document.getElementById('exitBtn');
if(exitBtn) {
    exitBtn.addEventListener('click', () => switchScreen('mainMenu'));
}

// --- MAPPING EDITOR ACTIVATOR ---
window.startRhythmMapping = function() {
    WeezerSynth.init(); 
    activeLevel = {
        name: document.getElementById('levelNameInput')?.value || "Nivel Personalizado",
        bg: document.getElementById('levelBgInput')?.value || "#0b0b12",
        bulletColor: document.getElementById('levelBulletColor')?.value || "#ff0000",
        beats: [], deco: []
    };
    mappedBeats = []; mappedDecorations = []; editorSubMode = 'RHYTHM';
    switchScreen('none'); 
    document.getElementById('editorUI').style.display = 'block';
    gameState = 'MAPPING_EDITOR';
    WeezerSynth.play();
};

// --- BUCLE CENTRAL ---
let lastTime = 0;
function coreLoop(timestamp) {
    let dt = (timestamp - lastTime) / 1000; if(isNaN(dt)) dt = 0; lastTime = timestamp;

    if (gameState === 'PLAYING') {
        WeezerSynth.update();
        phaseTimer += dt;

        if (activeLevel.isCustomBoss && phaseTimer >= 5.5) { 
            if (currentPhase < 10) {
                currentPhase++;
                phaseTimer = 0;
                playerHealth = Math.max(10, playerHealth - 8); 
                bossData.weaponType = (bossData.weaponType + 1) % 3; 
                generatePhaseBeats();
                ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,800,600);
            } else if (currentPhase === 10 && rhythmPoints.every(pt => pt.hit || pt.x < rhythmBar.x)) {
                alert(`¡NIVEL "FUN TIME" COMPLETADO!\nPuntuación final: ${currentScore}`);
                switchScreen('mainMenu');
            }
        }
    }

    ctx.fillStyle = (gameState === 'PLAYING' && activeLevel.isCustomBoss) ? '#1c0202' : '#0b0b12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    level1Stars.forEach(s => {
        let blink = Math.sin(timestamp / 1000 * s.blinkSpeed) * 0.5 + 0.5;
        ctx.fillStyle = activeLevel?.isCustomBoss ? `rgba(255, 50, 50, ${blink})` : `rgba(255, 255, 255, ${blink})`;
        ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    if (gameState === 'PLAYING') {
        let currentTime = WeezerSynth.elapsedTime;
        let currentBarSpeed = rhythmBar.speed;

        rhythmPoints.forEach(pt => {
            let leadTime = rhythmBar.width / currentBarSpeed;
            if (currentTime >= (pt.triggerTime - leadTime) && !pt.spawned) { 
                pt.spawned = true; spawnBullet(pt.direction); 
            }
            if (pt.spawned && !pt.hit) pt.x = rhythmBar.x + ((pt.triggerTime - currentTime) * currentBarSpeed);
        });

        if (activeLevel.isCustomBoss) {
            bossData.rotation += dt * (1.2 + currentPhase * 0.15);
            bossData.pulse = 1 + Math.sin(timestamp / 100) * 0.06;

            if (Math.floor(timestamp / 1000) % 2 === 0) {
                bossData.armExtensionProgress += (1 - bossData.armExtensionProgress) * 0.1;
            } else {
                bossData.armExtensionProgress += (0 - bossData.armExtensionProgress) * 0.1;
            }

            ctx.save(); ctx.translate(400, 300); ctx.rotate(bossData.rotation); ctx.scale(bossData.pulse, bossData.pulse);

            let armCount = 6 + (currentPhase % 4); 
            let extensionDistance = 60 + (bossData.armExtensionProgress * 80);

            for (let i = 0; i < armCount; i++) {
                let angle = (Math.PI * 2 / armCount) * i;
                ctx.save(); ctx.rotate(angle);
                ctx.strokeStyle = '#444'; ctx.lineWidth = 6;
                ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -extensionDistance); ctx.stroke();

                ctx.fillStyle = '#888'; ctx.strokeStyle = '#ff3333'; ctx.lineWidth = 2;
                if (bossData.weaponType === 0) { 
                    ctx.beginPath(); ctx.arc(0, -extensionDistance, 20, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                } else if (bossData.weaponType === 1) { 
                    ctx.beginPath(); ctx.arc(0, -extensionDistance, 15, Math.PI, 0); ctx.stroke();
                } else { 
                    ctx.beginPath(); ctx.moveTo(-10, -extensionDistance); ctx.lineTo(0, -extensionDistance - 25); ctx.lineTo(10, -extensionDistance); ctx.closePath(); ctx.fill(); ctx.stroke();
                }
                ctx.restore();
            }

            ctx.fillStyle = '#2d2d35'; ctx.strokeStyle = '#555'; ctx.lineWidth = 4;
            ctx.fillRect(-45, -45, 90, 90); ctx.strokeRect(-45, -45, 90, 90);
            ctx.fillStyle = '#ff1111'; ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(-4, -4, 4, 0, Math.PI*2); ctx.fill();

            for(let j = 0; j < 2; j++) {
                ctx.save(); ctx.rotate(-bossData.rotation * 2 + (j * Math.PI));
                ctx.fillStyle = '#1e1e24'; ctx.fillRect(70, -12, 24, 24); ctx.restore();
            }
            ctx.restore();
        }

        ctx.fillStyle = 'rgba(25, 10, 10, 0.9)'; ctx.fillRect(rhythmBar.x, rhythmBar.y, rhythmBar.width, rhythmBar.height);
        ctx.strokeStyle = '#ff3333'; ctx.lineWidth = 2; ctx.strokeRect(rhythmBar.x, rhythmBar.y, rhythmBar.width, rhythmBar.height);
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(rhythmBar.x, rhythmBar.y + rhythmBar.height/2, 24, 0, Math.PI*2); ctx.fill(); ctx.stroke();

        rhythmPoints.forEach(pt => {
            if (pt.spawned && !pt.hit && pt.x >= rhythmBar.x - 30) {
                ctx.fillStyle = '#ff2222'; ctx.beginPath(); ctx.arc(pt.x, rhythmBar.y+rhythmBar.height/2, 16, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#fff'; ctx.font = 'bold 15px Arial';
                ctx.fillText(pt.direction==='UP'?'↑':pt.direction==='DOWN'?'↓':pt.direction==='LEFT'?'←':'→', pt.x-6, rhythmBar.y+rhythmBar.height/2+5);
            }
        });

        afterImages.forEach((img, i) => {
            img.delay--;
            if(img.delay <= 0) {
                ctx.save(); ctx.globalAlpha = img.alpha; ctx.fillStyle = 'rgba(255, 30, 30, 0.35)';
                ctx.beginPath(); ctx.arc(img.x, img.y, img.radius, 0, Math.PI*2); ctx.fill(); ctx.restore();
                img.alpha -= 0.1; if(img.alpha <= 0) afterImages.splice(i, 1);
            }
        });

        cat.x += (cat.targetX - cat.x) * 0.25; cat.y += (cat.targetY - cat.y) * 0.25;
        cat.targetX += (400 - cat.targetX) * 0.08; cat.targetY += (300 - cat.targetY) * 0.08;
        cat.squishX += (1 - cat.squishX) * 0.15; cat.squishY += (1 - cat.squishY) * 0.15;

        ctx.save(); ctx.translate(cat.x, cat.y); ctx.scale(cat.squishX, cat.squishY);
        ctx.fillStyle = cat.color; ctx.beginPath(); ctx.arc(0, 0, cat.radius, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#00ffcc'; ctx.beginPath(); ctx.ellipse(-8, -2, 4, 6, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(8, -2, 4, 6, 0, 0, Math.PI*2); ctx.fill();
        ctx.restore();

        let bColor = activeLevel.bulletColor || '#ff0000';
        for(let i = bullets.length - 1; i >= 0; i--) {
            let b = bullets[i]; b.progress += b.speed * dt;
            let bx = b.x + (b.targetX - b.x)*b.progress; let by = b.y + (b.targetY - b.y)*b.progress;
            ctx.fillStyle = bColor; ctx.beginPath(); ctx.arc(bx, by, 9, 0, Math.PI*2); ctx.fill();

            if(b.progress >= 1.0) {
                if(Math.hypot(cat.x - b.targetX, cat.y - b.targetY) < 28) {
                    createParticles(cat.x, cat.y, '#ff1111');
                    playerHealth = Math.max(0, playerHealth - 12); 
                    if(playerHealth <= 0) {
                        alert(`¡Game Over!\nTe quedaste sin vida en la Fase ${currentPhase}`);
                        switchScreen('mainMenu');
                    }
                }
                bullets.splice(i,1);
            }
        }

        ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Arial';
        ctx.fillText(`NIVEL: ${activeLevel.name.toUpperCase()}`, 40, 45);
        ctx.fillStyle = '#ff3333'; ctx.fillText(`FASE: ${currentPhase} / 10`, 40, 75);
        ctx.fillStyle = '#441111'; ctx.fillRect(40, 95, 180, 15);
        ctx.fillStyle = '#ff2222'; ctx.fillRect(40, 95, 180 * (playerHealth / 100), 15);
    }

    for(let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i]; p.x += p.vx; p.y += p.vy; p.alpha -= dt * 2.5;
        if(p.alpha <= 0) { particles.splice(i,1); continue; }
        ctx.fillStyle = p.color; ctx.globalAlpha = p.alpha;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    requestAnimationFrame(coreLoop);
}
requestAnimationFrame(coreLoop);
