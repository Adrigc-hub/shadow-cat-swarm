class BossLevel {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.phase = 1;
        this.health = 100;
        this.maxHealth = 100;
        this.x = 0;
        this.y = 0;
        this.timer = 0;
        
        // Configuración de los tentáculos/armas mecánicas del video
        this.weapons = [];
        this.bgRed = 0; // Control del parpadeo del fondo rojo
        this.isDead = false;
    }

    update() {
        this.timer += 0.03;
        this.x = this.canvas.width / 2 + Math.sin(this.timer * 1.5) * 20;
        this.y = this.canvas.height / 2 - 80 + Math.cos(this.timer) * 15;

        // Control dinámico de fases según la vida restante
        this.phase = Math.min(10, 11 - Math.ceil(this.health / 10));

        // Configurar armas mostradas según la fase del video
        this.weapons = [];
        let weaponCount = Math.min(this.phase + 2, 10); // Escala hasta 10 ganchos/sierras
        
        for (let i = 0; i < weaponCount; i++) {
            let angle = (Math.PI * 2 / weaponCount) * i + (this.timer * 0.5);
            // En fase alta, las armas se extienden y retraen salvajemente
            let length = 90 + Math.sin(this.timer * 3 + i) * 30;
            this.weapons.push({ angle, length, type: i % 2 === 0 ? 'saw' : 'hook' });
        }

        // Rayos de energía cian/rosa en fases críticas (Fase 5 y Fase 10)
        if (this.phase === 5 || this.phase === 10) {
            this.bgRed = Math.abs(Math.sin(this.timer * 5)) * 100; 
        } else {
            this.bgRed = 0;
        }
    }

    render() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        
        // Fondo rojo cambiante del video de fondo
        ctx.fillStyle = `rgb(${120 + this.bgRed}, 10, 15)`;
        ctx.fillRect(0, 0, w, this.canvas.height);

        // --- INTERFAZ: Barra de Vida Superior Segmentada (Estilo GD) ---
        let barW = 400;
        let barH = 20;
        let barX = w / 2 - barW / 2;
        let barY = 40;

        // Fondo negro de la barra
        ctx.fillStyle = "#000";
        ctx.fillRect(barX, barY, barW, barH);

        // Segmentos de vida rojos
        let segments = 10;
        let segW = (barW - (segments - 1) * 3) / segments;
        let activeSegments = Math.ceil((this.health / this.maxHealth) * segments);

        for (let i = 0; i < segments; i++) {
            ctx.fillStyle = i < activeSegments ? "#ff1a1a" : "#330000";
            ctx.fillRect(barX + i * (segW + 3), barY, segW, barH);
        }

        // Icono indicador del Boss al final de la barra
        ctx.fillStyle = "#ff3333";
        ctx.fillRect(barX + barW + 10, barY - 5, 30, 30);
        ctx.fillStyle = "#000";
        ctx.fillRect(barX + barW + 18, barY + 5, 14, 10); // Ojo del icono de la barra

        // --- RENDER DEL JEFE PRINCIPAL ---
        ctx.save();
        ctx.translate(this.x, this.y);

        // Dibujar brazos articulados mecánicos (Líneas grises gruesas)
        this.weapons.forEach(wp => {
            ctx.strokeStyle = "#555";
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            let wx = Math.cos(wp.angle) * wp.length;
            let wy = Math.sin(wp.angle) * wp.length;
            ctx.lineTo(wx, wy);
            ctx.stroke();

            // Punta del arma: Sierras circulares o pinzas del video
            ctx.fillStyle = "#888";
            ctx.beginPath();
            ctx.arc(wx, wy, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#fff";
            ctx.font = "12px Arial";
            ctx.fillText(wp.type === 'saw' ? "☼" : "⚓", wx - 5, wy + 5);
        });

        // Satélites flotantes laterales (Escoltas del cubo central)
        ctx.fillStyle = "#333333";
        let satOffset = 70 + Math.sin(this.timer * 2) * 10;
        ctx.fillRect(-satOffset - 15, -15, 30, 30);
        ctx.fillRect(satOffset - 15, -15, 30, 30);

        // Cuerpo central del Boss (Cubo gris segmentado)
        ctx.fillStyle = "#444";
        ctx.fillRect(-45, -45, 90, 90);
        ctx.strokeStyle = "#222";
        ctx.lineWidth = 4;
        ctx.strokeRect(-45, -45, 90, 90);

        // Núcleo central brillante (Fases cambian el color del ojo interior)
        let coreColor = (this.phase === 5 || this.phase === 10) ? "#00ffff" : "#ff0000";
        ctx.fillStyle = coreColor;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();

        // Efecto de destellos eléctricos cian si está en fases de sobrecarga
        if (this.phase >= 5) {
            ctx.strokeStyle = "#00ffff";
            ctx.lineWidth = 3;
            for(let i=0; i<4; i++) {
                ctx.beginPath();
                ctx.moveTo(Math.random()*40 - 20, Math.random()*40 - 20);
                ctx.lineTo(Math.random()*80 - 40, Math.random()*80 - 40);
                ctx.stroke();
            }
        }

        ctx.restore();

        // Letrero indicador de Fase en pantalla
        ctx.fillStyle = "#fff";
        ctx.font = "20px 'Arial Black'";
        ctx.fillText(`PHASE ${this.phase} / 10`, w / 2, 95);
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
        }
    }
}
