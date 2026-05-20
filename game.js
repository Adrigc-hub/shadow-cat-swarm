const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resize() { canvas.width = 1280; canvas.height = 720; }
resize(); window.addEventListener('resize', resize);

let currentLevel = 0; 
let menu = new GDMenu(canvas, ctx, launchLevel);
let boss = null;

// Ubicación exacta del jugador en el centro geométrico de la pantalla
const centerX = 1280 / 2;
const centerY = 720 / 2;

let score = 0;
let incomingNotes = []; // Notas/Obstáculos que viajan hacia el centro
let noteSymbols = { left: "◀", up: "▲", right: "▶", down: "▼" };
let hitZoneRadius = 75; // Rango circular de impacto alrededor de Pixie

let dragStart = { x: 0, y: 0 };

function launchLevel(lvlNum) {
    currentLevel = lvlNum;
    score = 0; incomingNotes = [];
    
    if (lvlNum === 5) {
        boss = new BossLevel(canvas, ctx);
    }

    // Generador de ráfagas rítmicas multidireccionales (Llegan desde los 4 flancos)
    for (let i = 0; i < 100; i++) {
        let directions = ["left", "up", "right", "down"];
        let dir = directions[Math.floor(Math.random() * directions.length)];
        
        // Coordenadas de inicio lejanas (fuera de la pantalla)
        let spawnX = centerX, spawnY = centerY;
        if (dir === "left")  spawnX = centerX - 700 - (i * 200);
        if (dir === "right") spawnX = centerX + 700 + (i * 200);
        if (dir === "up")    spawnY = centerY - 500 - (i * 200);
        if (dir === "down")  spawnY = centerY + 500 + (i * 200);

        incomingNotes.push({
            x: spawnX,
            y: spawnY,
            dir: dir,
            dist: Math.hypot(spawnX - centerX, spawnY - centerY),
            resolved: false
        });
    }
}

// --- PROCESADOR DE SWIPES (MOUSE / PANTALLA TÁCTIL IPAD) ---
function onSwipeStart(x, y) { dragStart.x = x; dragStart.y = y; }

function onSwipeEnd(x, y) {
    let dx = x - dragStart.x; let dy = y - dragStart.y;
    let threshold = 25;
    let swipedDir = null;

    if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) > threshold) swipedDir = dx > 0 ? "right" : "left";
    } else {
        if (Math.abs(dy) > threshold) swipedDir = dy > 0 ? "down" : "up";
    }

    if (swipedDir) checkNoteHit(swipedDir);
}

function checkNoteHit(dir) {
    // Buscar la nota más cercana al anillo de impacto de Pixie
    let target = incomingNotes.find(n => !n.resolved && Math.abs(n.dist - hitZoneRadius) < 50);

    if (target && target.dir === dir) {
        target.resolved = true;
        score += 150;
        if (currentLevel === 5 && boss) {
            boss.health -= 1.8; // Desgasta la fase del jefe
        }
    }
}

// Vinculación de periféricos
canvas.addEventListener('mousedown', e => {
    let r = canvas.getBoundingClientRect();
    let mx = (e.clientX - r.left) * (canvas.width / r.width);
    let my = (e.clientY - r.top) * (canvas.height / r.height);
    if(currentLevel === 0) menu.click(mx, my); else onSwipeStart(mx, my);
});
canvas.addEventListener('mouseup', e => {
    if(currentLevel === 0) { menu.isDraggingMusic = false; menu.isDraggingSFX = false; }
    else {
        let r = canvas.getBoundingClientRect();
        onSwipeEnd((e.clientX - r.left) * (canvas.width / r.width), (e.clientY - r.top) * (canvas.height / r.height));
    }
});
canvas.addEventListener('mousemove', e => {
    if (currentLevel === 0 && (menu.isDraggingMusic || menu.isDraggingSFX)) {
        let r = canvas.getBoundingClientRect();
        menu.moveSlider((e.clientX - r.left) * (canvas.width / r.width));
    }
});

// Toques nativos de iPad
canvas.addEventListener('touchstart', e => {
    let r = canvas.getBoundingClientRect();
    let tx = (e.touches[0].clientX - r.left) * (canvas.width / r.width);
    let ty = (e.touches[0].clientY - r.top) * (canvas.height / r.height);
    if(currentLevel === 0) menu.click(tx, ty); else onSwipeStart(tx, ty);
});
canvas.addEventListener('touchend', e => {
    if (currentLevel > 0 && e.changedTouches.length > 0) {
        let r = canvas.getBoundingClientRect();
        onSwipeEnd((e.changedTouches[0].clientX - r.left) * (canvas.width / r.width), (e.changedTouches[0].clientY - r.top) * (canvas.height / r.height));
    }
});

// --- DIBUJAR A PIXIE (FABULOUS BEASTS) ---
function drawPixie(x, y) {
    ctx.save();
    ctx.translate(x, y);

    let pulse = Math.sin(Date.now() * 0.008);

    // 1. Alas mágicas traseras traslúcidas (Destellos de polvo de hada)
    ctx.fillStyle = "rgba(0, 255, 200, 0.4)";
    ctx.beginPath();
    ctx.ellipse(-30, -10 + pulse*4, 15, 35, Math.PI/4, 0, Math.PI*2);
    ctx.ellipse(30, -10 + pulse*4, 15, 35, -Math.PI/4, 0, Math.PI*2);
    ctx.fill();

    // 2. Cuerpo base de Pixie (Sombra estilizada mística)
    ctx.fillStyle = "#1e1e2f"; ctx.strokeStyle = "#00ffcc"; ctx.lineWidth = 3;
    ctx.fillRect(-22, -22, 44, 44); ctx.strokeRect(-22, -22, 44, 44);

    // 3. Orejas puntiagudas distintivas
    ctx.fillStyle = "#1e1e2f"; ctx.beginPath();
    ctx.moveTo(-22, -22); ctx.lineTo(-28, -42); ctx.lineTo(-8, -22); ctx.fill();
    ctx.moveTo(22, -22); ctx.lineTo(28, -42); ctx.lineTo(8, -22); ctx.fill();

    // 4. Ojos neón encendidos y Gema del Alma central
    ctx.fillStyle = "#00ffcc";
    ctx.fillRect(-12, -8, 6, 6); ctx.fillRect(6, -8, 6, 6); // Ojos
    
    // Gema de poder en el pecho (Rombo)
    ctx.fillStyle = "#ff0077"; ctx.beginPath();
    ctx.moveTo(0, 5); ctx.lineTo(8, 12); ctx.lineTo(0, 19); ctx.lineTo(-8, 12);
    ctx.closePath(); ctx.fill();

    ctx.restore();
}

// --- LOOP PRINCIPAL DE RENDERIZADO OMNIDIRECCIONAL ---
function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentLevel === 0) {
        menu.update(); menu.render();
    } else {
        // Ejecutar fondo del escenario según corresponda
        if (currentLevel === 5 && boss) {
            boss.update();
            boss.render(centerX, centerY);
            if (boss.health <= 0) {
                alert("¡Nivel FUN TIME superado con Pixie!");
                currentLevel = 0; menu.screen = "main";
            }
        } else {
            // Niveles 1-4: Fondos neón espaciales rítmicos estilo arena
            let bgs = ["#0a1128", "#1c0a26", "#051c12", "#261205"];
            ctx.fillStyle = bgs[currentLevel - 1]; ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // --- INTERFAZ: Anillo Blanco de Impacto Perimetral ---
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(centerX, centerY, hitZoneRadius, 0, Math.PI * 2); ctx.stroke();

        // Línea guía de cruz para el posicionamiento de las flechas
        ctx.strokeStyle = "rgba(0, 255, 200, 0.08)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(centerX - 400, centerY); ctx.lineTo(centerX + 400, centerY); ctx.moveTo(centerX, centerY - 300); ctx.lineTo(centerX, centerY + 300); ctx.stroke();

        // --- PROCESAR OBSTÁCULOS / NOTAS DESDE LOS BORDES ---
        incomingNotes.forEach(note => {
            if (!note.resolved) {
                // Reducir la distancia hacia el centro continuamente
                note.dist -= 4.5;

                // Recalcular posiciones dinámicas en X e Y basándose en su distancia actual
                if (note.dir === "left")  note.x = centerX - note.dist;
                if (note.dir === "right") note.x = centerX + note.dist;
                if (note.dir === "up")    note.y = centerY - note.dist;
                if (note.dir === "down")  note.y = centerY + note.dist;

                // Solo dibujar si no ha colapsado por completo en el punto cero
                if (note.dist > 15) {
                    // Si entra en la zona exacta de disparo, brilla en cian neón
                    ctx.fillStyle = Math.abs(note.dist - hitZoneRadius) < 25 ? "#00ffff" : "#ffff00";
                    ctx.font = "bold 34px Arial Black"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
                    ctx.fillText(noteSymbols[note.dir], note.x, note.y);
                }
            }
        });

        // Dibujar a nuestro personaje central
        drawPixie(centerX, centerY);

        // Marcador superior izquierdo
        ctx.fillStyle = "#fff"; ctx.font = "24px 'Arial Black'"; ctx.textAlign = "left";
        ctx.fillText(`SCORE: ${score}`, 40, 50);
    }

    requestAnimationFrame(loop);
}

// Disparar motor
loop();
