const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

// --- PERSISTENCIA Y CONTENIDOS ---
let localLevels = JSON.parse(localStorage.getItem('cat_dash_local_levels')) || [];

// Canción principal solicitada: Sweet Dreams - Weezer (Link de respaldo de audio)
const weezerTrack = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"; 

let globalOnlineLevels = [
    { 
        name: "Sweet Dreams (Weezer)", 
        creator: "Adrigc", 
        bg: "#161623", 
        bulletColor: "#00ffff", 
        track: weezerTrack, 
        // Golpes rítmicos sincronizados con la intro y los versos de la canción
        beats: [1.2, 2.4, 3.6, 4.8, 6.0, 7.2, 8.4, 9.6, 11.0, 12.2, 13.5, 14.8, 16.0, 17.2, 18.5, 20.0] 
    },
    { 
        name: "Voxicat Madness", 
        creator: "GD_Community", 
        bg: "#340034", 
        bulletColor: "#ff00ff", 
        track: weezerTrack, 
        beats: [0.5, 1.0, 1.5, 2.0, 2.8, 3.5, 4.0, 4.5, 5.2, 6.0] 
    }
];

let currentAudio = new Audio();
currentAudio.crossOrigin = "anonymous"; 

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

const rhythmBar = { x: 100, y: 510, width: 600, height: 45, speed: 380 };
const DIRECTIONS = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
const DIR_VECTORS = { 'UP': {x: 0, y: -90}, 'DOWN': {x: 0, y: 90}, 'LEFT': {x: -90, y: 0}, 'RIGHT': {x: 90, y: 0} };

// --- GESTIÓN DE PANTALLAS (CORREGIDO PARA EVITAR FALLOS) ---
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
    
    if(screenId === 'mainMenu') { 
        gameState = 'MENU'; 
        currentAudio.pause(); 
        document.getElementById('inGameUI').style.display = 'none';
    }
    if(screenId === 'onlineMenu') renderOnlineLevels();
    if(screenId === 'localLevelsMenu') renderLocalLevels();
}

// Hacer la función accesible globalmente para los botones HTML antiguos
window.switchScreen = switchScreen;

function renderLocalLevels() {
    const list = document.getElementById('localLevelList');
    list.innerHTML = localLevels.length === 0 ? '<div style="text-align:center;color:#666;padding:20px;">No tienes niveles creados.</div>' : '';
    
    localLevels.forEach((lvl, idx) => {
        const item = document.createElement('div');
        item.className = 'level-item';
        item.innerHTML = `<div><strong>${lvl.name}</strong> <span style="color:#00ffcc;font-size:12px;">(${lvl.beats.length} notas)</span></div>`;
        
        const btn = document.createElement('button');
        btn.className = 'btn-action';
        btn.style.background = '#52c234';
        btn.innerText = '▶';
        btn.addEventListener('click', () => playSelectedLevel(idx, 'local'));
        
        item.appendChild(btn);
        list.appendChild(item);
    });
}

function renderOnlineLevels(filter = "") {
    const list = document.getElementById('onlineLevelList');
    list.innerHTML = "";
    
    const totalDatabase = [...globalOnlineLevels, ...localLevels.map(l => ({...l, creator: "MiAppLocal"}))];
    const filtered = totalDatabase.filter(l => l.name.toLowerCase().includes(filter.toLowerCase()));

    if(filtered.length === 0) {
        list.innerHTML = '<div style="text-align:center;color:#666;padding:20px;">Sin resultados globales.</div>';
        return;
    }

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

// --- MODO EDITOR EN VIVO ---
window.startRhythmMapping = function() {
    activeLevel = {
        name: document.getElementById('levelNameInput').value || "Nuevo Nivel",
        track: document.getElementById('levelAudioInput').value || weezerTrack,
        bg: document.getElementById('levelBgInput').value,
        bulletColor: document.getElementById('levelBulletColor').value,
        beats: []
    };
    mappedBeats = [];
    switchScreen('none'); // Oculta las demás interfaces
    gameState = 'MAPPING_EDITOR';
    
    currentAudio.src = activeLevel.track;
    currentAudio.load();
    currentAudio.play().catch(() => {
        currentAudio.src = weezerTrack;
        currentAudio.play();
    });
};

function saveCreatedLevel() {
    if(mappedBeats.length === 0) return alert("¡Toca la pantalla al ritmo antes de guardar!");
    activeLevel.beats = [...mappedBeats];
    localLevels.push(activeLevel);
    localStorage.setItem('cat_dash_local_levels', JSON.stringify(localLevels));
    currentAudio.pause();
    switchScreen('localLevelsMenu');
}

// --- GAMEPLAY MOTOR ---
function playSelectedLevel(index, type) {
    activeLevel = type === 'local' ? localLevels[index] : globalOnlineLevels[index];
    initGameplay();
}

function playDirectLevel(lvlObj) {
    activeLevel = lvlObj;
    initGameplay();
}

function initGameplay() {
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

    currentAudio.src = activeLevel.track;
    currentAudio.load();
    currentAudio.play().catch(() => {
        currentAudio.src = weezerTrack;
        currentAudio.play();
    });
}

// --- CONTROLES MÓVILES / MOUSE ---
let touchStart = { x: 0, y: 0 };
let isInteracting = false;

function handleStart(x, y) {
    if (gameState === 'MAPPING_EDITOR') {
        if(x >= 250 && x <= 550 && y >= 500 && y <= 550) return saveCreatedLevel();
        mappedBeats.push(currentAudio.currentTime);
        createParticles(x, y, '#00ffcc');
        return;
    }
    touchStart.x = x; touchStart.y = y; isInteracting = true;
}

function handleMove(x, y) {
    if (!isInteracting || gameState !== 'PLAYING') return;
    const dx = x - touchStart.x; const dy = y - touchStart.y;
    if (Math.abs(dx) > 35 || Math.abs(dy) > 35) {
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
        if (distance < 45 && pt.direction === dir && !pt.hit && pt.spawned) {
            pt.hit = true; success = true; currentScore += 10;
            document.getElementById('scoreHUD').innerText = "PUNTOS: " + currentScore;
            for(let i=1; i<=3; i++) afterImages.push({ x: cat.x, y: cat.y, alpha: 0.6 - (i*0.15), delay: i*3, radius: cat.radius });
            const vec = DIR_VECTORS[dir]; cat.targetX = 400 + vec.x; cat.targetY = 300 + vec.y;
            cat.squishX = (dir==='LEFT'||dir==='RIGHT')?1.5:0.5; cat.squishY = (dir==='UP'||dir==='DOWN')?1.5:0.5;
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
    for (let i = 0; i < 8; i++) particles.push({ x, y, vx: (Math.random()-0.5)*7, vy: (Math.random()-0.5)*7, radius: Math.random()*4+2, alpha: 1, color });
}

// --- VÍNCULOS SEGUROS CON LOS BOTONES DE LA INTERFAZ ---
document.getElementById('playBtn').addEventListener('click', () => {
    // El botón verde central ahora abre directamente el nivel de Weezer
    playDirectLevel(globalOnlineLevels[0]);
});

document.getElementById('pauseBtn').addEventListener('click', () => { 
    if(gameState==='PLAYING'){ gameState='PAUSED'; currentAudio.pause(); switchScreen('pauseMenu'); } 
});

document.getElementById('resumeBtn').addEventListener('click', () => { 
    document.getElementById('pauseMenu').classList.remove('active'); 
    document.getElementById('inGameUI').style.display='block'; 
    gameState='PLAYING'; 
    currentAudio.play(); 
});

document.getElementById('exitBtn').addEventListener('click', () => switchScreen('mainMenu'));

// --- BUCLE CENTRAL DE ACTUALIZACIÓN ---
let lastTime = 0;
function coreLoop(timestamp) {
    let dt = (timestamp - lastTime) / 1000; if(isNaN(dt)) dt = 0; lastTime = timestamp;

    ctx.fillStyle = (gameState==='PLAYING'||gameState==='MAPPING_EDITOR') ? activeLevel.bg : '#11111e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'PLAYING') {
        let currentTime = currentAudio.currentTime;
        eventTimer += dt;
        if(eventTimer > 12) {
            eventTimer = 0; activeEvent = Math.random() > 0.5 ? 'SPEED_UP' : 'CEGUERA';
            const al = document.getElementById('eventAlert'); al.innerText = activeEvent==='SPEED_UP'?"¡ACELERACIÓN!":"¡OSCURIDAD!";
            al.style.display = 'block'; setTimeout(() => al.style.display = 'none', 2500);
        }

        let currentBarSpeed = rhythmBar.speed * (activeEvent === 'SPEED_UP' ? 1.35 : 1);

        rhythmPoints.forEach(pt => {
            let leadTime = rhythmBar.width / currentBarSpeed;
            if (currentTime >= (pt.triggerTime - leadTime) && !pt.spawned) { pt.spawned = true; spawnBullet(pt.direction); }
            if (pt.spawned && !pt.hit) pt.x = rhythmBar.x + ((pt.triggerTime - currentTime) * currentBarSpeed);
        });

        // Dibujar Barra
        ctx.fillStyle = 'rgba(40, 40, 60, 0.8)'; ctx.fillRect(rhythmBar.x, rhythmBar.y, rhythmBar.width, rhythmBar.height);
        ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(rhythmBar.x, rhythmBar.y + rhythmBar.height/2, 30, 0, Math.PI*2); ctx.fill(); ctx.stroke();

        // Notas
        rhythmPoints.forEach(pt => {
            if (pt.spawned && !pt.hit && pt.x >= rhythmBar.x - 30) {
                ctx.fillStyle = '#00e5ff'; ctx.beginPath(); ctx.arc(pt.x, rhythmBar.y+rhythmBar.height/2, 18, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#000'; ctx.font = 'bold 18px Arial';
                ctx.fillText(pt.direction==='UP'?'↑':pt.direction==='DOWN'?'↓':pt.direction==='LEFT'?'←':'→', pt.x-7, rhythmBar.y+rhythmBar.height/2+6);
            }
        });

        // Estelas (After images)
        afterImages.forEach((img, i) => {
            img.delay--;
            if(img.delay <= 0) {
                ctx.save(); ctx.globalAlpha = img.alpha; ctx.fillStyle = '#00e5ff';
                ctx.beginPath(); ctx.arc(img.x, img.y, img.radius, 0, Math.PI*2); ctx.fill(); ctx.restore();
                img.alpha -= 0.08; if(img.alpha <= 0) afterImages.splice(i, 1);
            }
        });

        // Lerp del Gato
        cat.x += (cat.targetX - cat.x) * 0.22; cat.y += (cat.targetY - cat.y) * 0.22;
        cat.targetX += (400 - cat.targetX) * 0.06; cat.targetY += (300 - cat.targetY) * 0.06;
        cat.squishX += (1 - cat.squishX) * 0.12; cat.squishY += (1 - cat.squishY) * 0.12;

        ctx.save(); ctx.translate(cat.x, cat.y); ctx.scale(cat.squishX, cat.squishY); ctx.fillStyle = cat.color;
        ctx.beginPath(); ctx.arc(0, 0, cat.radius, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-12,-15); ctx.lineTo(-22,-32); ctx.lineTo(-4,-20); ctx.fill();
        ctx.beginPath(); ctx.moveTo(12,-15); ctx.lineTo(22,-32); ctx.lineTo(4,-20); ctx.fill();
        ctx.restore();

        // Proyectiles
        let bColor = activeLevel.bulletColor || '#ffaa00';
        for(let i=bullets.length-1; i>=0; i--) {
            let b = bullets[i]; b.progress += b.speed * dt;
            let bx = b.x + (b.targetX - b.x)*b.progress; let by = b.y + (b.targetY - b.y)*b.progress;
            ctx.fillStyle = bColor; ctx.shadowColor = bColor; ctx.shadowBlur = 10;
            ctx.beginPath(); ctx.arc(bx, by, 9, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;

            if(b.progress >= 1.0) {
                if(Math.hypot(cat.x - b.targetX, cat.y - b.targetY) < 35) {
                    createParticles(cat.x, cat.y, '#ff0000'); currentScore = Math.max(0, currentScore - 6);
                    document.getElementById('scoreHUD').innerText = "PUNTOS: " + currentScore;
                }
                bullets.splice(i,1);
            }
        }

        if(activeEvent === 'CEGUERA') {
            ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.beginPath(); ctx.arc(cat.x, cat.y, 135, 0, Math.PI*2); ctx.rect(800,0,-800,600); ctx.fill();
        }

        if(currentAudio.ended) { alert(`¡Completado!\nScore: ${currentScore}`); switchScreen('mainMenu'); }
    }

    if (gameState === 'MAPPING_EDITOR') {
        ctx.fillStyle = 'white'; ctx.font = '20px Arial';
        ctx.fillText(`Notas capturadas: ${mappedBeats.length}`, 30, 50);
        ctx.fillText(`Tiempo: ${currentAudio.currentTime.toFixed(2)}s`, 30, 80);
        ctx.fillStyle = '#52c234'; ctx.fillRect(250, 500, 300, 50);
        ctx.fillStyle = 'white'; ctx.fillText("GUARDAR RITMO", 330, 532);
        if(currentAudio.ended) saveCreatedLevel();
    }

    // Partículas
    for(let i=particles.length-1; i>=0; i--) {
        let p = particles[i]; p.x += p.vx; p.y += p.vy; p.alpha -= dt * 2.2;
        if(p.alpha <= 0) { particles.splice(i,1); continue; }
        ctx.fillStyle = p.color; ctx.globalAlpha = p.alpha;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    requestAnimationFrame(coreLoop);
}

requestAnimationFrame(coreLoop);

