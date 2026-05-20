class GDMenu {
    constructor(canvas, ctx, onStart) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.onStart = onStart;
        this.screen = "main"; // main, select, settings
        this.timer = 0;
        
        // Sliders de Audio (Igualitos a la interfaz de tu video)
        this.musicVolume = 0.8;
        this.sfxVolume = 0.5;
        this.isDraggingMusic = false;
        this.isDraggingSFX = false;
        
        // Animaciones de los botones gigantes
        this.btnScale = 1;
    }

    update() {
        this.timer += 0.04;
        this.btnScale = 1 + Math.sin(this.timer * 2.5) * 0.04; // Pulso agresivo estilo GD
    }

    render() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // 1. Fondo de color cambiante + Rejilla de fondo típica de GD
        let bgHue = (this.timer * 15) % 360;
        ctx.fillStyle = `hsl(${bgHue}, 65%, 20%)`;
        ctx.fillRect(0, 0, w, h);
        
        // Dibujar cuadrícula de fondo
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = 2;
        for(let i = 0; i < w; i += 60) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
        }
        for(let j = 0; j < h; j += 60) {
            ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(w, j); ctx.stroke();
        }

        if (this.screen === "main") {
            // TÍTULO ESTILO LOGO GD
            ctx.shadowColor = "#000"; ctx.shadowBlur = 15;
            ctx.fillStyle = "#00ffff"; ctx.font = "italic 75px 'Arial Black'"; ctx.textAlign = "center";
            ctx.fillText("SHADOW CAT", w / 2, h / 4 - 20);
            ctx.fillStyle = "#ffffff"; ctx.font = "italic 35px 'Arial Black'";
            ctx.fillText("RHYTHM DASH", w / 2, h / 4 + 30);
            ctx.shadowBlur = 0;

            // BOTÓN CENTRAL DE JUGAR (El círculo verde icónico)
            ctx.save();
            ctx.translate(w / 2, h / 2 + 20);
            ctx.scale(this.btnScale, this.btnScale);
            // Borde amarillo/dorado grueso
            ctx.fillStyle = "#e5b60d"; ctx.beginPath(); ctx.arc(0, 0, 85, 0, Math.PI*2); ctx.fill();
            // Centro verde brillante
            ctx.fillStyle = "#2df037"; ctx.beginPath(); ctx.arc(0, 0, 75, 0, Math.PI*2); ctx.fill();
            // Triángulo de Play blanco pulido
            ctx.fillStyle = "#ffffff"; ctx.beginPath();
            ctx.moveTo(-20, -35); ctx.lineTo(35, 0); ctx.lineTo(-20, 35); ctx.closePath(); ctx.fill();
            ctx.restore();

            // Botones secundarios inferiores (Icon Kit / Ajustes)
            this.drawCircleButton(w / 2 - 160, h / 2 + 50, 45, "#0094ff", "🛠️"); // Editor/Ajustes
            this.drawCircleButton(w / 2 + 160, h / 2 + 50, 45, "#ff6a00", "🏆"); // Logros

        } else if (this.screen === "select") {
            // PANTALLA DE SELECCIÓN DE NIVEL ESTILO GD
            ctx.fillStyle = "#ffffff"; ctx.font = "40px 'Arial Black'"; ctx.fillText("SELECT LEVEL", w / 2, 70);
            
            let levels = ["Level 1: Stereo Cat", "Level 2: Back On Track", "Level 3: Polargeist", "Level 4: Dry Out", "Level 5: FUN TIME (BOSS)"];
            levels.forEach((lvl, i) => {
                ctx.fillStyle = i === 4 ? "#ff1a1a" : "#00a2ff"; // El jefe final es rojo fuego
                ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 4;
                let bx = w / 2 - 220, by = 130 + i * 85, bw = 440, bh = 60;
                ctx.fillRect(bx, by, bw, bh); ctx.strokeRect(bx, by, bw, bh);
                
                ctx.fillStyle = "#ffffff"; ctx.font = "24px 'Arial Black'";
                ctx.fillText(lvl, w / 2, by + 38);
            });

            // Botón para volver atrás
            this.drawCircleButton(80, 80, 35, "#ff3333", " can");
        } else if (this.screen === "settings") {
            // INTERFAZ IGUALITA A LA DE TU CAPTURA DE VIDEO
            let panelW = 600, panelH = 400;
            let px = w/2 - panelW/2, py = h/2 - panelH/2;
            
            // Cuadro del menú gris con borde verde brillante
            ctx.fillStyle = "rgba(10, 10, 14, 0.95)"; ctx.fillRect(px, py, panelW, panelH);
            ctx.strokeStyle = "#00ff66"; ctx.lineWidth = 5; ctx.strokeRect(px, py, panelW, panelH);
            
            // Nombre del nivel arriba en letras amarillas
            ctx.fillStyle = "#ffff00"; ctx.font = "28px 'Arial Black'";
            ctx.fillText("OL666s PARTY TIME", w/2, py + 50);
            
            ctx.fillStyle = "#ffffff"; ctx.font = "18px 'Arial Black'";
            ctx.fillText("TIME: " + (this.timer).toFixed(3), w/2, py + 95);

            // --- SLIDER MUSIC ---
            ctx.fillStyle = "#ffffff"; ctx.font = "20px Arial Black"; ctx.fillText("MUSIC", px + 100, py + 180);
            this.drawGDSubSlider(px + 220, py + 172, 250, this.musicVolume);

            // --- SLIDER SFX ---
            ctx.fillStyle = "#ffffff"; ctx.font = "20px Arial Black"; ctx.fillText("SFX", px + 100, py + 260);
            this.drawGDSubSlider(px + 220, py + 252, 250, this.sfxVolume);
            
            // Botones redondos inferiores del panel de pausa
            this.drawCircleButton(w/2 - 100, py + 340, 35, "#2df037", "▶");
            this.drawCircleButton(w/2 + 100, py + 340, 35, "#ff3333", "✖");
        }
    }

    drawCircleButton(x, y, r, color, icon) {
        this.ctx.save();
        this.ctx.fillStyle = color; this.ctx.strokeStyle = "#ffffff"; this.ctx.lineWidth = 4;
        this.ctx.beginPath(); this.ctx.arc(x, y, r, 0, Math.PI*2); this.ctx.fill(); this.ctx.stroke();
        this.ctx.fillStyle = "#ffffff"; this.ctx.font = "28px Arial"; this.ctx.textAlign = "center";
        this.ctx.fillText(icon, x, y + 10);
        this.ctx.restore();
    }

    drawGDSubSlider(x, y, w, value) {
        // Línea base del slider (Amarillo/marrón de fondo)
        this.ctx.fillStyle = "#554103"; this.ctx.fillRect(x, y, w, 12);
        // Línea rellena de volumen activo
        this.ctx.fillStyle = "#ffcc00"; this.ctx.fillRect(x, y, w * value, 12);
        // El círculo azul de control deslizante
        this.ctx.fillStyle = "#00a2ff"; this.ctx.strokeStyle = "#ffffff"; this.ctx.lineWidth = 2;
        this.ctx.beginPath(); this.ctx.arc(x + (w * value), y + 6, 14, 0, Math.PI*2); this.ctx.fill(); this.ctx.stroke();
    }

    click(x, y) {
        const w = this.canvas.width; const h = this.canvas.height;
        if (this.screen === "main") {
            if (Math.hypot(x - w/2, y - (h/2 + 20)) < 85) this.screen = "select";
            if (Math.hypot(x - (w/2 - 160), y - (h/2 + 50)) < 45) this.screen = "settings";
        } else if (this.screen === "select") {
            if (Math.hypot(x - 80, y - 80) < 35) { this.screen = "main"; return; }
            for (let i = 0; i < 5; i++) {
                let bx = w / 2 - 220, by = 130 + i * 85;
                if (x >= bx && x <= bx + 440 && y >= by && y <= by + 60) {
                    this.onStart(i + 1);
                }
            }
        } else if (this.screen === "settings") {
            let px = w/2 - 300, py = h/2 - 200;
            // Cerrar menú de ajustes
            if (Math.hypot(x - (w/2 - 100), y - (py + 340)) < 35 || Math.hypot(x - (w/2 + 100), y - (py + 340)) < 35) {
                this.screen = "main";
            }
            // Activar arrastre de sliders
            if (x >= px + 220 && x <= px + 470) {
                if (Math.abs(y - (py + 178)) < 20) this.isDraggingMusic = true;
                if (Math.abs(y - (py + 258)) < 20) this.isDraggingSFX = true;
            }
        }
    }

    moveSlider(x) {
        let px = this.canvas.width/2 - 300;
        let startX = px + 220;
        let pct = (x - startX) / 250;
        pct = Math.max(0, Math.min(1, pct));
        if (this.isDraggingMusic) this.musicVolume = pct;
        if (this.isDraggingSFX) this.sfxVolume = pct;
    }
}
