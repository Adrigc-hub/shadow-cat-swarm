const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resize() { canvas.width = 1280; canvas.height = 720; }
resize(); window.addEventListener('resize', resize);

let currentLevel = 0; // 0 = Menú, 1-4 = Niveles, 5 = Boss "Fun Time"
let menu = new GDMenu(canvas, ctx, launchLevel);
let boss = null;

// Lógica de flechas rítmicas inferiores
let notes = [];
let noteSymbols = { left: "◀", up: "▲", right: "▶", down: "▼" };
let triggerLineX = 140; // Línea blanca exacta de impacto
let score = 0;

// Obstáculos del juego superior (Niveles 1-4)
let obstacles = [];
let gameDistance = 0;

// Seguimiento del gesto de arrastrar (Swipe)
let dragStart = { x: 0, y: 0 };

function launchLevel(lvlNum) {
    currentLevel = lvlNum;
    score = 0; notes = []; obstacles = []; gameDistance = 0;
    
    if (lvlNum === 5) {
        boss = new BossLevel(canvas, ctx);
    } else {
        // Generar mapa con obstáculos reales (Pinchos, Sierras y Portales de color de GD)
        for(let i = 0; i < 40; i++) {
            let ox = 800 + i * 350;
            let type = i % 3 === 0 ? "spike" : i % 3 === 1 ? "saw" : "portal";
            obstacles.push({ x: ox, type: type, passed: false });
        }
    }

    // Cargar ráfaga de notas musicales rítmicas
    for (let n = 0; n < 80; n++) {
        let dirs = ["left", "up", "right", "down"];
        notes.push({
            x: 500 + n * 240,
            dir: dirs[Math.floor(Math.random() * dirs.length)],
            resolved: false
        });
    }
}

// --- CAPTURA DE ACCIONES DE DESLIZAMIENTO (MOUSE O IPAD) ---
function onSwipeStart(x, y) {
    dragStart.x = x; dragStart.y = y;
}

function onSwipeEnd(x, y) {
    let dx = x - dragStart.x; let dy = y - dragStart.y;
    let minSwipe = 25; // Precisión del raspado
    let actionDir = null;

    if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) > minSwipe) actionDir = dx > 0 ? "right" : "left";
    } else {
        if (Math.abs(dy) > minSwipe) actionDir = dy > 0 ? "down" : "up";
    }

    if (actionDir) verifyHit(actionDir);
}

function verifyHit(dir) {
    let threshold = 45; // Ventana de tiempo/píxeles perfecta
    let target = notes.find(n => !n.resolved && Math.abs(n.x - triggerLineX) < threshold);

    if (target && target.dir === dir) {
        target.resolved = true;
        score += 150;
        if (currentLevel === 5 && boss) {
            boss.health -= 2.2; // Quitar vida real al jefe de las 10 fases
        }
    }
}

// Vinculación de periféricos y toques de pantalla táctil
canvas.addEventListener('mousedown', e => {
    let r = canvas.getBoundingClientRect();
    let mx = (e.clientX - r.left) * (canvas.width / r.width);
    let my = (e.clientY - r.top) * (canvas.height / r.height);
    if(currentLevel === 0) menu.click(mx, my); else onSwipeStart(mx, my);
});
canvas.addEventListener('mousemove', e => {
    if (currentLevel === 0 && (menu.isDraggingMusic || menu.isDraggingSFX)) {
        let r = canvas.getBoundingClientRect();
        menu.moveSlider((e.clientX - r.left) * (canvas.width / r.width));
    }
});
canvas.addEventListener('mouseup', e => {
    if(currentLevel === 0) { menu.isDraggingMusic = false; menu.isDraggingSFX = false; }
    else {
        let r = canvas.getBoundingClientRect();
        onSwipeEnd((e.clientX - r.left) * (canvas.width / r.width), (e.clientY - r.top) * (canvas.height / r.height));
    }
});

// Soporte completo para iPad / Android Touch
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

// --- MOTOR GRÁFICO GENERAL DE JUEGO (LOOP) ---
function run() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentLevel === 0) {
        menu.update(); menu.render();
    } else {
        // --- RENDERIZADO DEL NIVEL ---
        if (currentLevel === 5 && boss) {
            boss.update(); boss.render();
            if (boss.health <= 0) {
                alert("¡Felicidades! Destruiste al jefe en sus 10 fases de Fun Time.");
                currentLevel = 0; menu.screen = "main";
            }
        } else {
            // NIVELES 1 AL 4 DECORADOS (Fondos degradados neón con obstáculos móviles)
            let colors = ["#0d47a1", "#4a148c", "#1b5e20", "#e65100"];
            ctx.fillStyle = colors[currentLevel - 1]; ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Dibujar suelo decorado estilo GD
            ctx.fillStyle = "#000000"; ctx.fillRect(0, canvas.height - 220, canvas.width, 20);
            ctx.fillStyle = "#00ffff"; ctx.fillRect(0, canvas.height - 200, canvas.width, 6);

            // Mover y pintar los obstáculos reales del nivel
            obstacles.forEach(obs => {
                obs.x -= 5.5; // Velocidad de desplazamiento
                ctx.save();
                ctx.translate(obs.x, canvas.height - 220);

                if (obs.type === "spike") {
                    // Pincho clásico triangular de GD
                    ctx.fillStyle = "#ff00a0"; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(20, -40); ctx.lineTo(40, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
                } else if (obs.type === "saw") {
                    // Sierra circular rotatoria de peligro
                    ctx.translate(20, -20); ctx.rotate(Date.now() * 0.01);
                    ctx.fillStyle = "#333"; ctx.strokeStyle = "#ff0000"; ctx.lineWidth = 3;
                    ctx.beginPath(); for(let k=0; k<12; k++) { let a=(Math.PI/6)*k; ctx.lineTo(Math.cos(a)*25, Math.sin(a)*25); ctx.lineTo(Math.cos(a+0.1)*15, Math.sin(a+0.1)*15); }
                    ctx.closePath(); ctx.fill(); ctx.stroke();
                } else if (obs.type === "portal") {
                    // Portal de cambio de gravedad/velocidad de neón
                    ctx.fillStyle = "#00ff66"; ctx.fillRect(0, -80, 15, 80);
                }
                ctx.restore();
            });
        }

        // --- RENDER DEL PERSONAJE (GATO DE SOMBRA) ---
        let catY = canvas.height - 280;
        ctx.fillStyle = "#141414"; ctx.strokeStyle = "#00ffff"; ctx.lineWidth = 3;
        ctx.fillRect(120, catY, 55, 55); ctx.strokeRect(120, catY, 55, 55); // Cuerpo del icono
        // Orejas de gato triangulares
        ctx.fillStyle = "#141414";
        ctx.beginPath(); ctx.moveTo(120, catY); ctx.lineTo(130, catY - 15); ctx.lineTo(140, catY); ctx.fill();
        ctx.beginPath(); ctx.moveTo(145, catY); ctx.lineTo(155, catY - 15); ctx.lineTo(165, catY); ctx.fill();
        // Ojos encendidos en cian
        ctx.fillStyle = "#00ffff"; ctx.fillRect(142, catY + 15, 8, 8); ctx.fillRect(158, catY + 15, 8, 8);

        // --- TRACK DE RITMO INFERIOR (Estilo barra de flechas) ---
        let trackY = canvas.height - 110;
        ctx.fillStyle = "rgba(10, 14, 26, 0.85)"; ctx.fillRect(0, trackY, canvas.width, 110);
        ctx.strokeStyle = "#00ffcc"; ctx.lineWidth = 3; ctx.strokeRect(0, trackY, canvas.width, 110);

        // Línea blanca de impacto brillante
        ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 5; ctx.shadowColor = "#ffffff"; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.moveTo(triggerLineX, trackY); ctx.lineTo(triggerLineX, trackY + 110); ctx.stroke();
        ctx.shadowBlur = 0;

        // Desplazamiento y renderizado de las notas de dirección
        notes.forEach(note => {
            note.x -= 4.8; // Desplazamiento continuo al ritmo
            if (!note.resolved && note.x > 30) {
                // Las notas cambian de color si están en rango óptimo de golpeo
                ctx.fillStyle = Math.abs(note.x - triggerLineX) < 40 ? "#00ffcc" : "#ffcc00";
                ctx.font = "bold 38px Arial";
                ctx.textAlign = "center";
                ctx.fillText(noteSymbols[note.dir], note.x, trackY + 68);
            }
        });

        // Interfaz de puntuación (Score en vivo arriba a la izquierda)
        ctx.fillStyle = "#ffffff"; ctx.font = "26px 'Arial Black'"; ctx.textAlign = "left";
        ctx.fillText(`SCORE: ${score}`, 40, 50);
    }

    requestAnimationFrame(run);
}
run();
