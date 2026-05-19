const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Ajustar resolución de render interna
function resizeCanvas() {
    canvas.width = 1280;
    canvas.height = 720;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// --- ESTADOS DEL JUEGO ---
let currentLevel = 0; // 0 = Menú, 1-4 = Niveles Normales, 5 = Boss
let menu = new GDMenu(canvas, ctx, startLevel);
let bossGame = null;

// Sistema de flechas de ritmo
let arrows = [];
let arrowSymbols = { left: "←", up: "↑", right: "→", down: "↓" };
let rhythmLineX = 100; // Posición fija de la línea de impacto blanca
let score = 0;

// Variables para control de deslizamiento (Swipe)
let touchStart = { x: 0, y: 0 };

function startLevel(levelNum) {
    currentLevel = levelNum;
    score = 0;
    arrows = [];
    
    if (levelNum === 5) {
        bossGame = new BossLevel(canvas, ctx);
    }
    
    // Generar flechas rítmicas de prueba
    for (let i = 0; i < 60; i++) {
        let dirs = ["left", "up", "right", "down"];
        let randomDir = dirs[Math.floor(Math.random() * dirs.length)];
        arrows.push({
            x: 600 + i * 220, // Distancia entre notas
            dir: randomDir,
            hit: false
        });
    }
}

// --- CAPTURA DE ACCIONES (SWIPES / SLIDES) ---
function handleSwipeStart(x, y) {
    touchStart.x = x;
    touchStart.y = y;
}

function handleSwipeEnd(x, y) {
    let diffX = x - touchStart.x;
    let diffY = y - touchStart.y;
    let threshold = 30; // Sensibilidad del raspado
    let detectedDir = null;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > threshold) {
            detectedDir = diffX > 0 ? "right" : "left";
        }
    } else {
        if (Math.abs(diffY) > threshold) {
            detectedDir = diffY > 0 ? "down" : "up";
        }
    }

    if (detectedDir) {
        checkRhythmHit(detectedDir);
    }
}

// Validar si la flecha estaba sobre la línea blanca al raspar
function checkRhythmHit(direction) {
    let hitWindow = 40; // Tolerancia de error en píxeles
    let validArrow = arrows.find(a => !a.hit && Math.abs(a.x - rhythmLineX) < hitWindow);

    if (validArrow) {
        if (validArrow.dir === direction) {
            validArrow.hit = true;
            score += 100;
            // Si es el nivel del jefe, le bajamos vida al acertar
            if (currentLevel === 5 && bossGame) {
                bossGame.takeDamage(1.8); // Daño por cada flecha correcta
            }
        }
    }
}

// Eventos de Mouse
canvas.addEventListener('mousedown', e => {
    let rect = canvas.getBoundingClientRect();
    let rx = (e.clientX - rect.left) * (canvas.width / rect.width);
    let ry = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    if (currentLevel === 0) {
        menu.handleClick(rx, ry);
    } else {
        handleSwipeStart(rx, ry);
    }
});

canvas.addEventListener('mouseup', e => {
    if (currentLevel > 0) {
        let rect = canvas.getBoundingClientRect();
        let rx = (e.clientX - rect.left) * (canvas.width / rect.width);
        let ry = (e.clientY - rect.top) * (canvas.height / rect.height);
        handleSwipeEnd(rx, ry);
    }
});

// Eventos Táctiles (iPad / Android)
canvas.addEventListener('touchstart', e => {
    let rect = canvas.getBoundingClientRect();
    let rx = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width);
    let ry = (e.touches[0].clientY - rect.top) * (canvas.height / rect.height);
    if (currentLevel === 0) {
        menu.handleClick(rx, ry);
    } else {
        handleSwipeStart(rx, ry);
    }
});

canvas.addEventListener('touchend', e => {
    if (currentLevel > 0 && e.changedTouches.length > 0) {
        let rect = canvas.getBoundingClientRect();
        let rx = (e.changedTouches[0].clientX - rect.left) * (canvas.width / rect.width);
        let ry = (e.changedTouches[0].clientY - rect.top) * (canvas.height / rect.height);
        handleSwipeEnd(rx, ry);
    }
});

// --- BUCLE PRINCIPAL DE ANIMACIÓN (GAME LOOP) ---
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentLevel === 0) {
        // Renderizar Menú Principal
        menu.update();
        menu.render();
    } else {
        // --- JUEGO EN CURSO ---
        
        // Actualizar lógica de niveles o jefe
        if (currentLevel === 5 && bossGame) {
            bossGame.update();
            bossGame.render();
            
            if(bossGame.isDead) {
                currentLevel = 0;
                menu.active = true;
                menu.currentScreen = "main";
                alert("¡Nivel 'Fun Time' Completado!");
            }
        } else {
            // Fondos decorados simples para niveles 1 a 4
            ctx.fillStyle = "#0f2027";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#fff";
            ctx.font = "30px Arial";
            ctx.fillText(`LEVEL ${currentLevel} - DECORATED BG`, canvas.width/2, 200);
        }

        // --- RENDER DE NUESTRO GATO (Jugador) ---
        ctx.fillStyle = "#111111"; // Gato Sombra
        ctx.fillRect(150, canvas.height - 250, 60, 60); // Cuerpo
        ctx.fillStyle = "#00ffcc"; // Ojos brillantes rítmicos
        let eyePulse = 5 + Math.sin(Date.now()/100)*2;
        ctx.fillRect(185, canvas.height - 235, 8, eyePulse);
        ctx.fillRect(198, canvas.height - 235, 8, eyePulse);

        // --- BARRA INFERIOR DE RITMO ---
        let barY = canvas.height - 100;
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(0, barY, canvas.width, 100);
        ctx.strokeStyle = "#00ffcc";
        ctx.lineWidth = 3;
        ctx.strokeRect(0, barY, canvas.width, 100);

        // Línea blanca de impacto (Donde debes raspar)
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(rhythmLineX, barY);
        ctx.lineTo(rhythmLineX, barY + 100);
        ctx.stroke();

        // Mover y dibujar las flechas de la pista
        arrows.forEach(arrow => {
            arrow.x -= 4; // Velocidad de desplazamiento de las notas

            if (!arrow.hit && arrow.x > 0) {
                ctx.fillStyle = arrow.x < rhythmLineX - 20 ? "#ff3333" : "#ffff00";
                ctx.font = "35px Arial Black";
                ctx.fillText(arrowSymbols[arrow.dir], arrow.x, barY + 60);
            }
        });

        // Marcador de Puntos
        ctx.fillStyle = "#fff";
        ctx.font = "24px 'Arial Black'";
        ctx.fillText(`SCORE: ${score}`, 50, 50);
    }

    requestAnimationFrame(gameLoop);
}

// Iniciar ejecutor del juego
gameLoop();
