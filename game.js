const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

// --- PERSISTENCIA Y CONTENIDOS ---
let localLevels = JSON.parse(localStorage.getItem('cat_dash_local_levels')) || [];

// --- MOTOR DE MÚSICA NATIVO (Sintetizador para evitar bloqueos) ---
const WeezerSynth = {
    ctx: null,
    isPlaying: false,
    startTime: 0,
    elapsedTime: 0,
    sequence: [],
    nextNoteIndex: 0,
    duration: 30,

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },

    // Generador de la icónica línea de sintetizador de Sweet Dreams
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

    // Generador del golpe de batería para marcar el ritmo
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

    setupTrack() {
        this.sequence = [];
        // Notas aproximadas de la intro de Sweet Dreams (Cm - Ab - G)
        let pattern = [130, 130, 155, 130, 146, 146, 130, 116, 116, 116, 98, 98];
        let t = 0.2;
        
        // Generamos un loop continuo de 30 segundos
        for (let loop = 0; loop < 15; loop++) {
            pattern.forEach((freq, idx) => {
                this.sequence.push({ time: t, freq: freq, type: 'triangle', isKick: idx % 2 === 0 });
                t += 0.25; // Compás continuo
            });
        }
        this.duration = t;
    },

    play() {
        this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        this.isPlaying = true;
        this.startTime = this.ctx.currentTime - this.elapsedTime;
        this.nextNoteIndex = 0;
        while(this.nextNoteIndex < this.sequence.length && this.sequence[this.nextNoteIndex].time < this.elapsedTime) {
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

        while (this.nextNoteIndex < this.sequence.length && this.sequence[this.nextNoteIndex].time < now) {
            let note = this.sequence[this.nextNoteIndex];
            this.playTone(note.freq, note.type, 0.2, this.startTime + note.time);
            if (note.isKick) {
                this.playDrumKick(this.startTime + note.time);
                // Columnas de decoración reaccionan al ritmo
                level1Pillars.forEach(p => p.targetH = Math.random() * p.maxH + 50);
            }
            this.nextNoteIndex++;
        }
    }
};

// --- CONFIGURACIÓN DE NIVELES (6 niveles en total) ---
const baseBeats = [1.2, 2.2, 3.2, 4.2, 5.2, 6.2, 7.2, 8.2, 9.2, 10.2, 11.2, 12.2, 13.2, 14.2, 15.2, 16.2, 17.2, 18.2, 19.2, 20.2];
let globalOnlineLevels = [
    { name: "Sweet Dreams (Weezer)", creator: "Adrigc", bg: "#0a0a14", bulletColor: "#00e5ff", beats: [...baseBeats], deco: [] },
    { name: "Cat Step", creator: "System", bg: "#0d1f11", bulletColor: "#ffaa00", beats: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], deco: [] },
    { name: "Sombra Realm", creator: "System", bg: "#340034", bulletColor: "#ff00ff", beats: [0.5, 1, 1.5, 2, 3, 3.5, 4, 5], deco: [] },
    { name: "Nivel 4: Rush", creator: "System", bg: "#161623", bulletColor: "#00ffff", beats: [1, 1.2, 2, 2.2, 3, 3.2, 4, 4.2, 5, 5.2], deco: [] },
    { name: "Nivel 5: Chill", creator: "System", bg: "#0a0a14", bulletColor: "#ffffff", beats: [2, 4, 6, 8, 10], deco: [] },
    { name: "Nivel 6: Boss", creator: "System", bg: "#111a2e", bulletColor: "#ff0000", beats: [1, 1.1, 1.2, 1.3, 2, 2.1, 2.2, 2.3], deco: [] }
];

let gameState = 'MENU'; 
let activeLevel = null;
let currentScore = 0;
let mappedBeats = [];
let mappedDecorations = []; 
let editorSubMode = 'RHYTHM'; // 'RHYTHM' o 'DECO'

// Elementos decorativos del fondo del nivel 1
const level1Stars = [];
for(let i=0; i<40; i++) {
    level1Stars.push({ x: Math.random()*800, y: Math.random()*600, size: Math.random()*3+1, blinkSpeed: Math.random()*2+1 });
}
const level1Pillars = [
    { x: 150, width: 60, h: 0, maxH: 400, targetH: 0, color: 'rgba(0, 255, 255, 0.1)' },
    { x: 300, width: 80, h: 0, maxH: 300, targetH: 0, color: 'rgba(255, 0, 255, 0.08)' },
    { x: 500, width: 80, h: 0, maxH: 300, targetH: 0, color: 'rgba(255, 0, 255, 0.08)' },
    { x: 650, width: 60, h: 0, maxH: 400, targetH: 0, color: 'rgba(0, 255, 255, 0.1)' }
];

// --- ENTIDADES (Skin de Megumi) ---
let cat = { 
    x: 400, y: 300, targetX: 400, targetY: 300, radius: 24, 
    color: '#1a1a26', // Cuerpo negro/sombra oscuro
    squishX: 1, squishY: 1, tailAngle: 0 
};
let bullets = []; let rhythmPoints = []; let particles = []; let afterImages = [];
let activeEvent = null; let eventTimer = 0;
const rhythmBar = { x: 100, y: 510, width: 600, height: 45, speed: 360 };
const DIRECTIONS = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
const DIR_VECTORS = { 'UP': {x: 0, y: -90}, 'DOWN': {x: 0, y: 90}, 'LEFT': {x: -90, y: 0}, 'RIGHT': {x: 90, y: 0} };

// --- NAVEGACIÓN Y MENÚS ---
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) targetScreen.classList.add('active');
    
    if(screenId === 'mainMenu') { 
        gameState = 'MENU'; 
        WeezerSynth.stop();
        document.getElementById('inGameUI').style.display = 'none';
        document.getElementById('editorUI').style.display = 'none';
    }
    if(screenId === 'onlineMenu') renderOnlineLevels();
    if(screenId === 'localLevelsMenu') renderLocalLevels();
}
window.switchScreen = switchScreen;

function renderLocalLevels() {
    const list = document.getElementById('localLevelList');
    list.innerHTML = localLevels.length === 0 ? '<div style="text-align:center;color:#777;padding:20px;">No tienes niveles creados.</div>' : '';
    localLevels.forEach((lvl, idx) => {
        const item = document.createElement('div');
        item.className = 'level-item';
        item.innerHTML = `<div><strong>${lvl.name}</strong> <span style="color:#00ffcc;font-size:12px;">(${lvl.beats.length} n / ${lvl.deco?.length || 0} d)</span></div>`;
        const btn = document.createElement('button');
        btn.className = 'btn-action'; btn.style.background = '#52c234'; btn.innerText = '▶';
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
        item.innerHTML = `<div><strong>${lvl.name}</strong><br><span style="color:#888;font-size:12px;">Por: ${lvl.creator}</span></div>`;
        const btn = document.createElement('button');
        btn.className = 'btn-action'; btn.style.background = '#00d2ff'; btn.innerText = '▶';
        btn.addEventListener('click', () => playDirectLevel(lvl));
        item.appendChild(btn);
        list.appendChild(item);
    });
}
window.searchLevels = function() { renderOnlineLevels(document.getElementById('searchInput').value); };

// --- MODO GRABADOR / EDITOR DE NIVELES ---
window.startRhythmMapping = function() {
    WeezerSynth.init();
    activeLevel = {
        name: document.getElementById('levelNameInput').value || "Mi Creación",
        bg: document.getElementById('levelBgInput').value,
        bulletColor: document.getElementById('levelBulletColor').value,
        beats: [],
        deco: []
    };
    mappedBeats = [];
    mappedDecorations = [];
    editorSubMode = 'RHYTHM';
    
    switchScreen('none'); 
    document.getElementById('editorUI').style.display = 'block';
    updateEditorTabs();
    gameState = 'MAPPING_EDITOR';
    
    WeezerSynth.setupTrack();
    WeezerSynth.play();
};

window.setEditorMode = function(mode) {
    editorSubMode = mode;
    updateEditorTabs();
};

function updateEditorTabs() {
    document.getElementById('btnTabRhythm').classList.toggle('active-tab', editorSubMode === 'RHYTHM');
    document.getElementById('btnTabDeco').classList.toggle('active-tab', editorSubMode === 'DECO');
}

window.triggerSaveEditor = function() {
    saveCreatedLevel();
};

function saveCreatedLevel() {
    if(mappedBeats.length === 0 && mappedDecorations.length === 0) return alert("¡Añade algunos ritmos o decoraciones!");
    activeLevel.beats = [...mappedBeats];
    activeLevel.deco = [...mappedDecorations];
    localLevels.push(activeLevel);
    localStorage.setItem('cat_dash_local_levels', JSON.stringify(localLevels));
    WeezerSynth.stop();
    document.getElementById('editorUI').style.display = 'none';
    switchScreen('localLevelsMenu');
}

// --- JUGAR NIVEL ---
function playDirectLevel(lvlObj) {
    WeezerSynth.init();
    activeLevel = lvlObj;
    switchScreen('none');
    document.getElementById('inGameUI').style.display = 'block';
    
    currentScore = 0;
    document.getElementById('scoreHUD').innerText = "PUNTOS: 0";
    bullets = []; particles = []; afterImages = []; rhythmPoints = [];
    activeEvent = null; eventTimer = 0;
    gameState = 'PLAYING';

    activeLevel.beats.forEach(t => {
        rhythmPoints.push({ triggerTime: t, direction: DIRECTIONS[Math.floor(Math.random()*4)], spawned: false, hit: false, x: rhythmBar.x + rhythmBar.width });
    });

    WeezerSynth.setupTrack();
    WeezerSynth.play();
}

// --- CONTROLES MÓVILES (Swipes e Inputs) ---
let touchStart = { x: 0, y: 0 };
let isInteracting = false;

function handleStart(x, y) {
    if (gameState === 'MAPPING_EDITOR') {
        if(editorSubMode === 'RHYTHM') {
            mappedBeats.push(WeezerSynth.elapsedTime);
            createParticles(x, y, '#00ffcc');
        } else if(editorSubMode === 'DECO') {
            // Guarda una cruz decorativa en las coordenadas tocadas
            mappedDecorations.push({ x, y, time: WeezerSynth.elapsedTime, size: Math.random()*20+10 });
            createParticles(x, y, '#ff00ff');
        }
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
            for(let i=1; i<=3; i++) afterImages.push({ x: cat.x, y: cat.y, alpha: 0.5 - (i*0.1), delay: i*3, radius: cat.radius });
            const vec = DIR_VECTORS[dir]; cat.targetX = 400 + vec.x; cat.targetY = 300 + vec.y;
            cat.squishX = (dir=='LEFT'||dir=='RIGHT')?1.4:0.6; cat.squishY = (dir=='UP'||dir=='DOWN')?1.4:0.6;
            createParticles(pt.x, rhythmBar.y + rhythmBar.height/2, '#00ffff');
            break;
        }
    }
    if(!success) { cat.color = '#ff3333'; setTimeout(() => cat.color = '#1a1a26', 100); }
}

function spawnBullet(dir) {
    let sx = cat.x, sy = cat.y;
    if (dir === 'UP') sy = -20; if (dir === 'DOWN') sy = 620; if```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Dash Cat: Rhythm Evolved</title>
    <link rel="stylesheet" href="style.css">
    <style>
        /* Estilos rápidos para las pestañas de control del editor incorporado */
        #editorUI { display: none; position: absolute; top: 15px; right: 15px; left: 15px; z-index: 99; pointer-events: none; }
        .editor-bar { display: flex; justify-content: space-between; pointer-events: auto; background: rgba(10,10,20,0.9); padding: 10px; border-radius: 8px; border: 2px solid #52c234; }
        .tab-btn { background: #222; color: #fff; border: 1px solid #444; padding: 10px 15px; font-weight: bold; font-size: 14px; border-radius: 4px; cursor: pointer; }
        .tab-btn.active-tab { background: #00e5ff; color: #000; border-color: #fff; }
        .save-btn { background: #52c234; color: white; border: none; padding: 10px 20px; font-weight: bold; border-radius: 4px; cursor: pointer; }
    </style>
</head>
<body>

<div id="gameContainer">
    <canvas id="gameCanvas"></canvas>

    <div id="editorUI">
        <div class="editor-bar">
            <div style="display:flex; gap:10px;">
                <button id="btnTabRhythm" class="tab-btn active-tab" onclick="setEditorMode('RHYTHM')">🎵 Añadir Ritmos</button>
                <button id="btnTabDeco" class="tab-btn" onclick="setEditorMode('DECO')">✨ Añadir Decoración</button>
            </div>
            <button class="save-btn" onclick="triggerSaveEditor()">💾 Guardar Todo</button>
        </div>
    </div>

    <div id="inGameUI">
        <div id="scoreHUD">PUNTOS: 0</div>
        <div id="eventAlert">¡ALERTA!</div>
        <button class="hud-btn" id="pauseBtn">║</button>
    </div>

    <div id="mainMenu" class="screen active">
        <h1 class="gd-title">Dash Cat<br><span style="font-size:24px; color:#00ffcc;">Custom Engine</span></h1>
        <div class="menu-row">
            <button class="gd-btn sub" onclick="switchScreen('onlineMenu')">🔍</button>
            <button class="gd-btn green" id="playBtn">▶</button>
            <button class="gd-btn sub" onclick="switchScreen('localLevelsMenu')">🛠️</button>
        </div>
    </div>

    <div id="pauseMenu" class="screen">
        <h2 class="gd-title" style="font-size:40px;">PAUSA</h2>
        <div class="menu-row">
            <button class="gd-btn green" id="resumeBtn">▶</button>
            <button class="gd-btn" id="exitBtn" style="background:linear-gradient(to bottom, #ff3333, #aa0000); box-shadow:0 8px 0 #550000;">✖</button>
        </div>
    </div>

    <div id="onlineMenu" class="screen">
        <div class="gd-window">
            <button class="close-btn" onclick="switchScreen('mainMenu')">X</button>
            <div class="window-title">BUSCAR NIVELES EN RED</div>
            <div class="search-bar">
                <input type="text" id="searchInput" placeholder="Escribe el nombre del mapa...">
                <button class="btn-action" onclick="searchLevels()">Buscar</button>
            </div>
            <div class="level-list" id="onlineLevelList"></div>
        </div>
    </div>

    <div id="localLevelsMenu" class="screen">
        <div class="gd-window">
            <button class="close-btn" onclick="switchScreen('mainMenu')">X</button>
            <div class="window-title">MIS CREACIONES</div>
            <div style="margin-bottom:15px; display:flex; justify-content:flex-end;">
                <button class="btn-action" style="background:#52c234; color:white;" onclick="switchScreen('editorSetupMenu')">¡NUEVO!</button>
            </div>
            <div class="level-list" id="localLevelList"></div>
        </div>
    </div>

    <div id="editorSetupMenu" class="screen">
        <div class="gd-window">
            <button class="close-btn" onclick="switchScreen('localLevelsMenu')">X</button>
            <div class="window-title">NUEVO RITMO</div>
            <div class="editor-form">
                <div class="form-group">
                    <label>Nombre del Mapa:</label>
                    <input type="text" id="levelNameInput" value="Cat Step Pro">
                </div>
                <div class="form-group">
                    <label>Color de Escenario:</label>
                    <select id="levelBgInput">
                        <option value="#111a2e">Espacio Siniestro</option>
                        <option value="#340034">Dimensión Violeta</option>
                        <option value="#0d1f11">Laboratorio Ácido</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Color de Proyectiles:</label>
                    <select id="levelBulletColor">
                        <option value="#00ffff">Plasma Eléctrico</option>
                        <option value="#ffaa00">Fuego Atómico</option>
                        <option value="#ff00ff">Destello Carmesí</option>
                    </select>
                </div>
                <button class="btn-action" style="background:#00e5ff; margin-top:20px;" onclick="startRhythmMapping()">Grabar Notas en Vivo</button>
            </div>
        </div>
    </div>
</div>

<script src="game.js"></script>
</body>
</html>
