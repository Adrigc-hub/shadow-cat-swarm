const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

// --- PERSISTENCIA DE NIVELES ---
let localLevels = JSON.parse(localStorage.getItem('cat_dash_local_levels')) || [];

// --- MOTOR DE AUDIO NATIVO (Sintetizador para evitar bloqueos en iOS/iPad) ---
const AudioEngine = {
    ctx: null,
    isPlaying: false,
    startTime: 0,
    elapsedTime: 0,
    sequence: [],
    nextNoteIndex: 0,

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },

    // Generador de la icónica línea de sintetizador/guitarra de Sweet Dreams
    playTone(freq, type, duration, time) {
        let osc = this.ctx.createOscillator();
        let gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);
        
        gain.gain.setValueAtTime(0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + duration);
    },

    // Generador del golpe de batería (Kick) para marcar el ritmo
    playDrum(time) {
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

    setupWeezerTrack() {
        this.sequence = [];
        // Notas aproximadas de la intro de Sweet Dreams (Cm - Ab - G)
        let melody = [130, 130, 155, 130, 146, 146, 130, 116, 116, 116, 98, 98];
        let time = 0.2;
        
        // Generamos un loop rítmico automatizado de 30 segundos
        for (let loop = 0; loop < 15; loop++) {
            melody.forEach((note, idx) => {
                this.sequence.push({ time: time, freq: note, type: 'triangle', isDrum: idx % 2 === 0 });
                time += 0.25; // Compás continuo
            });
        }
        // Guardamos la duración total calculada
        this.duration = time;
    },

    play() {
        this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        this.isPlaying = true;
        this.startTime = this.ctx.currentTime - this.elapsedTime;
        this.nextNoteIndex = 0;
        
        // Encontrar por dónde iba si se pausó
        while(this.nextNoteIndex < this.sequence.length && this.sequence[this.nextNoteIndex].time < this.elapsedTime) {
            this.nextNoteIndex++;
        }
    },

    pause() {
        this.isPlaying = false;
        if (this.ctx) {
            this.elapsedTime = this.ctx.currentTime - this.startTime;
        }
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

        while (this.nextNoteIndex < this.sequence.length && this.sequence[this.nextNoteIndex].time < now) {
            let note = this.sequence[this.nextNoteIndex];
            this.playTone(note.freq, note.type, 0.2, this.startTime + note.time);
            if (note.isDrum) this.playDrum(this.startTime + note.time);
            this.nextNoteIndex++;
        }
    }
};

// --- ESTRUCTURA DEL NIVEL PRINCIPAL OBLIGATORIO ---
const weezerBeats = [1.2, 2.2, 3.2, 4.2, 5.2, 6.2, 7.2, 8.2, 9.2, 10.2, 11.2, 12.2, 13.2, 14.2, 15.2, 16.2, 17.2, 18.2, 19.2, 20.2];
let globalOnlineLevels = [
    { 
        name: "Sweet Dreams (Weezer)", 
        creator: "Adrigc", 
        bg: "#111a2e", 
        bulletColor: "#00ffff", 
        beats: weezerBeats 
    }
];

let gameState = 'MENU'; 
let activeLevel = null;
let currentScore = 0;
let mappedBeats = [];

// --- ENTIDADES ---
let cat = { x: 400, y: 300, targetX: 400, targetY: 300, radius: 25, color: '#ff007f', squishX: 1, squishY: 1 };
let bullets = [];
let rhythmPoints = [];
let particles = [];
let afterImages = [];

let activeEvent = null;
let eventTimer = 0;

const rhythmBar = { x: 100, y: 510, width: 600, height: 45, speed: 350 };
const DIRECTIONS = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
const DIR_VECTORS = { 'UP': {x: 0, y: -90}, 'DOWN': {x: 0, y: 90}, 'LEFT': {x: -90, y: 0}, 'RIGHT': {x: 90, y: 0} };

// --- NAVEGACIÓN Y MENÚS ---
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
    
    if(screenId === 'mainMenu') { 
        gameState = 'MENU'; 
        AudioEngine.stop();
        document.getElementById('inGameUI').style.display = 'none';
    }
    if(screenId === 'onlineMenu') renderOnlineLevels();
    if(screenId === 'localLevelsMenu') renderLocalLevels();
}
window.switchScreen = switchScreen;

function renderLocalLevels() {
    const list = document.getElementById('localLevelList');
    list.innerHTML = localLevels.length === 0 ? '<div style="text-align:center;color:#888;padding:20px;">No tienes niveles creados.</div>' : '';
    
    localLevels.forEach((lvl, idx) => {
        const item = document.createElement('div');
        item.className = 'level-item';
        item.innerHTML = `<div><strong>${lvl.name}</strong> <span style="color:#00ffcc;font-size:12px;">(${lvl.beats.length} notas)</span></div>`;
        
        const btn = document.createElement('button');
        btn.className = 'btn-action';
        btn.style.background = '#52c234';
        btn.innerText = '▶';
        btn.addEventListener('click', () => playDirectLevel(lvl));
        
        item.appendChild(btn);
        list.appendChild(item);
    });
}

function renderOnlineLevels(filter = "") {
    const list = document.getElementById('onlineLevelList');
    list.innerHTML = "";
    
    const totalDatabase = [...globalOnlineLevels, ...localLevels.map(l => ({...l, creator: "Local"}))];
    const filtered = totalDatabase.filter(l => l.name.toLowerCase().includes(filter.toLowerCase()));

    filtered.forEach(lvl => {
        const item = document.createElement('div');
        item.className = 'level-item';
        item.innerHTML = `<div><strong>${lvl.name}</strong><br><span style="color:#aaa;font-size:12px;">Por: ${lvl.creator}</span></div>`;
        
        const btn = document.createElement('button');
        btn.className = 'btn-action';
        btn.style.background = '#00d2ff';
        btn.innerText = '▶';
        btn.addEventListener('click', () => playDirectLevel(lvl));
        
        item.appendChild(btn);
        list.appendChild(item);
    });
}
window.searchLevels = function() {
    renderOnlineLevels(document.getElementById('searchInput').value);
};

// --- MODO GRABADOR / CREACIÓN DE NIVELES NATIVO ---
window.startRhythmMapping = function() {
    AudioEngine.init();
    activeLevel = {
        name: document.getElementById('levelNameInput').value || "Mi Ritmo Cat",
        bg: document.getElementById('levelBgInput').value,
        bulletColor: document.getElementById('levelBulletColor').value,
        beats: []
    };
    mappedBeats = [];
    switchScreen('none'); 
    gameState = 'MAPPING_EDITOR';
    
    AudioEngine.setupWeezerTrack();
    AudioEngine.play();
};

function saveCreatedLevel() {
    if(mappedBeats.length === 0) {
        alert("¡Toca la pantalla al compás de la música antes de guardar!");
        return;
    }
    activeLevel.beats = [...mappedBeats];
    localLevels.push(activeLevel);
    localStorage.setItem('cat_dash_local_levels', JSON.stringify(localLevels));
    AudioEngine.stop();
    switchScreen('localLevelsMenu');
}

// --- CONFIGURACIÓN DE PARTIDA ---
function playDirectLevel(lvlObj) {
    AudioEngine.init();
    activeLevel = lvlObj;
    
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('inGameUI').style.display = 'block';
    
    currentScore = 0;
    document.getElementById('scoreHUD').innerText = "PUNTOS: 0";
    bullets = []; particles = []; afterImages = []; rhythmPoints = [];
    activeEvent = null; eventTimer = 0;
    gameState = 'PLAYING';

    activeLevel.beats.forEach(t => {
        rhythmPoints.push({ triggerTime: t, direction: DIRECTIONS[Math.floor(Math.random()*4)], spawned: false, hit: false, x: rhythmBar.x + rhythmBar.width });
    });

    AudioEngine.setupWeezerTrack();
    AudioEngine.play();
}

// --- CONTROLES GENERALES (PANTALLA TÁCTIL E INPUTS) ---
let touchStart = { x: 0, y: 0 };
let isInteracting = false;

function handleStart(x, y) {
    if (gameState === 'MAPPING_EDITOR') {
        // Detectar si presionó el botón verde de guardar en pantalla
        if(x >= 250 && x <= 550 && y >= 500 && y <= 550) {
            saveCreatedLevel();
            return;
        }
        mappedBeats.push(AudioEngine.elapsedTime);
        createParticles(x, y, '#00ffcc');
        return;
    }
    touchStart.x = x; touchStart.y = y; isInteracting = true;
}

function handleMove(x, y) {
    if (!isInteracting || gameState !== 'PLAYING') return;
    const dx = x - touchStart.x; const dy = y - touchStart.y;
    if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
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
        if (distance < 50 && pt.direction === dir && !pt.hit && pt.spawned) {
            pt.hit = true; success = true; currentScore += 10;
            document.getElementById('scoreHUD').innerText = "PUNTOS: " + currentScore;
            for(let i=1; i<=3; i++) afterImages.push({ x: cat.x, y: cat.y, alpha: 0.6 - (i*0.15), delay: i*3, radius: cat.radius });
            const vec = DIR_VECTORS[dir]; cat.targetX = 400 + vec.x; cat.targetY = 300 + vec.y;
            cat.squishX = (dir==='LEFT'||dir==='RIGHT')?1.4:0.6; cat.squishY = (dir==='UP'||dir==='DOWN')?1.4:0.6;
            createParticles(pt.x, rhythmBar.y + rhythmBar.height/2, '#00ffcc');
            break;
        }
    }
    if(!success) { cat.color = '#ff3333'; setTimeout(() => cat.color = '#ff007f', 100); }
}

function spawnBullet(dir) {
    let sx = cat.x, sy = cat.y;
    if (dir === 'UP') sy = -20; if (dir === 'DOWN') sy = 620; if (dir === 'LEFT') sx = -20; if (dir === 'RIGHT') sx = 820;
    bullets.push({ x: sx, y: sy, targetX: 400, targetY: 300, progress: 0, speed: 1 / (rhythmBar.width / rhythmBar.speed) });
}

function createParticles(x, y, color) {
    for (let i = 0; i < 8; i++) particles.push({ x, y, vx: (Math.random()-0.5)*6, vy: (Math.random()-0.5)*6, radius: Math.random()*3+2, alpha: 1, color });
}

// --- ASIGNACIÓN DE BOTONES HUD ---
document.getElementById('playBtn').addEventListener('click', () => {
    playDirectLevel(globalOnlineLevels[0]); // Abre inmediatamente Sweet Dreams
});
document.getElementById('pauseBtn').addEventListener('click', () => { 
    if(gameState=='PLAYING'){ gameState='PAUSED'; AudioEngine.pause(); switchScreen('pauseMenu'); } 
});
document.getElementById('resumeBtn').addEventListener('click', () => { 
    document.getElementById('pauseMenu').classList.remove('active'); 
    document.getElementById('inGameUI').style.display='block'; 
    gameState='PLAYING'; 
    AudioEngine.play(); 
});
document.getElementById('exitBtn').addEventListener('click', () => switchScreen('mainMenu'));

// --- LOOP DINÁMICO ---
let lastTime = 0;
function coreLoop(timestamp) {
    let dt = (timestamp - lastTime) / 1000; if(isNaN(dt)) dt = 0; lastTime = timestamp;

    AudioEngine.update();

    ctx.fillStyle = (gameState==='PLAYING'||gameState==='MAPPING_EDITOR') ? activeLevel.bg : '#11111e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'PLAYING') {
        let currentTime = AudioEngine.elapsedTime;
        eventTimer += dt;
        if(eventTimer > 14) {
            eventTimer = 0; activeEvent = Math.random() > 0.5 ? 'SPEED_UP' : 'CEGUERA';
            const al = document.getElementById('eventAlert'); al.innerText = activeEvent==='SPEED_UP'?"¡ACELERACIÓN!":"¡OSCURIDAD!";
            al.style.display = 'block'; setTimeout(() => al.style.display = 'none', 2000);
        }

        let currentBarSpeed = rhythmBar.speed * (activeEvent === 'SPEED_UP' ? 1.35 : 1);

        rhythmPoints.forEach(pt => {
            let leadTime = rhythmBar.width / currentBarSpeed;
            if (currentTime >= (pt.triggerTime - leadTime) && !pt.spawned) { pt.spawned = true; spawnBullet(pt.direction); }
            if (pt.spawned && !pt.hit) pt.x = rhythmBar.x + ((pt.triggerTime - currentTime) * currentBarSpeed);
        });

        // Dibujar Barra de Ritmo
        ctx.fillStyle = 'rgba(30, 30, 50, 0.85)'; ctx.fillRect(rhythmBar.x, rhythmBar.y, rhythmBar.width, rhythmBar.height);
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(rhythmBar.x, rhythmBar.y + rhythmBar.height/2, 25, 0, Math.PI*2); ctx.fill(); ctx.stroke();

        // Notas flotantes
        rhythmPoints.forEach(pt => {
            if (pt.spawned && !pt.hit && pt.x >= rhythmBar.x - 30) {
                ctx.fillStyle = '#00ffff'; ctx.beginPath(); ctx.arc(pt.x, rhythmBar.y+rhythmBar.height/2, 16, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#000'; ctx.font = 'bold 16px Arial';
                ctx.fillText(pt.direction==='UP'?'↑':pt.direction==='DOWN'?'↓':pt.direction==='LEFT'?'←':'→', pt.x-6, rhythmBar.y+rhythmBar.height/2+6);
            }
        });

        // Movimiento de Estelas
        afterImages.forEach((img, i) => {
            img.delay--;
            if(img.delay <= 0) {
                ctx.save(); ctx.globalAlpha = img.alpha; ctx.fillStyle = '#00ffff';
                ctx.beginPath(); ctx.arc(img.x, img.y, img.radius, 0, Math.PI*2); ctx.fill(); ctx.restore();
                img.alpha -= 0.1; if(img.alpha <= 0) afterImages.splice(i, 1);
            }
        });

        // Físicas del Gato
        cat.x += (cat.targetX - cat.x) * 0.2; cat.y += (cat.targetY - cat.y) * 0.2;
        cat.targetX += (400 - cat.targetX) * 0.05; cat.targetY += (300 - cat.targetY) * 0.05;
        cat.squishX += (1 - cat.squishX) * 0.1; cat.squishY += (1 - cat.squishY) * 0.1;

        ctx.save(); ctx.translate(cat.x, cat.y); ctx.scale(cat.squishX, cat.squishY); ctx.fillStyle = cat.color;
        ctx.beginPath(); ctx.arc(0, 0, cat.radius, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-10,-15); ctx.lineTo(-20,-30); ctx.lineTo(-3,-18); ctx.fill();
        ctx.beginPath(); ctx.moveTo(10,-15); ctx.lineTo(20,-30); ctx.lineTo(3,-18); ctx.fill();
        ctx.restore();

        // Ataque de Proyectiles
        let bColor = activeLevel.bulletColor || '#00ffff';
        for(let i=bullets.length-1; i>=0; i--) {
            let b = bullets[i]; b.progress += b.speed * dt;
            let bx = b.x + (b.targetX - b.x)*b.progress; let by = b.y + (b.targetY - b.y)*b.progress;
            ctx.fillStyle = bColor; ctx.beginPath(); ctx.arc(bx, by, 8, 0, Math.PI*2); ctx.fill();

            if(b.progress >= 1.0) {
                if(Math.hypot(cat.x - b.targetX, cat.y - b.targetY) < 32) {
                    createParticles(cat.x, cat.y, '#ff3333'); currentScore = Math.max(0, currentScore - 5);
                    document.getElementById('scoreHUD').innerText = "PUNTOS: " + currentScore;
                }
                bullets.splice(i,1);
            }
        }

        if(activeEvent === 'CEGUERA') {
            ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.beginPath(); ctx.arc(cat.x, cat.y, 120, 0, Math.PI*2); ctx.rect(800,0,-800,600); ctx.fill();
        }

        if(AudioEngine.elapsedTime >= AudioEngine.duration) { 
            alert(`¡Nivel Terminado!\nPuntuación final: ${currentScore}`); 
            switchScreen('mainMenu'); 
        }
    }

    if (gameState === 'MAPPING_EDITOR') {
        ctx.fillStyle = 'white'; ctx.font = '22px Arial';
        ctx.fillText(`Notas capturadas: ${mappedBeats.length}`, 40, 60);
        ctx.fillText(`Tiempo actual: ${AudioEngine.elapsedTime.toFixed(2)}s`, 40, 95);
        ctx.fillText("Toca cualquier parte negra para capturar un ritmo", 40, 140);
        
        ctx.fillStyle = '#52c234'; ctx.fillRect(250, 500, 300, 50);
        ctx.fillStyle = 'white'; ctx.font = 'bold 16px Arial'; ctx.fillText("GUARDAR RITMO", 335, 532);
        
        if(AudioEngine.elapsedTime >= AudioEngine.duration) saveCreatedLevel();
    }

    // Dibujado de partículas de impacto
    for(let i=particles.length-1; i>=0; i--) {
        let p = particles[i]; p.x += p.vx; p.y += p.vy; p.alpha -= dt * 2;
        if(p.alpha <= 0) { particles.splice(i,1); continue; }
        ctx.fillStyle = p.color; ctx.globalAlpha = p.alpha;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    requestAnimationFrame(coreLoop);
}

requestAnimationFrame(coreLoop);
 