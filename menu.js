class GDMenu {
    constructor(canvas, ctx, onSelectLevel) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.onSelectLevel = onSelectLevel;
        this.active = true;
        this.animationTimer = 0;
        
        // Configuración de botones estilo GD
        this.playBtn = { x: 0, y: 0, r: 70, pulse: 1 };
        this.levels = ["Level 1", "Level 2", "Level 3", "Level 4", "Fun Time (BOSS)"];
        this.currentScreen = "main"; // main o select
    }

    update() {
        this.animationTimer += 0.05;
        this.playBtn.pulse = 1 + Math.sin(this.animationTimer * 2) * 0.05;
    }

    render() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Fondo animado con gradiente cambiante estilo GD
        let hue = (Date.now() / 50) % 360;
        ctx.fillStyle = `hsla(${hue}, 40%, 15%, 1)`;
        ctx.fillRect(0, 0, w, h);

        if (this.currentScreen === "main") {
            // Título del juego con sombra pesada
            ctx.fillStyle = "#00ffcc";
            ctx.font = "60px 'Arial Black'";
            ctx.textAlign = "center";
            ctx.shadowColor = "#000";
            ctx.shadowBlur = 10;
            ctx.fillText("SHADOW CAT", w / 2, h / 3);
            ctx.shadowBlur = 0;

            // Botón Central de Play (Verde con borde amarillo/dorado)
            this.playBtn.x = w / 2;
            this.playBtn.y = h / 2 + 30;
            
            ctx.save();
            ctx.translate(this.playBtn.x, this.playBtn.y);
            ctx.scale(this.playBtn.pulse, this.playBtn.pulse);
            
            // Círculo exterior
            ctx.fillStyle = "#c29900";
            ctx.beginPath(); ctx.arc(0, 0, this.playBtn.r, 0, Math.PI * 2); ctx.fill();
            // Círculo interior verde
            ctx.fillStyle = "#23e22d";
            ctx.beginPath(); ctx.arc(0, 0, this.playBtn.r - 8, 0, Math.PI * 2); ctx.fill();
            
            // Triángulo de Play
            ctx.fillStyle = "#fff";
            ctx.beginPath();
            ctx.moveTo(-15, -25);
            ctx.lineTo(25, 0);
            ctx.lineTo(-15, 25);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        } else if (this.currentScreen === "select") {
            // Pantalla de selección de niveles
            ctx.fillStyle = "#fff";
            ctx.font = "30px 'Arial Black'";
            ctx.fillText("SELECT LEVEL", w / 2, 80);

            this.levels.forEach((lvl, i) => {
                ctx.fillStyle = i === 4 ? "#ff3333" : "#0099ff"; // El boss es rojo
                ctx.fillRect(w / 2 - 150, 150 + i * 70, 300, 50);
                ctx.fillStyle = "#fff";
                ctx.font = "20px Arial";
                ctx.fillText(lvl, w / 2, 182 + i * 70);
            });
        }
    }

    handleClick(x, y) {
        if (this.currentScreen === "main") {
            let dist = Math.hypot(x - this.playBtn.x, y - this.playBtn.y);
            if (dist < this.playBtn.r) {
                this.currentScreen = "select";
            }
        } else if (this.currentScreen === "select") {
            const w = this.canvas.width;
            this.levels.forEach((lvl, i) => {
                let bx = w / 2 - 150;
                let by = 150 + i * 70;
                if (x >= bx && x <= bx + 300 && y >= by && y <= by + 50) {
                    this.active = false;
                    this.onSelectLevel(i + 1); // Retorna el número de nivel
                }
            });
        }
    }
}
