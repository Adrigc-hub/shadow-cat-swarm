const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- ESTADO DEL JUEGO Y PROGRESO ---
let gameState = "MENU"; 
let currentSkin = "shadow";
let currentLevel = 1;
let attempts = 1;
let currentUser = null;

// Configuración del Jugador (Gato de las sombras)
const player = {
    x: 100,
    y: 300,
    width: 40,
    height: 40,
    gravity: 1.4,
    velocity: 0,
    jumpForce: -16,
    isGrounded: false
};

// Listas de juego
let obstacles = [];
let gameSpeed = 6;
let frameCount = 0;

// Cargar datos guardados automáticamente al abrir el juego
function loadGameData() {
    const savedData = localStorage.getItem("shadowCat_save");
    if (savedData) {
        const data = JSON.parse(savedData);
        currentLevel = data.level || 1;
        attempts = data.attempts || 1;
        currentSkin = data.skin || "shadow";
        updateHUD();
    }
}

function saveGameData() {
    const dataToSave = {
        level: currentLevel,
        attempts: attempts,
        skin: currentSkin,
        user: currentUser
    };
    localStorage.setItem("shadowCat_save", JSON.stringify(dataToSave));
}

// Sistema de cuentas ficticio/nube simulada
function login() {
    const userField = document.getElementById("username").value;
    if(userField.trim() !== "") {
        currentUser = userField;
        document.getElementById("auth-status").innerText = `Conectado como: ${currentUser} (Sincronizado)`;
        saveGameData();
    }
}

// --- GENERACIÓN DE TEXTURAS POR CÓDIGO (PROTOTIPOS VECTORIALES) ---
function drawShadowCat(ctx, x, y, size, skin) {
    ctx.save();
    
    // Cuerpo base: Humo/Sombra oscura
    ctx.fillStyle = "#111116";
    ctx.shadowBlur = 15;
    ctx.shadowColor = skin === "gojo" ? "#4682ff" : (skin === "sukuna" ? "#ff4646" : "#a146ff");
    ctx.fillRect(x, y, size, size);

    // Ojos base del gato (Brillantes de sombra)
    ctx.fillStyle = "#fff";
    ctx.shadowBlur = 0;
    
    if (skin === "shadow") {
        ctx.fillStyle = "#bd7eff";
        ctx.fillRect(x + 25, y + 10, 6, 10);
        ctx.fillRect(x + 12, y + 10, 6, 10);
    } 
    else if (skin === "gojo") {
        // Venda en los ojos negra y destellos celestes abajo
        ctx.fillStyle = "#000";
        ctx.fillRect(x, y + 8, size, 12);
        ctx.fillStyle = "#46ccff"; // Brillo del infinito
        ctx.fillRect(x + 24, y + 18, 8, 4);
    } 
    else if (skin === "sukuna") {
        // Marcas en la cara (Líneas rojas) y 4 ojos pequeños
        ctx.fillStyle = "#ff2a2a";
        ctx.fillRect(x + 5, y + 5, 4, 4);
        ctx.fillRect(x + 12, y + 9, 4, 4);
        ctx.fillRect(x + 22, y + 9, 4, 4);
        ctx.fillRect(x + 30, y + 5, 4, 4);
        // Tatuaje de frente
        ctx.fillRect(x + 16, y + 2, 8, 3);
    }

    // Orejas de gato fijas
    ctx.fillStyle = "#111116";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 10, y - 10);
    ctx.lineTo(x + 15, y);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + size, y);
    ctx.lineTo(x + size - 10, y - 10);
    ctx.lineTo(x + size - 15, y);
    ctx.fill();

    ctx.restore();
}

// Textura de pinchos/obstáculos mecánicos por código
function drawSpike(ctx, x, y, width, height) {
    ctx.save();
    let gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, "#ff467e");
    gradient.addColorStop(1, "#3a1220");
    ctx.fillStyle = gradient;
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#ff467e";

    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.lineTo(x + width / 2, y);
    ctx.lineTo(x + width, y + height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

// Textura de Bloques que caen (Obstáculos Dinámicos)
function drawFallingBlock(ctx, x, y, size) {
    ctx.save();
    ctx.fillStyle = "#2a1a40";
    ctx.strokeStyle = "#00ffff";
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#00ffff";
    
    ctx.fillRect(x, y, size, size);
    ctx.strokeRect(x, y, size, size);
    
    // Cruz interna decorativa de advertencia
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + size, y + size);
    ctx.moveTo(x + size, y);
    ctx.lineTo(x, y + size);
    ctx.strokeStyle = "rgba(0, 255, 255, 0.4)";
    ctx.stroke();
    ctx.restore();
}

// --- MECÁNICAS Y LOOP DEL JUEGO ---

function startGame() {
    document.getElementById("main-menu").classList.add("hidden");
    gameState = "PLAYING";
    resetLevel();
}

function resetLevel() {
    player.y = 300;
    player.velocity = 0;
    player.isGrounded = false;
    obstacles = [];
    frameCount = 0;
    saveGameData();
    updateHUD();
}

function updateHUD() {
    document.getElementById("level-display").innerText = `Nivel: ${currentLevel}`;
    document.getElementById("score-display").innerText = `Intentos: ${attempts}`;
}

// Entrada de Controles (Salto tipo GD)
window.addEventListener("keydown", (e) => {
    if ((e.code === "Space" || e.code === "ArrowUp") && player.isGrounded && gameState === "PLAYING") {
        player.velocity = player.jumpForce;
        player.isGrounded = false;
    }
});
window.addEventListener("touchstart", () => {
    if (player.isGrounded && gameState === "PLAYING") {
        player.velocity = player.jumpForce;
        player.isGrounded = false;
    }
});

function spawnObstacles() {
    frameCount++;
    
    // Generar obstáculos en el suelo de forma regular
    if (frameCount % 90 === 0) {
        obstacles.push({
            x: 850,
            y: 310,
            width: 30,
            height: 40,
            type: "spike"
        });
    }

    // OBSTÁCULOS CAYENDO (Dinámicos tipo Boss/Ritmo) cada cierto tiempo
    if (frameCount % 140 === 0) {
        obstacles.push({
            x: player.x + 400, // Cae un poco más adelante del jugador
            y: -50,
            width: 35,
            height: 35,
            type: "falling",
            fallSpeed: 5
        });
    }
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar Suelo Línea de Meta / Decoración Neon por código
    ctx.strokeStyle = "#3a1c5c";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 350);
    ctx.lineTo(800, 350);
    ctx.stroke();

    if (gameState === "PLAYING") {
        // Aplicar gravedad al Gato
        player.velocity += player.gravity;
        player.y += player.velocity;

        // Colisión con el suelo fijo
        if (player.y >= 310) {
            player.y = 310;
            player.velocity = 0;
            player.isGrounded = true;
        }

        spawnObstacles();

        // Procesar todos los obstáculos
        for (let i = obstacles.length - 1; i >= 0; i--) {
            let obs = obstacles[i];
            
            // Movimiento horizontal general (Velocidad GD)
            obs.x -= gameSpeed;

            // Si es tipo dinámico, además cae del cielo
            if (obs.type === "falling") {
                obs.y += obs.fallSpeed;
            }

            // Renderizar las texturas algorítmicas correspondientes
            if (obs.type === "spike") {
                drawSpike(ctx, obs.x, obs.y, obs.width, obs.height);
            } else {
                drawFallingBlock(ctx, obs.x, obs.y, obs.width);
            }

            // Detección de Colisión AABB simple
            if (
                player.x < obs.x + obs.width &&
                player.x + player.width > obs.x &&
                player.y < obs.y + obs.height &&
                player.y + player.height > obs.y
            ) {
                // ¡PUM! El jugador muere
                attempts++;
                resetLevel();
            }

            // Eliminar objetos fuera de pantalla
            if (obs.x < -50) {
                obstacles.splice(i, 1);
            }
        }
    }

    // Dibujar siempre al Gato de las Sombras con su Skin activa hecha por código
    drawShadowCat(ctx, player.x, player.y, player.width, currentSkin);

    requestAnimationFrame(gameLoop);
}

// --- INTERFAZ DE LA TIENDA ---
function openShop() {
    document.getElementById("main-menu").classList.add("hidden");
    document.getElementById("shop-menu").classList.remove("hidden");
}

function closeShop() {
    document.getElementById("shop-menu").classList.add("hidden");
    document.getElementById("main-menu").classList.remove("remove");
    // Hack rápido para recargar estados de menú sin recargar ventana
    document.getElementById("main-menu").className = "menu-overlay";
}

function selectSkin(skinName) {
    currentSkin = skinName;
    saveGameData();
    closeShop();
}

// Inicializar el cargador y el Loop
loadGameData();
requestAnimationFrame(gameLoop);
