const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- CONFIGURACIÓN BASE ---
let gameState = "MENU"; 
let currentSkin = "shadow";
let currentLevel = 1;
let attempts = 1;
let currentUser = null;

const player = {
    x: 120,
    y: 350,
    width: 42,
    height: 42,
    gravity: 1.5,
    velocity: 0,
    jumpForce: -16.5,
    isGrounded: false
};

let obstacles = [];
let gameSpeed = 6.5;
let frameCount = 0;

// Cargar Datos Guardados de Forma Local
function loadGameData() {
    const savedData = localStorage.getItem("shadowCat_save");
    if (savedData) {
        const data = JSON.parse(savedData);
        currentLevel = data.level || 1;
        attempts = data.attempts || 1;
        currentSkin = data.skin || "shadow";
    }
    updateHUD();
    renderMenuSkinPreviews();
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

function login() {
    const userField = document.getElementById("username").value;
    if(userField.trim() !== "") {
        currentUser = userField;
        document.getElementById("auth-status").innerText = `Nube: ${currentUser}`;
        saveGameData();
    }
}

// --- DIBUJO VECTORIAL DEL GATO Y SKINS ---
function drawShadowCat(targetCtx, x, y, size, skin) {
    targetCtx.save();
    
    // Aura/Sombra base
    targetCtx.fillStyle = "#121218";
    targetCtx.shadowBlur = 12;
    targetCtx.shadowColor = skin === "gojo" ? "#00d2ff" : (skin === "sukuna" ? "#ff3333" : "#bd7eff");
    targetCtx.fillRect(x, y, size, size);
    targetCtx.shadowBlur = 0; // Resetear sombra para detalles

    // Orejas de gato
    targetCtx.fillStyle = "#121218";
    targetCtx.beginPath();
    targetCtx.moveTo(x, y);
    targetCtx.lineTo(x + size*0.25, y - size*0.2);
    targetCtx.lineTo(x + size*0.4, y);
    targetCtx.moveTo(x + size, y);
    targetCtx.lineTo(x + size*0.75, y - size*0.2);
    targetCtx.lineTo(x + size*0.6, y);
    targetCtx.fill();

    // Detalles según Skin de JJK
    if (skin === "shadow") {
        targetCtx.fillStyle = "#bd7eff";
        targetCtx.fillRect(x + size*0.65, y + size*0.25, 6, 10);
        targetCtx.fillRect(x + size*0.3, y + size*0.25, 6, 10);
    } 
    else if (skin === "gojo") {
        // Venda de ojos negra icónica de Gojo
        targetCtx.fillStyle = "#050508";
        targetCtx.fillRect(x, y + size*0.2, size, size*0.3);
        // Destello Azul de los Seis Ojos (Infinito) asomándose abajo
        targetCtx.fillStyle = "#00ffff";
        targetCtx.fillRect(x + size*0.6, y + size*0.5, 8, 4);
    } 
    else if (skin === "sukuna") {
        // Tatuajes faciales rojos de Sukuna
        targetCtx.fillStyle = "#ff2222";
        targetCtx.fillRect(x + size*0.1, y + size*0.2, 6, 4);
        targetCtx.fillRect(x + size*0.75, y + size*0.2, 6, 4);
        targetCtx.fillRect(x + size*0.4, y + size*0.1, 8, 3); // Frente
        // Ojos malditos adicionales
        targetCtx.fillStyle = "#ffffff";
        targetCtx.fillRect(x + size*0.25, y + size*0.35, 5, 5);
        targetCtx.fillRect(x + size*0.6, y + size*0.35, 5, 5);
    }
    targetCtx.restore();
}

// Dibujar Vistas previas en la Tienda
function renderMenuSkinPreviews() {
    const skins = ["shadow", "gojo", "sukuna"];
    skins.forEach(s => {
        const pCanvas = document.getElementById(`skin-prev-${s}`);
        if(pCanvas) {
            const pCtx = pCanvas.getContext("2d");
            pCtx.clearRect(0, 0, 50, 50);
            drawShadowCat(pCtx, 5, 10, 38, s);
        }
    });
}

function drawSpike(targetCtx, x, y, width, height) {
    targetCtx.save();
    let grad = targetCtx.createLinearGradient(x, y, x, y + height);
    grad.addColorStop(0, "#ff0055");
    grad.addColorStop(1, "#20000b");
    targetCtx.fillStyle = grad;
    targetCtx.strokeStyle = "#fff";
    targetCtx.lineWidth = 1;

    targetCtx.beginPath();
    targetCtx.moveTo(x, y + height);
    targetCtx.lineTo(x + width / 2, y);
    targetCtx.lineTo(x + width, y + height);
    targetCtx.closePath();
    targetCtx.fill();
    targetCtx.stroke();
    targetCtx.restore();
}

function drawFallingBlock(targetCtx, x, y, size) {
    targetCtx.save();
    targetCtx.fillStyle = "#1e1e2f";
    targetCtx.strokeStyle = "#ff00aa";
    targetCtx.lineWidth = 3;
    targetCtx.fillRect(x, y, size, size);
    targetCtx.strokeRect(x, y, size, size);
    
    targetCtx.beginPath();
    targetCtx.moveTo(x, y); targetCtx.lineTo(x + size, y + size);
    targetCtx.moveTo(x + size, y); targetCtx.lineTo(x, y + size);
    targetCtx.strokeStyle = "rgba(255, 0, 170, 0.3)";
    targetCtx.stroke();
    targetCtx.restore();
}

// --- SISTEMA DEL BUCLE JUEGO ---
function startGame() {
    document.getElementById("main-menu").classList.add("hidden");
    gameState = "PLAYING";
    resetLevel();
}

function resetLevel() {
    player.y = 350;
    player.velocity = 0;
    player.isGrounded = false;
    obstacles = [];
    frameCount = 0;
    saveGameData();
    updateHUD();
}

function updateHUD() {
    document.getElementById("level-display").innerText = `NIVEL: ${currentLevel}`;
    document.getElementById("score-display").innerText = `INTENTOS: ${attempts}`;
}

// Control Unión de Acción (Salto)
function handleJump() {
    if (player.isGrounded && gameState === "PLAYING") {
        player.velocity = player.jumpForce;
        player.isGrounded = false;
    }
}
window.addEventListener("keydown", (e) => { if(e.code === "Space" || e.code === "ArrowUp") handleJump(); });
window.addEventListener("touchstart", handleJump);

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Suelo estilo Geometry Dash Neon
    ctx.strokeStyle = "#2c164d";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, 392);
    ctx.lineTo(800, 392);
    ctx.stroke();

    if (gameState === "PLAYING") {
        player.velocity += player.gravity;
        player.y += player.velocity;

        // Tope de Suelo
        if (player.y >= 350) {
            player.y = 350;
            player.velocity = 0;
            player.isGrounded = true;
        }

        frameCount++;
        // Obstáculos terrestres
        if (frameCount % 100 === 0) {
            obstacles.push({ x: 820, y: 352, width: 32, height: 40, type: "spike" });
        }
        // Obstáculos cayendo del cielo
        if (frameCount % 160 === 0) {
            obstacles.push({ x: player.x + 350, y: -40, width: 35, height: 35, type: "falling", speedY: 5.5 });
        }

        // Render y movimiento de obstáculos
        for (let i = obstacles.length - 1; i >= 0; i--) {
            let obs = obstacles[i];
            obs.x -= gameSpeed;
            if (obs.type === "falling") obs.y += obs.speedY;

            if (obs.type === "spike") drawSpike(ctx, obs.x, obs.y, obs.width, obs.height);
            else drawFallingBlock(ctx, obs.x, obs.y, obs.width);

            // Colisiones AABB
            if (
                player.x < obs.x + obs.width &&
                player.x + player.width > obs.x &&
                player.y < obs.y + obs.height &&
                player.y + player.height > obs.y
            ) {
                attempts++;
                resetLevel();
            }

            if (obs.x < -60) obstacles.splice(i, 1);
        }
    }

    // Render del Gato de las Sombras permanente en pantalla
    drawShadowCat(ctx, player.x, player.y, player.width, currentSkin);

    requestAnimationFrame(gameLoop);
}

// --- MENÚS DE CONTROL ---
function openShop() {
    document.getElementById("shop-menu").classList.remove("hidden");
}
function closeShop() {
    document.getElementById("shop-menu").classList.add("hidden");
}
function selectSkin(skinName) {
    currentSkin = skinName;
    saveGameData();
    closeShop();
}

// Encendido del Motor
loadGameData();
requestAnimationFrame(gameLoop);
