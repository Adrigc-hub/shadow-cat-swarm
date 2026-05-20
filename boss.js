class BossLevel {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.phase = 1;
        this.health = 100;
        this.timer = 0;
        this.weapons = [];
        this.bgFlash = 0;
    }

    update() {
        this.timer += 0.05;
        
        // El jefe calcula su fase de 1 a 10 según la vida restante
        this.phase = Math.min(10, 11 - Math.ceil(this.health / 10));

        // Configuración de ganchos, sierras y pinzas que encierran al jugador
        this.weapons = [];
        let totalWeapons = Math.min(this.phase + 2, 10);
        
        for (let i = 0; i < totalWeapons; i++) {
            // Ángulos distribuidos en 360 grados apuntando al centro
            let angle = (Math.PI * 2 / totalWeapons) * i + (this.timer * 0.3);
            // Efecto de vaivén salvaje (ataque y retracción de maquinaria)
            let radius = 220 + Math.sin(this.timer * 5 + i) * 40;
            this.weapons.push({ angle, radius, type: i % 2 === 0 ? "saw" : "hook" });
        }

        // Flashes de alerta roja extrema en fases críticas
        if (this.phase === 5 || this.phase >= 8) {
            this.bgFlash = Math.abs(Math.sin(this.timer * 7)) * 130;
        } else {
            this.bgFlash = 0;
        }
    }

    render(playerX, playerY) {
        const ctx = this.ctx;
        const w = this.canvas.width;

        // Fondo de alerta rojo oscuro del video
        ctx.fillStyle = `rgb(${100 + this.bgFlash}, 8, 12)`;
        ctx.fillRect(0, 0, w, this.canvas.height);

        // --- BARRA DE VIDA SUPERIOR SEGMENTADA (Fiel a tu captura) ---
        let bw = 460, bh = 22, bx = w / 2 - bw / 2, by = 40;
        ctx.fillStyle = "#000"; ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);

        let segments = 10;
        let segW = (bw - (segments - 1) * 4) / segments;
        for (let i = 0; i < segments; i++) {
            ctx.fillStyle = (i < Math.ceil(this.health / 10)) ? "#ff1a1a" : "#260000";
            ctx.fillRect(bx + i * (segW + 4), by, segW, bh);
        }
        // Icono de la barra del Boss
        ctx.fillStyle = "#ff2a2a"; ctx.fillRect(bx + bw + 12, by - 4, 30, 30);

        // --- RENDERIZADO DEL JEFE (MAQUINARIA ENVOLVENTE) ---
        this.weapons.forEach(wp => {
            // Calcular posición de la base del brazo mecánico (fuera de la pantalla)
            let baseX = playerX + Math.cos(wp.angle) * 500;
            let baseY = playerY + Math.sin(wp.angle) * 500;
            
            // Posición de la punta de ataque de la sierra/gancho
            let tipX = playerX + Math.cos(wp.angle) * wp.radius;
            let tipY = playerY + Math.sin(wp.angle) * wp.radius;

            // Dibujar estructura metálica del brazo
            ctx.strokeStyle = "#3a3a3a"; ctx.lineWidth = 10;
            ctx.beginPath(); ctx.moveTo(baseX, baseY); ctx.lineTo(tipX, tipY); ctx.stroke();
            ctx.strokeStyle = "#555"; ctx.lineWidth = 4; ctx.stroke();

            // Renderizado de las cabezas de las armas (Sierras giratorias del video)
            ctx.save();
            ctx.translate(tipX, tipY);
            ctx.rotate(this.timer * 6); // Giro rápido de engranaje
            
            ctx.fillStyle = "#8c8c8c"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
            if (wp.type === "saw") {
                ctx.beginPath();
                for (let d = 0; d < 10; d++) {
                    let a = (Math.PI / 5) * d;
                    ctx.lineTo(Math.cos(a) * 25, Math.sin(a) * 25);
                    ctx.lineTo(Math.cos(a + 0.1) * 16, Math.sin(a + 0.1) * 16);
                }
                ctx.closePath(); ctx.fill(); ctx.stroke();
            } else {
                // Pinzas mecánicas pesadas cuadradas
                ctx.fillRect(-14, -14, 28, 28);
                ctx.fillStyle = "#ff1a1a"; ctx.fillRect(-6, -6, 12, 12);
            }
            ctx.restore();
        });

        // Satélites flotantes que custodian los flancos del centro
        ctx.fillStyle = "#222"; ctx.strokeStyle = "#000"; ctx.lineWidth = 4;
        let sDist = 130 + Math.sin(this.timer * 3) * 15;
        ctx.fillRect(playerX - sDist - 15, playerY - 15, 30, 30); ctx.strokeRect(playerX - sDist - 15, playerY - 15, 30, 30);
        ctx.fillRect(playerX + sDist - 15, playerY - 15, 30, 30); ctx.strokeRect(playerX + sDist - 15, playerY - 15, 30, 30);

        // Ojo central de energía cian/azul en sobrecarga (Seg 0:08 del video)
        ctx.save();
        ctx.translate(playerX, playerY - 160); // Flota arriba de Pixie
        ctx.fillStyle = "#3a3a3a"; ctx.fillRect(-45, -45, 90, 90);
        let coreColor = (this.phase === 5 || this.phase === 10) ? "#00ffff" : "#ff1a1a";
        ctx.fillStyle = coreColor; ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI*2); ctx.fill();
        
        if (this.phase === 5 || this.phase === 10) {
            ctx.strokeStyle = "#00ffff"; ctx.lineWidth = 3;
            for(let k=0; k<4; k++) {
                ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.random()*100-50, Math.random()*100-50); ctx.stroke();
            }
        }
        ctx.restore();

        // Texto indicador de fase superior
        ctx.fillStyle = "#fff"; ctx.font = "22px 'Arial Black'"; ctx.textAlign = "center";
        ctx.fillText(`FASE ${this.phase} / 10`, w / 2, 95);
    }
}
