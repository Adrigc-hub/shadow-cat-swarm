class BossLevel {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.phase = 1;
        this.health = 100;
        this.timer = 0;
        this.projectiles = []; // Ataques físicos reales que viajan al centro
        this.bgFlash = 0;
    }

    update(centerX, centerY) {
        this.timer += 0.05;
        this.phase = Math.min(10, 11 - Math.ceil(this.health / 10));

        // El jefe genera ataques físicos reales dependiendo de la fase
        let attackInterval = Math.max(20, 60 - this.phase * 4); 
        if (Math.floor(this.timer * 20) % Math.floor(attackInterval) === 0) {
            let directions = ["left", "up", "right", "down"];
            let spawnDir = directions[Math.floor(Math.random() * directions.length)];
            
            this.projectiles.push({
                dir: spawnDir,
                x: spawnDir === "left" ? 0 : spawnDir === "right" ? this.canvas.width : centerX,
                y: spawnDir === "up" ? 0 : spawnDir === "down" ? this.canvas.height : centerY,
                speed: 4 + this.phase * 0.5,
                size: 25 + (this.phase > 5 ? 15 : 0), // Más grandes en fases altas
                type: this.phase >= 5 && Math.random() > 0.5 ? "laser" : "saw"
            });
        }

        // Mover los ataques hacia el centro
        this.projectiles.forEach((proj, index) => {
            if (proj.dir === "left") proj.x += proj.speed;
            if (proj.dir === "right") proj.x -= proj.speed;
            if (proj.dir === "up") proj.y += proj.speed;
            if (proj.dir === "down") proj.y -= proj.speed;

            // Calcular distancia a Pixiu
            let dist = Math.hypot(proj.x - centerX, proj.y - centerY);
            if (dist < 40) {
                // Impacto! El jugador no bloqueó a tiempo
                this.projectiles.splice(index, 1);
                window.dispatchEvent(new CustomEvent('playerDamage'));
            }
        });

        if (this.phase === 5 || this.phase >= 8) {
            this.bgFlash = Math.abs(Math.sin(this.timer * 8)) * 140;
        } else {
            this.bgFlash = 0;
        }
    }

    render(centerX, centerY) {
        const ctx = this.ctx;
        const w = this.canvas.width;

        // Fondo Rojo de Alerta Estroboscópica
        ctx.fillStyle = `rgb(${90 + this.bgFlash}, 5, 12)`;
        ctx.fillRect(0, 0, w, this.canvas.height);

        // --- BARRA DE VIDA SUPERIOR ---
        let bw = 460, bh = 22, bx = w / 2 - bw / 2, by = 40;
        ctx.fillStyle = "#000"; ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
        let segments = 10;
        let segW = (bw - (segments - 1) * 4) / segments;
        for (let i = 0; i < segments; i++) {
            ctx.fillStyle = (i < Math.ceil(this.health / 10)) ? "#ff1a1a" : "#210002";
            ctx.fillRect(bx + i * (segW + 4), by, segW, bh);
        }

        // --- DIBUJAR LOS PROYECTILES/OBSTÁCULOS EN PANTALLA ---
        this.projectiles.forEach(proj => {
            ctx.save();
            ctx.translate(proj.x, proj.y);
            ctx.rotate(this.timer * 4);
            
            if (proj.type === "saw") {
                // Sierra mecánica del video
                ctx.fillStyle = "#777"; ctx.strokeStyle = "#ff3300"; ctx.lineWidth = 3;
                ctx.beginPath();
                for (let d = 0; d < 8; d++) {
                    let a = (Math.PI / 4) * d;
                    ctx.lineTo(Math.cos(a) * proj.size, Math.sin(a) * proj.size);
                    ctx.lineTo(Math.cos(a+0.2) * (proj.size*0.6), Math.sin(a+0.2) * (proj.size*0.6));
                }
                ctx.closePath(); ctx.fill(); ctx.stroke();
            } else {
                // Orbe de energía eléctrica plasma (Fases avanzadas)
                let grad = ctx.createRadialGradient(0,0,2, 0,0, proj.size);
                grad.addColorStop(0, "#ffffff"); grad.addColorStop(0.3, "#00ffff"); grad.addColorStop(1, "transparent");
                ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(0,0, proj.size, 0, Math.PI*2); ctx.fill();
            }
            ctx.restore();
        });

        // Ojo gigante del boss flotando al fondo controlando el entorno
        ctx.fillStyle = "#222"; ctx.fillRect(w/2 - 50, 90, 100, 40);
        ctx.fillStyle = (this.phase === 5 || this.phase === 10) ? "#00ffff" : "#ff1a1a";
        ctx.beginPath(); ctx.arc(w/2, 110, 15, 0, Math.PI*2); ctx.fill();

        ctx.fillStyle = "#fff"; ctx.font = "20px 'Arial Black'"; ctx.textAlign = "center";
        ctx.fillText(`FUN TIME - FASE ${this.phase} / 10`, w / 2, 85);
    }
}
