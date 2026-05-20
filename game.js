// --- RENDERIZADO CORREGIDO DE PIXIU (ESTILO FABULOUS BEASTS / ALL SAINTS STREET) ---
function drawPixiuCharacter(x, y) {
    ctx.save();
    ctx.translate(x, y);
    
    let timer = Date.now() * 0.006;
    let bounce = Math.sin(timer) * 3; // Animación de respiración/bote tierno

    // 1. COLA ESPONJOSA TRASERA (Fiel al diseño pachoncito del cómic)
    ctx.fillStyle = "#1c1c2b"; ctx.strokeStyle = "#ff0066"; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-35 + Math.cos(timer)*3, 10 + Math.sin(timer)*2, 16, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // 2. CUERPO RECHONCHO Y PATAS SHORTY
    ctx.fillStyle = "#242438"; ctx.strokeStyle = "#00ffcc"; ctx.lineWidth = 3.5;
    
    // Patitas traseras y delanteras cortas (óvalos redondos abajo del cuerpo)
    ctx.beginPath(); ctx.arc(-15, 28, 10, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(15, 28, 10, 0, Math.PI*2); ctx.fill(); ctx.stroke();

    // Cuerpo principal esférico/ovalado (Nada de cajas, es una bola de pelo)
    ctx.beginPath();
    ctx.ellipse(0, 5 + bounce, 38, 32, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // 3. CABEZA REDONDEADA Y GRANDES OREJAS
    ctx.fillStyle = "#2d2d44";
    ctx.beginPath();
    ctx.ellipse(0, -25 + bounce, 34, 28, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Orejas felinas redondeadas en las puntas (estilo el Pixiu del cómic)
    ctx.fillStyle = "#242438";
    ctx.beginPath();
    ctx.arc(-22, -45 + bounce, 12, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.arc(22, -45 + bounce, 12, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    // Interior de la oreja rosa tierno
    ctx.fillStyle = "#ff6699";
    ctx.beginPath(); ctx.arc(-22, -45 + bounce, 6, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(22, -45 + bounce, 6, 0, Math.PI*2); ctx.fill();

    // 4. LOS DOS CUERNOS DORADOS MÍSTICOS (Curvos hacia atrás, arriba de su frente)
    ctx.fillStyle = "#ffd700"; ctx.strokeStyle = "#b58900"; ctx.lineWidth = 2;
    // Cuerno Izquierdo
    ctx.beginPath();
    ctx.moveTo(-10, -48 + bounce);
    ctx.quadraticCurveTo(-18, -68 + bounce, -8, -72 + bounce);
    ctx.quadraticCurveTo(-4, -62 + bounce, -2, -48 + bounce);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // Cuerno Derecho
    ctx.beginPath();
    ctx.moveTo(10, -48 + bounce);
    ctx.quadraticCurveTo(18, -68 + bounce, 8, -72 + bounce);
    ctx.quadraticCurveTo(4, -62 + bounce, 2, -48 + bounce);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // 5. CARITA ADORABLE DE ANIME (Grandes ojos brillantes de Pixiu)
    ctx.fillStyle = "#00ffcc"; // Ojos neón circulares grandecitos
    ctx.beginPath(); ctx.arc(-12, -22 + bounce, 6, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(12, -22 + bounce, 6, 0, Math.PI*2); ctx.fill();
    
    // Brillo blanco en los ojos
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(-14, -24 + bounce, 2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(10, -24 + bounce, 2, 0, Math.PI*2); ctx.fill();

    // Nariz pequeña triangular y boca de gato "w"
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-4, -14 + bounce); ctx.lineTo(0, -11 + bounce); ctx.lineTo(4, -14 + bounce);
    ctx.stroke();

    // 6. DETALLES DE CORAZÓN / MARCAS EN EL PECHO
    ctx.fillStyle = "#ff0066";
    ctx.beginPath();
    ctx.moveTo(0, -2 + bounce);
    ctx.bezierCurveTo(-6, -8 + bounce, -12, -2 + bounce, 0, 8 + bounce);
    ctx.bezierCurveTo(12, -2 + bounce, 6, -8 + bounce, 0, -2 + bounce);
    ctx.fill();

    ctx.restore();
}
