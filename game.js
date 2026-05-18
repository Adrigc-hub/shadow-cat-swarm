const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- CONFIGURACIÓN BASE ---
let gameState = "MENU"; 
let currentSkin = "shadow";
let currentLevel = 1;
let attempts = 1;
let currentUser = null;

// Físicas del jugador ajustadas
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

let obstacles = [];
let gameSpeed = 6.5;
let frameCount = 0;

// Reajustar tamaño del lienzo internamente para que coincida con el CSS real del móvil
function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = 800;  // Mantiene la resolución interna fija para que las físicas no cambien
    canvas.height = 450;
}
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);

// Cargar Datos Guardados
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
    const dataToSave = { level: currentLevel, attempts: attempts, skin: currentSkin, user: currentUser };
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

// --- DIBUJO DEL GATO Y TRAJES JJK ---
function drawShadowCat(targetCtx, x, y, size, skin) {
    targetCtx.save();
    targetCtx.fillStyle = "#121218";
    targetCtx.shadowBlur = 12;
    targetCtx.shadowColor = skin === "gojo" ? "#00d2ff" : (skin === "sukuna" ? "#ff3333" : "#bd7eff");
    targetCtx.fillRect(x, y, size, size);
    targetCtx.shadowBlur = 0;

    // Orejas
    targetCtx.fillStyle = "#121218";
    targetCtx.beginPath();
    targetCtx.moveTo(x, y); targetCtx.lineTo(x + size*0.25, y - size*0.2); targetCtx.lineTo(x + size*0.4, y);
    targetCtx.moveTo(x + size, y); targetCtx.lineTo(x + size*0.75, y - size*0.2); targetCtx.lineTo(x + size*0.6, y);
    targetCtx.fill();

    if (skin === "shadow") {
        targetCtx.fillStyle = "#bd7eff";
        targetCtx.fillRect(x + size*0.65, y + size*0.25, 6, 10);
        targetCtx.fillRect(x + size*0.3, y + size*0.25, 6, 10);
    } 
    else if (skin === "gojo") {
        targetCtx.fillStyle = "#050508";
        targetCtx.fillRect(x, y + size*0.2, size, size*0.3);
        targetCtx.fillStyle = "#00ffff";
        targetCtx.fillRect(x + size*0.6, y + size*0.5, 8, 4);
    } 
    else if (skin === "sukuna") {
        targetCtx.fillStyle = "#ff2222";
        targetCtx.fillRect(x + size*0.1, y + size*0.2, 6, 4);
        targetCtx.fillRect(x + size*0.75, y + size*0.2, 6, 4);
        targetCtx.fillRect(x + size*0.4, y + size*0.1, 8, 3);
        targetCtx.fillStyle = "#ffffff";
        targetCtx.fillRect(x + size*0.25, y + size*0.35, 5, 5);
        targetCtx.fillRect(x + size*0.6, y + size*0.35, 5, 5);
    }
    targetCtx.restore();
}

function renderMenuSkinPreviews() {
    ["shadow", "gojo", "sukuna"].forEach(s => {
        const pCanvas = document.getElementById(`skin-prev-${s}`);
        if(pCanvas) {
            const pCtx = pCanvas.getContext("2d");
            pCtx.clearRect(0, 0, 50, 50);
            drawShadowCat(pCtx, 5, 5, 38, s);
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
    targetCtx.restore();
}

// --- BUCLE Y SISTEMAS ---
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

function handleJump(e) {
    if(e) e.preventDefault(); // Evita el doble zoom raro en pantallas táctiles
    if (player.isGrounded && gameState === "PLAYING") {
        player.velocity = player.jumpForce;
        player.isGrounded = false;
    }
}
window.addEventListener("keydown", (e) => { if(e.code === "Space" || e.code === "ArrowUp") handleJump(); });
canvas.addEventListener("touchstart", handleJump, {passive: false});

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Suelo
    ctx.strokeStyle = "#2c164d";
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(0, 392); ctx.lineTo(800, 392); ctx.stroke();

    if (gameState === "PLAYING") {
        player.velocity += player.gravity;
        player.y += player.velocity;

        if (player.y >= 352) {
            player.y = 352;
            player.velocity = 0;
            player.isGrounded = true;
        }

        frameCount++;
        if (frameCount % 90 === 0) obstacles.push({ x: 820, y: 352, width: 32, height: 40, type: "spike" });
        if (frameCount % 150 === 0) obstacles.push({ x: player.x + 380, y: -40, width: 35, height: 35, type: "falling", speedY: 6 });

        for (let i = obstacles.length - 1; i >= 0; i--) {
            let obs = obstacles[i];
            obs.x -= gameSpeed;
            if (obs.type === "falling") obs.y += obs.speedY;

            if (obs.type === "spike") drawSpike(ctx, obs.x, obs.y, obs.width, obs.height);
            else drawFallingBlock(ctx, obs.x, obs.y, obs.width);

            if (player.x < obs.x + obs.width && player.x + player.width > obs.x && player.y < obs.y + obs.height && player.y + player.height > obs.y) {
                attempts++;
                resetLevel();
            }
            if (obs.x < -60) obstacles.splice(i, 1);
        }
    }

    drawShadowCat(ctx, player.x, player.y, player.width, currentSkin);
    requestAnimationFrame(gameLoop);
}

// Interfaz
function openShop() { document.getElementById("shop-menu").classList.remove("hidden"); }
function closeShop() { document.getElementById("shop-menu").classList.add("hidden"); }
function selectSkin(skinName) { currentSkin = skinName; saveGameData(); closeShop(); }

// Inicialización
resizeCanvas();
loadGameData();
requestAnimationFrame(gameLoop);
