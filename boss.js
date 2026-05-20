class BossLevel {
    constructor(canvas, ctx) {
        this.canvas = canvas; this.ctx = ctx;
        this.phase = 1;
        this.health = 100;
        this.x = canvas.width / 2;
        this.y = canvas.height / 2 - 80;
        this.timer = 0;
        this.weapons = [];
        this.bgFlash = 0;
    }

    update() {
        this.timer += 0.05;
        // Movimiento flotante robótico del boss
        this.x = this.canvas.width / 2 + Math.sin(this.timer * 2) * 45;
        this.y = this.canvas.height / 2 - 90 + Math.cos(this.timer * 1.2) * 25;

        // El jefe muta y avanza de fase según la barra de vida superior
        this.phase = Math.min(10, 11 - Math.ceil(this.health / 10));

        // Armas mecánicas circulares que aumentan en cada fase (Igual que en el video)
        this.weapons = [];
        let totalWeapons = Math.min(this.phase + 2, 10);
        for (let i = 0; i < totalWeapons; i++) {
            let baseAngle = (Math.PI * 2 / totalWeapons) * i + (this.timer * 0.4);
            // Las armas se estiran violentamente simulando el ataque del video
            let reach = 95 + Math.sin(this.timer * 4 + i) * 35;
            this.weapons.push({
                angle: baseAngle,
                len: reach,
                type: i % 3 === 0 ? "saw" : i % 3 === 1 ? "hook" : "spike"
            });
        }

        // Parpadeos estroboscópicos de fondo en fases críticas (Fase 5, 8 y 10)
        if (this.phase === 5 || this.phase >= 8) {
            this.bgFlash = Math.abs(Math.sin(this.timer * 6)) * 120;
        } else {
            this.bgFlash = 0;
        }
    }

    render() {
        const ctx = this.ctx; const w = this.canvas.width;
        
        // FONDO ROJO DE TERROR Y ALERTA (Fiel al video original)
        ctx.fillStyle = `rgb(${110 + this.bgFlash}, 5, 10)`;
        ctx.fillRect(0, 0, w, this.canvas.height);

        // --- BARRA DE VIDA SUPERIOR SEGMENTADA ESTILO GD ---
        let bw = 460, bh = 22, bx = w / 2 - bw / 2, by = 40;
        ctx.fillStyle = "#000000"; ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);

        let segments = 10;
        let segW = (bw - (segments - 1) * 4) / segments;
        for (let i = 0; i < segments; i++) {
            // Se apagan los bloques rojos al quitarle vida
            ctx.fillStyle = (i < Math.ceil(this.health / 10)) ? "#ff1a1a" : "#2b0000";
            ctx.fillRect(bx + i * (segW + 4), by, segW, bh);
        }
        
        // Marcador del Cubo Boss al final de su vida
        ctx.fillStyle = "#ff2a2a"; ctx.fillRect(bx + bw + 12, by - 4, 30, 30);
        ctx.fillStyle = "#000"; ctx.fillRect(bx + bw + 20, by + 4, 14, 8); // Ojo del icono

        // --- DIBUJO DEL JEFE ---
        ctx.save();
        ctx.translate(this.x, this.y);

        // 1. Renderizar los brazos mecánicos extensibles
        this.weapons.forEach(wp => {
            ctx.strokeStyle = "#4d4d4d"; ctx.lineWidth = 8;
            ctx.beginPath(); ctx.moveTo(0, 0);
            let targetX = Math.cos(wp.angle) * wp.len;
            let targetY = Math.sin(wp.angle) * wp.len;
            ctx.lineTo(targetX, targetY); ctx.stroke();

            // Cabezales de ataque: Sierras circulares dentadas y anclas
            ctx.save();
            ctx.translate(targetX, targetY);
            ctx.rotate(this.timer * 5); // Rotación a mil por hora de las sierras
            ctx.fillStyle = "#999999"; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2;
            if (wp.type === "saw") {
                // Dibujar dientes de sierra reales
                ctx.beginPath();
                for (let d = 0; d < 8; d++) {
                    let a = (Math.PI / 4) * d;
                    ctx.lineTo(Math.cos(a) * 22, Math.sin(a) * 22);
                    ctx.lineTo(Math.cos(a + 0.2) * 14, Math.sin(a + 0.2) * 14);
                }
                ctx.closePath(); ctx.fill(); ctx.stroke();
            } else {
                // Ancla o pinza pesada
                ctx.fillRect(-12, -12, 24, 24);
                ctx.fillStyle = "#ff3333"; ctx.fillRect(-5, -5, 10, 10);
            }
            ctx.restore();
        });

        // 2. Satélites flotantes gemelos laterales
        ctx.fillStyle = "#262626"; ctx.strokeStyle = "#000000"; ctx.lineWidth = 4;
        let sDist = 85 + Math.sin(this.timer * 3) * 12;
        ctx.fillRect(-sDist - 15, -15, 30, 30); ctx.strokeRect(-sDist - 15, -15, 30, 30);
        ctx.fillRect(sDist - 15, -15, 30, 30); ctx.strokeRect(sDist - 15, -15, 30, 30);

        // Ojos de los satélites
        ctx.fillStyle = "#ff1a1a";
        ctx.fillRect(-sDist - 4, -4, 8, 8); ctx.fillRect(sDist - 4, -4, 8, 8);

        // 3. El gran Cubo Central Gris Blindado
        ctx.fillStyle = "#3a3a3a"; ctx.strokeStyle = "#1a1a1a"; ctx.lineWidth = 6;
        ctx.fillRect(-50, -50, 100, 100); ctx.strokeRect(-50, -50, 100, 100);
        
        // Placas internas del robot
        ctx.fillStyle = "#2b2b2b"; ctx.fillRect(-35, -35, 70, 70);

        // 4. El Ojo / Núcleo de Energía Variable
        // Cambia a azul cian brillante en sobrecarga como en el segundo 0:08 del video
        let coreColor = (this.phase === 5 || this.phase === 10) ? "#00ffff" : "#ff1a1a";
        ctx.fillStyle = coreColor; ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(-5, -5, 6, 0, Math.PI*2); ctx.fill(); // Brillo de lente

        // Rayos cian brotando si el núcleo está sobrecargado
        if (this.phase === 5 || this.phase === 10) {
            ctx.strokeStyle = "#00ffff"; ctx.lineWidth = 4;
            for(let k=0; k<5; k++) {
                ctx.beginPath();
                ctx.moveTo(Math.random()*30-15, Math.random()*30-15);
                ctx.lineTo(Math.random()*120-60, Math.random()*120-60);
                ctx.stroke();
            }
        }

        ctx.restore();

        // Letrero indicador de fase actual
        ctx.fillStyle = "#ffffff"; ctx.font = "22px 'Arial Black'"; ctx.textAlign = "center";
        ctx.fillText(`FASE ${this.phase} / 10`, w / 2, 95);
    }
}
