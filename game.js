const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const V_WIDTH = 800;
const V_HEIGHT = 450;
let scale = 1;

let gameState = "MENU"; 
let currentSkin = "shadow";
let currentLevel = 1;
let attempts = 1;
let currentUser = null;

const player = {
    x: 120,
    y: 350,
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

let customObjects = []; 
let activeTool = "spike";

function resizeCanvas() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    scale = Math.min(windowWidth / V_WIDTH, windowHeight / V_HEIGHT);
    
    canvas.width = V_WIDTH * scale;
    canvas.height = V_HEIGHT * scale;
    
    ctx.scale(scale, scale);
    renderMenuSkinPreviews();
}
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);

function openLevels() { document.getElementById("main-menu").classList.add("hidden"); document.getElementById("levels-menu").classList.remove("hidden"); }
function closeLevels() { document.getElementById("levels-menu").classList.add("hidden"); document.getElementById("main-menu").classList.remove("hidden"); }

function startLevel(lvlNum) {
    currentLevel = lvlNum;
    document.getElementById("levels-menu").classList.add("hidden");
    document.getElementById("hud").classList.remove("hidden");
    gameState = "PLAYING";
    gameSpeed = 5.5 + (lvlNum * 1); 
    resetLevel();
}

function openBuilder() {
    document.getElementById("main-menu").classList.add("hidden");
    document.getElementById("builder-menu").classList.remove("hidden");
    gameState = "BUILDER";
}
function closeBuilder() {
    document.getElementById("builder-menu").classList.add("hidden");
    document.getElementById("main-menu").classList.remove("hidden");
    gameState = "MENU";
}
function setTool(toolName) {
    activeTool = toolName;
    document.getElementById("tool-spike").classList.remove("active");
    document.getElementById("tool-block").classList.remove("active");
    document.getElementById(`tool-${toolName}`).classList.add("active");
}
function clearCustomLevel() { customObjects = []; }

canvas.addEventListener("mousedown", handleCanvasClick);
canvas.addEventListener("touchstart", (e) => {
    if (gameState === "BUILDER") {
        let touch = e.touches[0];
        handleCanvasClick(touch);
    }
});

function handleCanvasClick(e) {
    if (gameState !== "BUILDER") return;
    
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || e.pageX;
    const clientY = e.clientY || e.pageY;
    
    const clickX = (clientX - rect.left) / scale;
    const clickY = (clientY - rect.top) / scale;
    
    const gridX = Math.floor(clickX / 40) * 40;
    const gridY = Math.floor(clickY / 40) * 40;

    if (gridY > 100 && gridY < 400) {
        customObjects.push({ x: gridX, y: gridY, width: 35, height: 35, type: activeTool });
    }
}

function playCustomLevel() {
    if(customObjects.length === 0) { alert("¡Coloca algunos obstáculos primero!"); return;}
    document.getElementById("builder-menu").classList.add("hidden");
    document.getElementById("hud").classList.remove("hidden");
    obstacles = customObjects.map(obj => ({ ...obj }));
    gameState = "PLAYING_CUSTOM";
    player.y = 350;
    player.velocity = 0;
    player.isGrounded = true;
}

function drawShadowCat(targetCtx, x, y, size, skin) {
    targetCtx.save();
    targetCtx.fillStyle = "#121218";
    targetCtx.shadowBlur = 12;
    targetCtx.shadowColor = skin === "gojo" ? "#00d2ff" : (skin === "sukuna" ? "#ff3333" : "#bd7eff");
    targetCtx.fillRect(x, y, size, size);
    targetCtx.shadowBlur = 0;

    targetCtx.fillStyle = "#121218";
    targetCtx.beginPath();
    targetCtx.moveTo(x, y); targetCtx.lineTo(x + size*0.25, y - size*0.2); targetCtx.lineTo(x + size*0.4, y);
    targetCtx.moveTo(x + size, y); targetCtx.lineTo(x + size*0.75, y - size*0.2); targetCtx.lineTo(x + size*0.6, y);
    targetCtx.fill();

    if (skin === "shadow") {
        targetCtx.fillStyle = "#bd7eff"; targetCtx.fillRect(x + size*0.65, y + size*0.25, 6, 10); targetCtx.fillRect(x + size*0.3, y + size*0.25, 6, 10);
    } else if (skin === "gojo") {
        targetCtx.fillStyle = "#050508"; targetCtx.fillRect(x, y + size*0.2, size, size*0.3);
        targetCtx.fillStyle = "#00ffff"; targetCtx.fillRect(x + size*0.6, y + size*0.5, 8, 4);
    } else if (skin === "sukuna") {
        targetCtx.fillStyle = "#ff2222"; targetCtx.fillRect(x + size*0.1, y + size*0.2, 6, 4); targetCtx.fillRect(x + size*0.75, y + size*0.2, 6, 4);
        targetCtx.fillStyle = "#ffffff"; targetCtx.fillRect(x + size*0.25, y + size*0.35, 5, 5); targetCtx.fillRect(x + size*0.6, y + size*0.35, 5, 5);
    }
    targetCtx.restore();
}

function renderMenuSkinPreviews() {
    ["shadow", "gojo", "sukuna"].forEach(s => {
        const pCanvas = document.getElementById(`skin-prev-${s}`);
        if(pCanvas) {
            const pCtx = pCanvas.getContext("2d");
            pCtx.clearRect(0, 0, 50, 50);
            drawShadowCat(pCtx, 5, 8, 38, s);
        }
    });
}

function drawSpike(targetCtx, x, y, width, height) {
    targetCtx.save();
    let grad = targetCtx.createLinearGradient(x, y, x, y + height);
    grad.addColorStop(0, "#ff0055"); grad.addColorStop(1, "#20000b");
    targetCtx.fillStyle = grad; targetCtx.strokeStyle = "#fff";
    targetCtx.beginPath();
    targetCtx.moveTo(x, y + height); targetCtx.lineTo(x + width / 2, y); targetCtx.lineTo(x + width, y + height);
    targetCtx.closePath(); targetCtx.fill(); targetCtx.stroke();
    targetCtx.restore();
}

function drawBlock(targetCtx, x, y, size) {
    targetCtx.save();
    targetCtx.fillStyle = "#22163b"; targetCtx.strokeStyle = "#ff00aa"; targetCtx.lineWidth = 2;
    targetCtx.fillRect(x, y, size, size); targetCtx.strokeRect(x, y, size, size);
    targetCtx.restore();
}

function resetLevel() {
    player.y = 350; player.velocity = 0; player.isGrounded = false;
    obstacles = []; frameCount = 0;
    saveGameData(); updateHUD();
}

function updateHUD() {
    document.getElementById("level-display").innerText = `NIVEL: ${currentLevel}`;
    document.getElementById("score-display").innerText = `INTENTOS: ${attempts}`;
}

function handleJump(e) {
    if(e && e.type === "touchstart") e.preventDefault();
    if (player.isGrounded && (gameState === "PLAYING" || gameState === "PLAYING_CUSTOM")) {
        player.velocity = player.jumpForce; player.isGrounded = false;
    }
}
window.addEventListener("keydown", (e) => { if(e.code === "Space" || e.code === "ArrowUp") handleJump(); });
canvas.addEventListener("touchstart", handleJump, {passive: false});
canvas.addEventListener("mousedown", handleJump);

function gameLoop() {
    ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);

    ctx.strokeStyle = "#2c164d"; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(0, 392); ctx.lineTo(V_WIDTH, 392); ctx.stroke();

    if (gameState === "PLAYING" || gameState === "PLAYING_CUSTOM") {
        player.velocity += player.gravity;
        player.y += player.velocity;

        if (player.y >= 352) { player.y = 352; player.velocity = 0; player.isGrounded = true; }

        if (gameState === "PLAYING") {
            frameCount++;
            if (frameCount % 90 === 0) obstacles.push({ x: 820, y: 352, width: 32, height: 40, type: "spike" });
            if (frameCount % 150 === 0) obstacles.push({ x: player.x + 380, y: -40, width: 35, height: 35, type: "falling", speedY: 6 });
        }

        for (let i = obstacles.length - 1; i >= 0; i--) {
            let obs = obstacles[i];
            obs.x -= gameSpeed;
            if (obs.type === "falling") obs.y += obs.speedY;

            if (obs.type === "spike") drawSpike(ctx, obs.x, obs.y, obs.width, obs.height);
            else drawBlock(ctx, obs.x, obs.y, obs.width || 40);

            if (player.x < obs.x + (obs.width||40) && player.x + player.width > obs.x && player.y < obs.y + (obs.height||40) && player.y + player.height > obs.y) {
                attempts++;
                if(gameState === "PLAYING_CUSTOM") {
                    document.getElementById("hud").classList.add("hidden");
                    openBuilder(); 
                } else {
                    resetLevel();
                }
            }
            if (obs.x < -60) obstacles.splice(i, 1);
        }
        drawShadowCat(ctx, player.x, player.y, player.width, currentSkin);
    } 
    else if (gameState === "BUILDER") {
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.lineWidth = 1;
        for(let x=0; x<V_WIDTH; x+=40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,V_HEIGHT); ctx.stroke(); }
        for(let y=0; y<V_HEIGHT; y+=40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(V_WIDTH,y); ctx.stroke(); }

        customObjects.forEach(obj => {
            if(obj.type === "spike") drawSpike(ctx, obj.x, obj.y, 40, 40);
            else drawBlock(ctx, obj.x, obj.y, 40);
        });
    }

    if (gameState === "MENU" || gameState === "BUILDER") {
        drawShadowCat(ctx, player.x, 352, player.width, currentSkin);
    }

    requestAnimationFrame(gameLoop);
}

function openShop() { document.getElementById("main-menu").classList.add("hidden"); document.getElementById("shop-menu").classList.remove("hidden"); }
function closeShop() { document.getElementById("shop-menu").classList.add("hidden"); document.getElementById("main-menu").classList.remove("hidden"); }
function selectSkin(skinName) { currentSkin = skinName; saveGameData(); closeShop(); }

function login() {
    const userField = document.getElementById("username").value;
    if(userField.trim() !== "") {
        currentUser = userField;
        document.getElementById("auth-status").innerText = `Nube: ${currentUser}`;
        saveGameData();
    }
}

function loadGameData() {
    const savedData = localStorage.getItem("shadowCat_save");
    if (savedData) { const data = JSON.parse(savedData); currentLevel = data.level || 1; attempts = data.attempts || 1; currentSkin = data.skin || "shadow"; currentUser = data.user; }
    if (currentUser) document.getElementById("auth-status").innerText = `Nube: ${currentUser}`;
    updateHUD();
}
function saveGameData() { localStorage.setItem("shadowCat_save", JSON.stringify({ level: currentLevel, attempts: attempts, skin: currentSkin, user: currentUser })); }

resizeCanvas();
loadGameData();
requestAnimationFrame(gameLoop);
