/* --- Shadow Cat: Edición Jujutsu Kaisen 2.0 (Change of Scene & Sukuna Boss) --- */
let ancho = 360, alto = 640;

// Sistema de Audio Web Pro (Audio Puro & Polifónico sin p5.sound)
let audioCtx;

// --- DICCIONARIO DE FRECUENCIAS ---
let NOTAS = {
    'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
    'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
    'C6': 1046.50, 'C#6': 1109.73, 'D6': 1174.66, 'E6': 1318.51
};

// --- TRACKS MUSICALES ---
let encodingSweetly = ['E5', 'G5', 'C6', 'G5', 'E5', 'G5', 'C6', 'G5', 'D5', 'F5', 'B5', 'F5'];
let encodingGDChangeOfScene = [
    'A3', 'E4', 'A4', 'C5', 'E4', 'A4', 'C5', 'E4', 'A4', 'C5', 'E4', 'A4',
    'G3', 'E4', 'G4', 'B4', 'E4', 'G4', 'B4', 'E4', 'G4', 'B4', 'E4', 'G4',
    'F3', 'C4', 'F4', 'A4', 'C4', 'F4', 'A4', 'C4', 'F4', 'A4', 'C4', 'F4',
    'E3', 'B3', 'E4', 'G#4', 'B3', 'E4', 'G#4', 'B3', 'E4', 'G#4', 'B3', 'E4',
    'A4', 'C5', 'E5', 'A5', 'E5', 'C5', 'B4', 'D5', 'F5', 'B5', 'F5', 'D5'
];
let indiceNotaMusica = 0;

// --- CONFIGURACIÓN DE LOS SUB-JUEGOS ---
let modoActualSubJuego = "JUJUTSU"; // "JUJUTSU" o "MEGUMI_BANG"
let estadoPantalla = 'menu_construccion'; // Arranca directo en tu lista de niveles guardados

// Variables Megumi (Modo DANCE / BANG)
let megumiX, megumiY, targetX;
let balasMegumi = [];

// Variables Sukuna/Gojo (Modo SHOOT / JUJUTSU)
let estadoPantallaJujutsu = 'menu';
let puntosTotalesBanco = 150, skinSeleccionada = 'gojo';
let tieneEscudo1_Disponible = false, tieneEscudo2_Disponible = false, tieneAimbot_Disponible = false;
let gatoX, gatoY = 480, gatoRadio = 22, colasAngulo = 0, gatoVelX = 0, pistolaTimer = 0, pistolaAngulo = 0;
let rafagaPendiente = 0, rafagaTimer = 0, objetivoAsignado = null;
let balas = [], objetivos = [], misilesPropios = [], chispas = [];
let puntos = 0, balasEsquivadasContador = 0, balasEsquivadasTotal = 0, juegoVivo = true, temporizadorJefe = 0, jefe = null, escudoActivo = false, tiempoEscudoRestante = 0;
let ejecutandoAnimacion = false, animacionFrame = 0, cinemanticaMahoX = 180, cinemanticaMahoY = -50, azulX = 180, azulY = 240, rojoX = 180, rojoY = 500, explosionRadio = 0;
let faseLastBreath = false, bossHP = 100, gatoHP = 30, gatoHPMax = 30, bossX, bossY = 120, cajaX = 80, cajaY = 320, cajaW = 200, cajaH = 200;
let ataqueTimer = 0, turnoJefe = true, bossMensaje = "", bossMensajeTimer = 0, jefeFaseActual = 1, usarGravedad = false, gatoVy = 0;
let gravedadPoder = 0.43, saltoFuerzaMax = -7.8, botonPresionadoTiempo = 0, blastersLista = [], blasterAnchoLaser = 55, frenesiAngular = 0;
let UT_barraX = 60, UT_barraY = 230, UT_barraW = 240, UT_barraH = 40, UT_lineaX = 60, UT_lineaVel = 6.0, UT_ataqueDetenido = false, UT_resultadoTexto = "", UT_resultadoTimer = 0;
let modoFuriaActivo = false, yaAlcanzoMitadVida = false, ejecutandoAnimacionMuerteFuria = false, animMuerteTimer = 0;

// Lista Estática de niveles (idéntica a tus datos de LocalStorage)
let listaNivelesSimulados = [
    { nombre: "Mi Nivel SpaceX (DANCE)", tipo: "DANCE", y: 260 },
    { nombre: "Mi Nivel SpaceX (SHOOT)", tipo: "SHOOT", y: 310 },
    { nombre: "Mi Nivel SpaceX (SHOOT)", tipo: "SHOOT", y: 360 },
    { nombre: "Mi Nivel SpaceX (DANCE)", tipo: "DANCE", y: 410 },
    { nombre: "Mi Nivel SpaceX (NORMAL)", tipo: "NORMAL", y: 460 }
];

function setup() {
    createCanvas(ancho, alto);
    gatoX = ancho / 2;
    megumiX = ancho / 2;
    megumiY = alto - 150;
    targetX = megumiX;
}

function draw() {
    if (estadoPantalla === 'menu_construccion') {
        dibujarMenuConstruccionDispositivo();
    } else if (estadoPantalla === 'juego') {
        if (modoActualSubJuego === "MEGUMI_BANG") {
            ejecutarModoMegumiBang();
        } else {
            ejecutarLogicaJuegoJujutsu();
        }
    }
}

// --- PANTALLA EXCLUSIVA DE TU MENÚ VERDE DE CONSTRUCCIÓN ---
function dibujarMenuConstruccionDispositivo() {
    background(5, 5, 10);
    
    // Título Superior
    fill(255); textAlign(CENTER, TOP); textStyle(BOLD); textSize(18);
    text("MODO CONSTRUCCIÓN", ancho / 2, 80);
    
    // Botones de Herramientas Superiores (Lupa / Reciente)
    stroke(0, 255, 150); strokeWeight(1.5); noFill();
    rect(30, 130, 140, 35, 4);
    rect(190, 130, 140, 35, 4);
    
    fill(0, 255, 150); noStroke(); textSize(12);
    text("🔍 LUPA", 100, 142);
    text("⏳ RECIENTE", 260, 142);
    
    // Botón CREAR NUEV0
    fill(0, 255, 150); rect(30, 185, 300, 40, 2);
    fill(0); textStyle(BOLD); textSize(13);
    text("🛠️ NEW (CREAR)", ancho / 2, 198);
    
    // Caja del Contenedor Principal de Niveles
    stroke(0, 255, 150); strokeWeight(2); noFill();
    rect(30, 240, 300, 270);
    
    // Renderizado y dibujo de los niveles dentro del contenedor
    let mouseEnNivel = false;
    for (let n of listaNivelesSimulados) {
        // Línea divisoria
        stroke(0, 255, 150, 80); strokeWeight(1);
        line(30, n.y + 40, 330, n.y + 40);
        
        // Icono de caja de nivel y Texto
        noStroke(); fill(255); textAlign(LEFT, CENTER); textStyle(NORMAL); textSize(12);
        text("📦  " + n.nombre, 50, n.y + 20);
    }
    
    // Botón VOLVER abajo
    fill(0, 255, 150); rect(30, 530, 300, 42, 4);
    fill(0); textAlign(CENTER, CENTER); textStyle(BOLD); text("VOLVER", ancho / 2, 551);
}

// --- DETECTOR TÁCTIL ABSOLUTO (PANTALLA COMPLETA) ---
function mousePressed() {
    iniciarAudio();
    
    if (estadoPantalla === 'menu_construccion') {
        // Verificar si se presionó el botón VOLVER inferior
        if (mouseX > 30 && mouseX < 330 && mouseY > 530 && mouseY < 572) {
            // Regresa al menú básico de Jujutsu
            estadoPantalla = 'juego';
            estadoPantallaJujutsu = 'menu';
            modoActualSubJuego = "JUJUTSU";
            return;
        }

        // Intercepta de forma matemática el toque en cada renglón de nivel guardado
        for (let n of listaNivelesSimulados) {
            if (mouseX > 30 && mouseX < 330 && mouseY > n.y && mouseY < n.y + 40) {
                console.log("👉 Iniciando nivel seleccionado: " + n.nombre);
                
                // Configurar tipo de sub-juego según la palabra clave
                if (n.tipo === "DANCE") {
                    modoActualSubJuego = "MEGUMI_BANG";
                    frameCount = 0;
                    balasMegumi = [];
                } else {
                    modoActualSubJuego = "JUJUTSU";
                    iniciarPartidaLimpia();
                    estadoPantallaJujutsu = 'juego';
                }
                estadoPantalla = 'juego'; // Entrar al gameplay
                break;
            }
        }
        return;
    }

    // Controles táctiles del sub-juego Megumi (Bang Bang)
    if (estadoPantalla === 'juego' && modoActualSubJuego === "MEGUMI_BANG") {
        if (frameCount > 200) {
            frameCount = 0;
            balasMegumi = [];
        }
        return;
    }

    // Controles táctiles del sub-juego Jujutsu/Sukuna Boss
    if (estadoPantalla === 'juego' && modoActualSubJuego === "JUJUTSU") {
        if (estadoPantallaJujutsu === 'menu') {
            if (mouseX > 60 && mouseX < 300 && mouseY > 260 && mouseY < 310) { iniciarPartidaLimpia(); estadoPantallaJujutsu = 'juego'; }
            else if (mouseX > 60 && mouseX < 300 && mouseY > 330 && mouseY < 380) estadoPantallaJujutsu = 'tienda';
            else if (mouseX > 60 && mouseX < 300 && mouseY > 400 && mouseY < 450) estadoPantallaJujutsu = 'skins';
            return;
        }
        if (estadoPantallaJujutsu === 'tienda') {
            if (mouseX > 30 && mouseX < 330 && mouseY > 140 && mouseY < 220 && !tieneEscudo1_Disponible && puntosTotalesBanco >= 15) { puntosTotalesBanco -= 15; tieneEscudo1_Disponible = true; }
            if (mouseX > 30 && mouseX < 330 && mouseY > 240 && mouseY < 320 && !tieneEscudo2_Disponible && puntosTotalesBanco >= 30) { puntosTotalesBanco -= 30; tieneEscudo2_Disponible = true; }
            if (mouseX > 60 && mouseX < 300 && mouseY > 520 && mouseY < 565) estadoPantallaJujutsu = 'menu';
            return;
        }
        if (estadoPantallaJujutsu === 'skins') {
            if (mouseX > 40 && mouseX < ancho - 40) {
                if (mouseY > 130 && mouseY < 215) skinSeleccionada = 'normal';
                if (mouseY > 240 && mouseY < 325) skinSeleccionada = 'gojo';
                if (mouseY > 350 && mouseY < 435) skinSeleccionada = 'yuji';
            }
            if (mouseX > 60 && mouseX < 300 && mouseY > 520 && mouseY < 565) estadoPantallaJujutsu = 'menu';
            return;
        }
        if (estadoPantallaJujutsu === 'juego') {
            if (faseLastBreath) {
                if (!juegoVivo) { estadoPantalla = 'menu_construccion'; return; }
                if (!turnoJefe && !UT_ataqueDetenido) {
                    UT_ataqueDetenido = true; UT_resultadoTimer = 45;
                    let centroBarra = UT_barraX + UT_barraW / 2;
                    let distC = abs(UT_lineaX - centroBarra);
                    let dmg = modoFuriaActivo ? 4 : 2; if (balasEsquivadasContador > 0) dmg += (balasEsquivadasContador * 0.4);
                    if (distC < 20) { UT_resultadoTexto = "¡CRÍTICO NEGRO x2!"; dmg *= 2; sonarSFX('laser'); } 
                    else { UT_resultadoTexto = "Impacto Seguro"; sonarSFX('corte'); }
                    balasEsquivadasContador = 0;
                    misilesPropios.push({ x: gatoX, y: gatoY - 10, vx: 0, vy: -12, daño: dmg });
                }
                return;
            }
            if (mouseY > alto - 100) { if (tieneEscudo1_Disponible && !escudoActivo) { escudoActivo = true; tiempoEscudoRestante = 300; } } 
            else if (juegoVivo) {
                for (let o of objetivos) {
                    if (dist(mouseX, mouseY, o.x, o.y) < (o.esJefe ? o.w/2 + 30 : o.r + 30)) {
                        if (balasEsquivadasContador > 0 && rafagaPendiente === 0) { objetivoAsignado = o; rafagaPendiente = 4; } break;
                    }
                }
            } else { estadoPantalla = 'menu_construccion'; }
        }
    }
}

// ============================================================================
// LOGICA DE SUB-JUEGO 1: MEGUMI DODGING (DANCE MODE / BANG BANG BANG)
// ============================================================================
function ejecutarModoMegumiBang() {
    background(10, 10, 18, 80); 

    // Líneas de velocidad verticales
    stroke(255, 255, 255, 30); strokeWeight(1);
    for (let i = 0; i < 5; i++) {
        let ly = (frameCount * 10 + i * 150) % alto;
        line(random(ancho), ly, random(ancho), ly + 40);
    }

    // Botón flotante para salir al menú de construcción
    fill(200, 30, 30); noStroke(); rect(ancho - 90, 20, 80, 25, 4);
    fill(255); textAlign(CENTER, CENTER); textSize(10); textStyle(BOLD); text("SALIR", ancho - 50, 32);

    if (mouseX > ancho - 90 && mouseX < ancho - 10 && mouseY > 20 && mouseY < 45 && mouseIsPressed) {
        estadoPantalla = 'menu_construccion'; return;
    }

    // Tiempos musicales exactos del "Bang Bang Bang"
    if (frameCount === 90) { balasMegumi.push({ x: ancho / 2 - 40, y: -50, vx: 0, vy: 25 }); sonarSFX('daño'); }
    if (frameCount === 120) { balasMegumi.push({ x: ancho / 2 + 50, y: -50, vx: -5, vy: 28 }); sonarSFX('daño'); }
    if (frameCount === 150) { balasMegumi.push({ x: ancho / 2 - 10, y: -50, vx: 2, vy: 32 }); sonarSFX('daño'); }

    // Procesamiento de proyectiles
    for (let i = balasMegumi.length - 1; i >= 0; i--) {
        balasMegumi[i].y += balasMegumi[i].vy;
        balasMegumi[i].x += balasMegumi[i].vx;
        
        stroke(0, 255, 255); strokeWeight(4);
        line(balasMegumi[i].x, balasMegumi[i].y, balasMegumi[i].x - balasMegumi[i].vx*2, balasMegumi[i].y - balasMegumi[i].vy*2);
        
        // Evasión automática controlada por proximidad lineal
        if (balasMegumi[i].y > megumiY - 120 && balasMegumi[i].y < megumiY + 50) {
            if (abs(balasMegumi[i].x - targetX) < 60) {
                targetX = (balasMegumi[i].x > ancho/2) ? ancho/2 - 90 : ancho/2 + 90;
            }
        }
        if (balasMegumi[i].y > alto) balasMegumi.splice(i, 1);
    }

    if (balasMegumi.length === 0) targetX = ancho / 2;
    megumiX = lerp(megumiX, targetX, 0.25);

    // Render de Megumi Fushiguro (Silueta Anime)
    push(); translate(megumiX, megumiY);
    if (abs(megumiX - ancho/2) > 20) {
        noFill(); stroke(100, 0, 255, 150); strokeWeight(random(2, 6));
        ellipse(0, -40, 90 + random(10), 130 + random(10));
    }
    noStroke(); fill(20, 24, 35); rect(0, 30, 80, 60, 10);
    fill(15, 18, 26); quad(-15, 0, 15, 0, 20, -25, -20, -25);
    fill(245, 222, 179); ellipse(0, -35, 40, 50);

    // Cabello de punta
    fill(10, 12, 18);
    beginShape();
    vertex(-25, -35); vertex(-45, -55); vertex(-25, -50); vertex(-40, -75); vertex(-15, -60); vertex(-15, -90);
    vertex(0, -65); vertex(15, -90); vertex(15, -60); vertex(40, -75); vertex(25, -50); vertex(45, -55);
    vertex(20, -35); vertex(0, -20);
    endShape(CLOSE);
    
    stroke(10, 12, 18); strokeWeight(3);
    line(-12, -38, -4, -36); line(12, -38, 4, -36);
    pop();

    if (frameCount > 220) frameCount = 0; 
}

// ============================================================================
// LOGICA DE SUB-JUEGO 2: JUJUTSU KAISEN ENTORNO COMPLETO (SUKUNA BOSS)
// ============================================================================
function ejecutarLogicaJuegoJujutsu() {
    if (estadoPantallaJujutsu === 'menu') dibujarMenuPrincipal();
    else if (estadoPantallaJujutsu === 'tienda') dibujarTiendaMejoras();
    else if (estadoPantallaJujutsu === 'skins') dibujarSelectorSkins();
    else if (estadoPantallaJujutsu === 'juego') ejecutarMotorGameplayJujutsu();
}

function ejecutarMotorGameplayJujutsu() {
    reproducirMusica();
    if (ejecutandoAnimacionMuerteFuria) { actualizarAnimacionMuerteFuria(); return; }
    if (ejecutandoAnimacion) { actualizarNuevaAnimacionAnime(); return; }
    if (faseLastBreath) { logicaCombateSukuna(); return; }

    background(15, 15, 25);
    
    // Botón Volver rápido para salir del sub-juego
    fill(255, 0, 50, 120); noStroke(); rect(ancho - 75, 15, 60, 22, 4);
    fill(255); textAlign(CENTER, CENTER); textSize(9); text("MENÚ", ancho - 45, 26);
    if (mouseIsPressed && mouseX > ancho - 75 && mouseX < ancho - 15 && mouseY > 15 && mouseY < 37) {
        estadoPantalla = 'menu_construccion'; return;
    }

    if (juegoVivo) {
        if (puntosGlobalesTotal >= 100) {
            ejecutandoAnimacion = true; animacionFrame = 0;
            cinemanticaMahoX = ancho / 2; cinemanticaMahoY = -60;
            azulX = ancho / 2; azulY = -20; rojoX = ancho / 2; rojoY = gatoY - 30;
            explosionRadio = 0; return;
        }

        let posXAnterior = gatoX;
        if (mouseIsPressed && mouseY < alto - 120) {
            let tocandoObjetivo = false;
            for (let o of objetivos) { if (dist(mouseX, mouseY, o.x, o.y) < (o.esJefe ? o.w/2 : o.r) + 30) tocandoObjetivo = true; }
            if (!tocandoObjetivo) gatoX = lerp(gatoX, mouseX, 0.25);
        }
        gatoX = constrain(gatoX, gatoRadio, ancho - gatoRadio);
        gatoVelX = gatoX - posXAnterior;

        if (escudoActivo) {
            if (--tiempoEscudoRestante <= 0) escudoActivo = false;
            noFill(); stroke(0, 255, 255, 200); strokeWeight(3); ellipse(gatoX, gatoY - 10, gatoRadio * 2.8);
        }

        if (frameCount % 18 === 0) { balas.push({ x: random(20, ancho - 20), y: -10, vy: random(6, 9), tipo: "normal" }); sonarSFX('normal'); }
        if (frameCount % 45 === 0 && random() < 0.6) objetivos.push({ x: random(30, ancho - 30), y: -20, vy: random(3, 5), r: 12, esJefe: false });

        temporizadorJefe++;
        if (temporizadorJefe >= 600 && temporizadorJefe < 690) {
            if (random() < 0.08 && !jefe) {
                jefe = { x: random(60, ancho - 60), y: -40, vy: 1.5, vidaMax: 20, vida: 20, w: 70, h: 70, esJefe: true };
                objetivos.push(jefe); temporizadorJefe = 0;
            }
        } else if (temporizadorJefe >= 690) { temporizadorJefe = 0; }

        if (rafagaPendiente > 0) {
            rafagaTimer--;
            if (rafagaTimer <= 0 && balasEsquivadasContador > 0) {
                let tProyectil = skinSeleccionada === 'gojo' ? "fusiónPurpura" : (skinSeleccionada === 'yuji' ? "desmantelar" : "estándar");
                if (skinSeleccionada === 'gojo') sonarSFX('purpura'); else if (skinSeleccionada === 'yuji') sonarSFX('corte');
                misilesPropios.push({ x: gatoX, y: gatoY - 30, targetObj: objetivoAsignado, tipoProyectil: tProyectil, faseEfecto: 0 });
                balasEsquivadasContador--; rafagaPendiente--; rafagaTimer = 5; pistolaTimer = 5;
            } else if (balasEsquivadasContador <= 0) { rafagaPendiente = 0; }
        }

        for (let i = balas.length - 1; i >= 0; i--) {
            balas[i].y += balas[i].vy; stroke(0, 190, 255); strokeWeight(3); line(balas[i].x, balas[i].y, balas[i].x, balas[i].y - 18);
            if (balas[i].y > alto + 20) {
                if (balas[i].y > gatoY + 20) {
                    balasEsquivadasContador++; balasEsquivadasTotal++;
                    if (tieneEscudo2_Disponible && balasEsquivadasTotal % 10 === 0) { escudoActivo = true; tiempoEscudoRestante = 600; }
                }
                balas.splice(i, 1); continue;
            }
            if (dist(balas[i].x, balas[i].y, gatoX, gatoY - 10) < gatoRadio + 5) {
                if (escudoActivo) { balas.splice(i, 1); continue; }
                juegoVivo = false; puntosTotalesBanco += puntos; sonarSFX('gameover');
            }
        }

        for (let i = objetivos.length - 1; i >= 0; i--) {
            let o = objetivos[i]; o.y += o.vy;
            if (o.esJefe) {
                fill(180, 20, 20); stroke(255, 100, 100); rect(o.x, o.y, o.w, o.h, 8);
                if (dist(o.x, o.y, gatoX, gatoY - 10) < gatoRadio + o.w/2) { if (escudoActivo) { destruirJefe(i); continue; } juegoVivo = false; puntosTotalesBanco += puntos; sonarSFX('gameover'); }
            } else {
                fill(255, 60, 60); noStroke(); rect(o.x, o.y, o.r * 2, o.r * 2, 4);
                if (dist(o.x, o.y, gatoX, gatoY - 10) < gatoRadio + o.r) { if (escudoActivo) { objetivos.splice(i, 1); continue; } juegoVivo = false; puntosTotalesBanco += puntos; sonarSFX('gameover'); }
            }
            if (o.y > alto - 120) { if(o.esJefe) jefe = null; objetivos.splice(i, 1); }
        }

        for (let i = misilesPropios.length - 1; i >= 0; i--) {
            let m = misilesPropios[i]; m.faseEfecto += 0.1;
            let target = (tieneAimbot_Disponible && objetivos.length > 0) ? objetivos[0] : m.targetObj;
            if (objetivos.includes(target) && target) {
                let ang = atan2(target.y - m.y, target.x - m.x);
                m.x += cos(ang) * 14; m.y += sin(ang) * 14; pistolaAngulo = ang;
            } else { m.y -= 12; }

            if (m.y < -40 || m.y > alto + 40) { misilesPropios.splice(i, 1); continue; }

            if (m.tipoProyectil === "fusiónPurpura") {
                let desv = sin(m.faseEfecto * 5) * 8;
                noStroke(); fill(0, 100, 255); ellipse(m.x - desv, m.y, 8, 8);
                fill(255, 0, 50); ellipse(m.x + desv, m.y, 8, 8);
                fill(180, 0, 255); ellipse(m.x, m.y, 14, 14);
            } else if (m.tipoProyectil === "desmantelar") {
                stroke(220, 240, 255); strokeWeight(3); line(m.x - 12, m.y - 5, m.x + 12, m.y + 5);
            } else {
                stroke(255, 215, 0); strokeWeight(4); line(m.x, m.y, m.x, m.y + 12);
            }

            let breakM = false;
            for (let j = objetivos.length - 1; j >= 0; j--) {
                if (dist(m.x, m.y, objetivos[j].x, objetivos[j].y) < (objetivos[j].esJefe ? 40 : 20)) {
                    crearChispas(objetivos[j].x, objetivos[j].y);
                    if (objetivos[j].esJefe) { objetivos[j].vida--; if (objetivos[j].vida <= 0) destruirJefe(j); } 
                    else { objetivos.splice(j, 1); puntos++; }
                    breakM = true; break;
                }
            }
            if (breakM) misilesPropios.splice(i, 1);
        }
    } else {
        fill(40, 10, 10, 160); rect(0, 0, ancho, alto - 120);
        fill(255, 60, 60); textAlign(CENTER, CENTER); textSize(24); text("¡HAZ CAÍDO!", ancho / 2, alto / 2 - 30);
    }

    renderizarDiseñoGatoEvolucionado();

    fill(255); textSize(14); textAlign(LEFT); text("Puntos: " + puntos, 20, 35);
    textSize(11); fill(200); text("Energía Maldita: " + puntosGlobalesTotal + " / 100", 20, 55);
    textAlign(RIGHT); fill(0, 255, 255); text("Munición: " + balasEsquivadasContador, ancho - 20, 35);
    fill(22, 22, 35); rect(0, alto - 100, ancho, 100);
    if (tieneEscudo1_Disponible) dibujarBoton(40, alto - 80, 280, 50, "ACTIVAR INFINITO / ESCUDO (5S)", 0, escudoActivo);
}

// --- SOPORTE INTERNO DE AUDIO & COMPLEMENTOS ---
function iniciarAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function reproducirMusica() {
    if (!audioCtx || estadoPantalla !== 'juego' || !juegoVivo || ejecutandoAnimacion || ejecutandoAnimacionMuerteFuria) return;
    let tiempoActual = audioCtx.currentTime;
    
    if (!faseLastBreath) {
        if (frameCount % 14 === 0) { 
            let nota = encodingSweetly[indiceNotaMusica % encodingSweetly.length];
            let frec = NOTAS[nota] || 440;
            let osc = audioCtx.createOscillator();
            let gain = audioCtx.createGain();
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.type = 'sine'; osc.frequency.setValueAtTime(frec, tiempoActual);
            gain.gain.setValueAtTime(0.0, tiempoActual);
            gain.gain.linearRampToValueAtTime(0.2, tiempoActual + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, tiempoActual + 0.4);
            osc.start(tiempoActual); osc.stop(tiempoActual + 0.43);
            indiceNotaMusica++;
        }
    } else {
        let rate = modoFuriaActivo ? 5 : 7; 
        if (frameCount % rate === 0) {
            let nota = encodingGDChangeOfScene[indiceNotaMusica % encodingGDChangeOfScene.length];
            let frec = NOTAS[nota] || 440;
            let osc1 = audioCtx.createOscillator();
            let osc2 = audioCtx.createOscillator();
            let gainNode = audioCtx.createGain();
            
            osc1.connect(gainNode); osc2.connect(gainNode); gainNode.connect(audioCtx.destination);
            osc1.type = 'triangle'; osc2.type = 'sawtooth';
            osc1.frequency.setValueAtTime(frec, tiempoActual);
            osc2.frequency.setValueAtTime(frec * 0.5, tiempoActual);
            
            gainNode.gain.setValueAtTime(0.0, tiempoActual);
            gainNode.gain.linearRampToValueAtTime(0.15, tiempoActual + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, tiempoActual + 0.28);
            
            osc1.start(tiempoActual); osc2.start(tiempoActual);
            osc1.stop(tiempoActual + 0.3); osc2.stop(tiempoActual + 0.3);
            indiceNotaMusica++;
        }
    }
}

function sonarSFX(tipo) {
    try {
        iniciarAudio(); if (!audioCtx) return;
        let tiempoActual = audioCtx.currentTime;
        let osc = audioCtx.createOscillator();
        let gainNode = audioCtx.createGain();
        osc.connect(gainNode); gainNode.connect(audioCtx.destination);

        if (tipo === 'vencerJefe') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(523.25, tiempoActual);
            gainNode.gain.setValueAtTime(0.2, tiempoActual);
            gainNode.gain.exponentialRampToValueAtTime(0.001, tiempoActual + 0.6);
            osc.start(tiempoActual); osc.stop(tiempoActual + 0.65);
        } else if (tipo === 'purpura') {
            osc.type = 'triangle'; osc.frequency.setValueAtTime(150, tiempoActual);
            osc.frequency.linearRampToValueAtTime(900, tiempoActual + 0.3);
            gainNode.gain.setValueAtTime(0.3, tiempoActual);
            gainNode.gain.linearRampToValueAtTime(0.001, tiempoActual + 0.35);
            osc.start(tiempoActual); osc.stop(tiempoActual + 0.36);
        } else if (tipo === 'corte') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(900, tiempoActual);
            osc.frequency.exponentialRampToValueAtTime(150, tiempoActual + 0.08);
            gainNode.gain.setValueAtTime(0.2, tiempoActual);
            gainNode.gain.linearRampToValueAtTime(0.001, tiempoActual + 0.1);
            osc.start(tiempoActual); osc.stop(tiempoActual + 0.11);
        } else if (tipo === 'laser' || tipo === 'fuga') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(650, tiempoActual);
            osc.frequency.exponentialRampToValueAtTime(200, tiempoActual + 0.2);
            gainNode.gain.setValueAtTime(0.2, tiempoActual);
            osc.start(tiempoActual); osc.stop(tiempoActual + 0.22);
        } else if (tipo === 'daño') {
            osc.type = 'triangle'; osc.frequency.setValueAtTime(120, tiempoActual);
            gainNode.gain.setValueAtTime(0.3, tiempoActual);
            gainNode.gain.linearRampToValueAtTime(0.001, tiempoActual + 0.12);
            osc.start(tiempoActual); osc.stop(tiempoActual + 0.13);
        } else if (tipo === 'salto') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(260, tiempoActual);
            osc.frequency.exponentialRampToValueAtTime(480, tiempoActual + 0.12);
            gainNode.gain.setValueAtTime(0.1, tiempoActual);
            osc.start(tiempoActual); osc.stop(tiempoActual + 0.13);
        } else if (tipo === 'gameover') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(180, tiempoActual);
            osc.frequency.linearRampToValueAtTime(60, tiempoActual + 0.4);
            gainNode.gain.setValueAtTime(0.3, tiempoActual);
            gainNode.gain.linearRampToValueAtTime(0.001, tiempoActual + 0.45);
            osc.start(tiempoActual); osc.stop(tiempoActual + 0.46);
        } else {
            osc.type = 'sine'; osc.frequency.setValueAtTime(400, tiempoActual);
            gainNode.gain.setValueAtTime(0.04, tiempoActual);
            osc.start(tiempoActual); osc.stop(tiempoActual + 0.05);
        }
    } catch(e) {}
}

function dibujarMenuPrincipal() {
    background(10, 10, 20);
    fill(255); textAlign(CENTER); textStyle(BOLD); textSize(28); text("SHADOW CAT", ancho / 2, 120);
    textSize(14); fill(180, 0, 255); text("Jujutsu & Change of Scene", ancho / 2, 145);
    fill(255, 215, 0); textSize(14); text("Puntos Totales: " + puntosTotalesBanco, ancho / 2, 200);
    dibujarBotonMenu(60, 260, 240, 50, "JUGAR", color(0, 150, 255));
    dibujarBotonMenu(60, 330, 240, 50, "TIENDA DE MEJORAS", color(130, 50, 200));
    dibujarBotonMenu(60, 400, 240, 50, "SELECCIÓN DE SKINS", color(220, 30, 100));
    dibujarBotonMenu(60, 470, 240, 40, "<- VOLVER A CONSTRUCCIÓN", color(0, 200, 100));
    if (mouseIsPressed && mouseX > 60 && mouseX < 300 && mouseY > 470 && mouseY < 510) { estadoPantalla = 'menu_construccion'; }
}

function dibujarTiendaMejoras() {
    background(15, 10, 25);
    fill(255); textAlign(CENTER); textStyle(BOLD); textSize(22); text("TIENDA DE MEJORAS", ancho / 2, 70);
    fill(255, 215, 0); textSize(14); text("Tu Saldo: " + puntosTotalesBanco + " PTS", ancho / 2, 100);
    dibujarTarjetaTienda(30, 140, 300, 80, "Escudo Temporal (Activable)", "Permite usar un escudo de 5s en partida.", 15, tieneEscudo1_Disponible);
    dibujarTarjetaTienda(30, 240, 300, 80, "Escudo Automático (Pasiva)", "Genera un escudo cada 10 balas esquivadas.", 30, tieneEscudo2_Disponible);
    dibujarTarjetaTienda(30, 340, 300, 80, "Auto-Aim Legendario", "Impacto garantizado sin apuntar.", 1000000, tieneAimbot_Disponible);
    dibujarBotonMenu(60, 520, 240, 45, "VOLVER AL MENÚ", color(60, 60, 70));
}

function dibujarSelectorSkins() {
    background(10, 15, 25);
    fill(255); textAlign(CENTER); textStyle(BOLD); textSize(22); text("SELECTOR DE SKINS", ancho / 2, 70);
    dibujarOpcionSkin(40, 130, 'normal', "Gato Base", "Disparos de plasma dorado.");
    dibujarOpcionSkin(40, 240, 'gojo', "Gato Gojo Satoru", "Pelo Blanco, Gafas y combo Destello PÚRPURA.");
    dibujarOpcionSkin(40, 350, 'yuji', "Gato Yuji Itadori", "Marcas Sukuna y cortes DESMANTELAR.");
    dibujarBotonMenu(60, 520, 240, 45, "VOLVER AL MENÚ", color(60, 60, 70));
}

function dibujarBotonMenu(x, y, w, h, texto, col) {
    fill(col); noStroke(); rect(x, y, w, h, 10);
    fill(255); textAlign(CENTER, CENTER); textSize(13); textStyle(BOLD); text(texto, x + w / 2, y + h / 2);
}

function dibujarTarjetaTienda(x, y, w, h, titulo, desc, costo, comprado) {
    fill(30, 25, 45); stroke(60, 50, 90); rect(x, y, w, h, 8);
    noStroke(); fill(255); textAlign(LEFT, TOP); textSize(12); textStyle(BOLD); text(titulo, x + 15, y + 12);
    fill(170); textStyle(NORMAL); textSize(10); text(desc, x + 15, y + 32, w - 110);
    textAlign(RIGHT, CENTER);
    if (comprado) { fill(0, 255, 120); textSize(11); textStyle(BOLD); text("ACTIVO", x + w - 15, y + h / 2); } 
    else { fill(puntosTotalesBanco >= costo ? color(255, 215, 0) : color(200, 50, 50)); textSize(11); textStyle(BOLD); text(costo >= 1000000 ? "1M PTS" : costo + " PTS", x + w - 15, y + h / 2); }
}

function dibujarOpcionSkin(x, y, idSkin, nombre, habilidad) {
    if (skinSeleccionada === idSkin) { fill(40, 60, 90); stroke(0, 190, 255); strokeWeight(2); } 
    else { fill(25, 25, 35); stroke(50); strokeWeight(1); }
    rect(x, y, ancho - 80, 85, 8);
    push(); translate(x + 40, y + 42); dibujarCuerpoGatoMiniatura(idSkin); pop();
    noStroke(); fill(255); textAlign(LEFT, TOP); textSize(13); textStyle(BOLD); text(nombre, x + 85, y + 18);
    fill(160); textStyle(NORMAL); textSize(10); text(habilidad, x + 85, y + 42, (ancho - 80) - 100);
}

function dibujarCuerpoGatoMiniatura(idSkin) {
    let r = 12;
    if (idSkin === 'gojo') {
        fill(255); ellipse(-6, -18, 6, 8); ellipse(6, -18, 6, 8); 
        fill(30, 30, 45); ellipse(0, 0, r*2, r*1.5);
        fill(255); ellipse(0, -10, r*1.4, r*1.4); 
        fill(10); ellipse(-4, -10, 5, 5); ellipse(4, -10, 5, 5); stroke(255); line(-2, -10, 2, -10); 
    } else if (idSkin === 'yuji') {
        fill(240, 120, 140); ellipse(-6, -18, 6, 8); ellipse(6, -18, 6, 8); 
        fill(20, 20, 35); ellipse(0, 0, r*2, r*1.5);
        fill(240, 120, 140); ellipse(0, -10, r*1.3, r*1.3); 
        stroke(0); strokeWeight(1.5); line(-5, -6, -2, -7); line(5, -6, 2, -7); 
    } else {
        fill(12, 12, 20); ellipse(-6, -18, 5, 7); ellipse(6, -18, 5, 7);
        fill(12, 12, 20); ellipse(0, 0, r*2, r*1.5); ellipse(0, -10, r*1.3, r*1.3);
    }
}

function renderizarDiseñoGatoEvolucionado() {
    push(); translate(gatoX, gatoY);
    colasAngulo += 0.05; let movCola = sin(colasAngulo) * 12;
    let cBase = skinSeleccionada === 'gojo' ? color(20, 20, 30) : (skinSeleccionada === 'yuji' ? color(25, 20, 35) : color(12, 12, 20));
    let cPelo = skinSeleccionada === 'gojo' ? color(255) : (skinSeleccionada === 'yuji' ? color(240, 120, 140) : color(12, 12, 20));

    fill(cPelo); noStroke();
    triangle(-14, -22, -4, -24, -15, -34); triangle(14, -22, 3, -24, 15, -34);

    stroke(cBase); strokeWeight(4); noFill();
    beginShape(); vertex(gatoRadio * 0.7, -2); bezierVertex(gatoRadio * 1.1, 8, gatoRadio * 1.5 + movCola, 22, gatoRadio * 1.2, 42); endShape();

    fill(cBase); noStroke(); ellipse(0, 0, gatoRadio * 2, gatoRadio * 1.5);
    fill(cPelo); ellipse(0, -18, gatoRadio * 1.4, gatoRadio * 1.4); 

    if (skinSeleccionada === 'gojo') {
        fill(10, 10, 15); stroke(240); strokeWeight(1);
        ellipse(-5, -17, 7, 7); ellipse(5, -17, 7, 7);
        line(-2, -17, 2, -17);
    } else if (skinSeleccionada === 'yuji') {
        fill(160, 30, 45); rect(-6, -3, 12, 5, 1);
        stroke(0); strokeWeight(1.5);
        line(-7, -13, -3, -14); line(7, -13, 3, -14);
    } else {
        fill(215, 255, 0); ellipse(-5, -18, 5, 7); ellipse(5, -18, 5, 7);
    }

    push(); translate(12, 4); rotate(pistolaTimer > 0 ? pistolaAngulo - 0.1 : 0);
    stroke(skinSeleccionada === 'gojo' ? color(0, 120, 255) : (skinSeleccionada === 'yuji' ? color(150, 0, 100) : 80));
    strokeWeight(4); line(0, 0, 12, 0);
    pop();
    pop();
}

function actualizarNuevaAnimacionAnime() {
    animacionFrame++; background(10, 10, 15);
    gatoX = ancho / 2; renderizarDiseñoGatoEvolucionado();
    if (animacionFrame < 60) {
        azulY = lerp(azulY, 150, 0.1); fill(0, 100, 255, 200 + sin(frameCount * 0.5) * 55); noStroke(); ellipse(azulX, azulY, 24, 24);
        stroke(0, 150, 255, 100); strokeWeight(2); line(ancho/2, gatoY - 30, azulX, azulY);
    } else if (animacionFrame >= 60 && animacionFrame < 130) {
        fill(0, 100, 255); ellipse(azulX, azulY, 24, 24); cinemanticaMahoY = lerp(cinemanticaMahoY, 140, 0.07); cinemanticaMahoX = azulX + sin(frameCount * 0.2) * 15; 
        fill(230, 230, 220); stroke(50); strokeWeight(1); ellipse(cinemanticaMahoX, cinemanticaMahoY, 32, 32);
        push(); translate(cinemanticaMahoX, cinemanticaMahoY - 25); rotate(frameCount * 0.1); stroke(200, 150, 50); strokeWeight(3); noFill(); ellipse(0, 0, 24, 24);
        for(let i=0; i<4; i++) { rotate(PI/2); line(0, 0, 12, 0); } pop();
    } else if (animacionFrame >= 130 && animacionFrame < 190) {
        fill(0, 100, 255); ellipse(azulX, azulY, 24, 24); fill(230, 230, 220); ellipse(cinemanticaMahoX, cinemanticaMahoY, 32, 32);
        rojoY = lerp(rojoY, cinemanticaMahoY, 0.18); fill(255, 30, 60); noStroke(); ellipse(rojoX, rojoY, 20, 20);
        if (dist(rojoX, rojoY, cinemanticaMahoX, cinemanticaMahoY) < 25) { cinemanticaMahoX += random(-5, 5); background(255, 100, 100, 50); }
    } else if (animacionFrame >= 190 && animacionFrame < 260) {
        azulY = lerp(azulY, 180, 0.05); rojoY = lerp(rojoY, 180, 0.05); fill(0, 100, 255, 150); ellipse(azulX, azulY, 30, 30); fill(255, 30, 60, 150); ellipse(rojoX, rojoY, 30, 30);
        if (animacionFrame > 210) { fill(160, 0, 255); ellipse(ancho/2, 180, (animacionFrame - 210) * 1.5, (animacionFrame - 210) * 1.5); if (frameCount % 4 === 0) sonarSFX('purpura'); }
    } else if (animacionFrame >= 260 && animacionFrame < 330) {
        explosionRadio += 18; fill(140, 0, 255, 240); noStroke(); ellipse(ancho/2, 180, explosionRadio);
        if (explosionRadio > ancho * 2.5) { ejecutandoAnimacion = false; faseLastBreath = true; resetFase2(); }
    }
}

function logicaCombateSukuna() {
    background(10, 5, 8); 
    if (bossHP > 80) jefeFaseActual = 1; else if (bossHP > 60 && bossHP <= 80) jefeFaseActual = 2; else if (bossHP > 40 && bossHP <= 60) jefeFaseActual = 3; else if (bossHP > 20 && bossHP <= 40) jefeFaseActual = 4; else if (bossHP <= 20) jefeFaseActual = 5;
    if (bossHP <= 35 && !yaAlcanzoMitadVida) yaAlcanzoMitadVida = true;

    for (let i = balas.length - 1; i >= 0; i--) {
        let b = balas[i];
        if (b.tipo === "rayoBlanco") {
            push(); translate(b.origenX, b.origenY); rotate(b.angulo); fill(230, 240, 255, b.alfa); noStroke(); rectMode(CENTER); rect(500, 0, 1000, blasterAnchoLaser * (b.alfa / 255)); fill(180, 210, 255, b.alfa * 0.7); rect(500, 0, 1000, 12); pop();
            let dLin = v_distanciaPuntoLinea(gatoX, gatoY, b.origenX, b.origenY, b.angulo);
            if (b.alfa > 80 && dLin < (blasterAnchoLaser / 2 - 4)) { gatoHP -= modoFuriaActivo ? 0.5 : 1.3; sonarSFX('daño'); if (gatoHP <= 0) verficarMuerteGato(); }
            b.alfa -= 18; if (b.alfa <= 0) balas.splice(i, 1);
        }
    }

    for (let bl of blastersLista) { stroke(255, 40, 40, 180); strokeWeight(1.5); push(); translate(bl.x, bl.y); rotate(bl.ang); line(0, 0, 0, -1000); pop(); fill(200, 30, 30); noStroke(); ellipse(bl.x, bl.y, 10, 10); }
    noFill(); stroke(jefeFaseActual === 5 ? color(255, 0, 0) : color(180, 40, 40)); strokeWeight(4); rectMode(CORNER); rect(cajaX, cajaY, cajaW, cajaH);

    push(); translate(gatoX, gatoY); if (usarGravedad) fill(0, 120, 255); else fill(160, 30, 255); noStroke(); beginShape(); vertex(0, -6); bezierVertex(-7, -13, -14, -5, 0, 8); bezierVertex(14, -5, 7, -13, 0, -6); endShape(CLOSE); pop();
    bossX = ancho / 2 + sin(frameCount * 0.07) * 45; push(); translate(bossX, bossY); fill(25, 20, 25); stroke(180, 20, 40); strokeWeight(3); rectMode(CENTER); rect(0, 0, 55, 55, 6); fill(255, 0, 30); noStroke(); ellipse(-10, -8, 4, 4); ellipse(-10, -2, 4, 4); ellipse(10, -8, 4, 4); ellipse(10, -2, 4, 4); pop();
    
    rectMode(CORNER); fill(30); rect(ancho/2 - 50, bossY - 50, 100, 6); fill(190, 10, 35); rect(ancho/2 - 50, bossY - 50, constrain(bossHP, 0, 100), 6);
    if (bossMensajeTimer > 0) { bossMensajeTimer--; fill(255); rect(bossX + 40, bossY - 30, 120, 35, 5); fill(0); textSize(9); textAlign(CENTER, CENTER); text(bossMensaje, bossX + 100, bossY - 12); }

    if (juegoVivo) {
        if (mouseIsPressed && !(!turnoJefe && mouseY < UT_barraY + UT_barraH + 20 && mouseY > UT_barraY - 20)) {
            if (usarGravedad) { gatoX = lerp(gatoX, mouseX, 0.25); botonPresionadoTiempo++; if (botonPresionadoTiempo === 1 && gatoY >= cajaY + cajaH - 12) { gatoVy = saltoFuerzaMax * 0.65; sonarSFX('salto'); } else if (botonPresionadoTiempo > 1 && botonPresionadoTiempo < 15 && gatoVy < 0) { gatoVy -= 0.38; } } 
            else { gatoX = lerp(gatoX, mouseX, 0.25); gatoY = lerp(gatoY, mouseY, 0.25); }
        } else { botonPresionadoTiempo = 0; }

        if (usarGravedad) { gatoVy += gravedadPoder; gatoY += gatoVy; if (gatoY >= cajaY + cajaH - 10) { gatoY = cajaY + cajaH - 10; gatoVy = 0; } }
        gatoX = constrain(gatoX, cajaX + 10, cajaX + cajaW - 10); gatoY = constrain(gatoY, cajaY + 10, cajaY + cajaH - 10);

        if (turnoJefe) {
            ejecutarPatronesAtaqueSukuna(jefeFaseActual); ataqueTimer++;
            if (ataqueTimer > 250) { balas = []; blastersLista = []; usarGravedad = false; turnoJefe = false; UT_ataqueDetenido = false; UT_lineaX = UT_barraX; UT_resultadoTexto = ""; }
        } else {
            fill(20); stroke(240); rect(UT_barraX, UT_barraY, UT_barraW, UT_barraH, 4); fill(160, 0, 255); noStroke(); rect(UT_barraX + UT_barraW / 2 - 15, UT_barraY, 30, UT_barraH);
            if (!UT_ataqueDetenido) { UT_lineaX += UT_lineaVel; if (UT_lineaX > UT_barraX + UT_barraW) { UT_ataqueDetenido = true; UT_resultadoTexto = "Fallo..."; UT_resultadoTimer = 45; } }
            stroke(255); strokeWeight(4); line(UT_lineaX, UT_barraY, UT_lineaX, UT_barraY + UT_barraH);
            fill(255, 180, 0); noStroke(); textAlign(CENTER); textSize(11); text("¡GOLPEA CON TODO EL PODER ACUMULADO!", ancho/2, UT_barraY - 15);
            if (UT_resultadoTimer > 0) { UT_resultadoTimer--; textSize(14); fill(255, 215, 0); textStyle(BOLD); text(UT_resultadoTexto, ancho/2, UT_barraY + UT_barraH + 20); textStyle(NORMAL); if (UT_resultadoTimer === 0) { turnoJefe = true; ataqueTimer = 0; seleccionarMensajeSukuna(); } }
        }

        for (let i = balas.length - 1; i >= 0; i--) {
            let b = balas[i]; if (b.tipo === "rayoBlanco") continue; b.x += b.vx || 0; b.y += b.vy || 0;
            if (b.tipo === "fuga") { fill(255, 140, 0); noStroke(); ellipse(b.x, b.y, 14, 14); fill(255, 230, 0); ellipse(b.x, b.y, 8, 8); if (dist(b.x, b.y, gatoX, gatoY) < 13) { gatoHP -= modoFuriaActivo ? 0.7 : 1.6; balas.splice(i, 1); sonarSFX('daño'); if (gatoHP <= 0) verficarMuerteGato(); continue; } } 
            else if (b.tipo === "hueso") { stroke(200); strokeWeight(2); fill(240, 240, 255); rect(b.x, b.y, b.w, b.h, 1); if (gatoX + 6 > b.x && gatoX - 6 < b.x + b.w && gatoY + 6 > b.y && gatoY - 6 < b.y + b.h) { gatoHP -= modoFuriaActivo ? 0.6 : 1.5; balas.splice(i, 1); sonarSFX('daño'); if (gatoHP <= 0) verficarMuerteGato(); continue; } }
            if (b.y > cajaY + cajaH + 25 || b.y < cajaY - 25 || b.x < cajaX - 25 || b.x > cajaX + cajaW + 25) balas.splice(i, 1);
        }

        for (let i = misilesPropios.length - 1; i >= 0; i--) {
            let m = misilesPropios[i]; m.y += m.vy; stroke(160, 0, 255); strokeWeight(4); line(m.x, m.y, m.x, m.y + 10);
            if (m.y < bossY + 20) { if (random() < 0.1) { bossMensaje = "Aburrido..."; bossMensajeTimer = 45; } else { bossHP -= m.daño; crearChispas(bossX, bossY); sonarSFX('laser'); if (bossHP <= 0) { faseLastBreath = false; puntos += 5000; puntosTotalesBanco += puntos; estadoPantalla = 'menu_construccion'; } } misilesPropios.splice(i, 1); }
        }
    } else {
        fill(255, 0, 0); textAlign(CENTER); textStyle(BOLD); text("FIN DEL JUEGO\nToca para ir al menú", ancho/2, alto/2);
    }
    fill(255); textAlign(CENTER); textSize(12); text("SUKUNA - HP: " + floor(bossHP) + " / 100", ancho/2, cajaY - 15); text("TU VIDA: " + floor(gatoHP) + " / " + gatoHPMax, ancho/2, cajaY + cajaH + 30);
}

function ejecutarPatronesAtaqueSukuna(fase) {
    if (fase === 1) {
        if (ataqueTimer % 35 === 10) blastersLista = [{ x: random(cajaX, cajaX + cajaW), y: cajaY - 20, ang: atan2(gatoY - (cajaY - 20), gatoX - random(cajaX, cajaX + cajaW)) + HALF_PI }];
        if (ataqueTimer % 35 === 30 && blastersLista.length > 0) { for (let bl of blastersLista) dispararLaserTriangulo(bl.x, bl.y, bl.ang - HALF_PI); blastersLista = []; sonarSFX('corte'); }
    } else if (fase === 2) {
        if (ataqueTimer % 50 === 10) blastersLista = [{ x: cajaX - 10, y: random(cajaY, cajaY + cajaH), ang: HALF_PI }, { x: cajaX + cajaW + 10, y: random(cajaY, cajaY + cajaH), ang: -HALF_PI }];
        if (ataqueTimer % 50 === 45) { for (let bl of blastersLista) dispararLaserTriangulo(bl.x, bl.y, bl.ang - HALF_PI); blastersLista = []; sonarSFX('corte'); }
    } else if (fase === 3) {
        usarGravedad = true; if (ataqueTimer % 30 === 0) { balas.push({ x: random(cajaX + 10, cajaX + cajaW - 10), y: cajaY - 10, vx: 0, vy: 4.5, tipo: "fuga" }); sonarSFX('fuga'); }
    } else if (fase === 4) {
        usarGravedad = false; frenesiAngular += 0.12; if (ataqueTimer % 18 === 0) { let cx = cajaX + cajaW / 2, cy = cajaY + cajaH / 2; let bx = cx + cos(frenesiAngular) * 110, by = cy + sin(frenesiAngular) * 110; dispararLaserTriangulo(bx, by, atan2(cy - by, cx - bx)); sonarSFX('corte'); }
    } else if (fase === 5) {
        frenesiAngular += 0.18; if (ataqueTimer % 12 === 0) { let cx = cajaX + cajaW / 2, cy = cajaY + cajaH / 2; let bx = cx + cos(frenesiAngular) * 95, by = cy + sin(frenesiAngular) * 95; dispararLaserTriangulo(bx, by, atan2(gatoY - by, gatoX - bx)); if (random() < 0.4) balas.push({ x: random(cajaX, cajaX + cajaW), y: cajaY - 10, vx: random(-1, 1), vy: 5, tipo: "fuga" }); sonarSFX('corte'); }
    }
}

function dispararLaserTriangulo(ox, oy, angulo) { balas.push({ tipo: "rayoBlanco", origenX: ox, origenY: oy, angulo: angulo, alfa: 255 }); }
function v_distanciaPuntoLinea(px, py, lx, ly, angulo) { let dx = cos(angulo), dy = sin(angulo); return abs(dy * px - dx * py + lx * (py + dy) - ly * (px + dx)) / sqrt(dy * dy + dx * dx); }
function verficarMuerteGato() { if (yaAlcanzoMitadVida && !modoFuriaActivo) { ejecutandoAnimacionMuerteFuria = true; animMuerteTimer = 0; } else { juegoVivo = false; puntosTotalesBanco += puntos; sonarSFX('gameover'); } }
function crearChispas(x, y) { let rCol = skinSeleccionada === 'gojo' ? {r: 180, g: 0, b: 255} : {r: 240, g: 120, b: 140}; for (let i = 0; i < 8; i++) chispas.push({ x: x, y: y, vx: random(-3, 3), vy: random(-3, 3), color: random() < 0.5 ? rCol : {r: 255, g: 60, b: 60}, alfa: 255, tam: random(3, 5) }); }
function destruirJefe(idx) { sonarSFX('vencerJefe'); objetivos.splice(idx, 1); jefe = null; puntos += 100; puntosGlobalesTotal += 100; }
function dibujarBoton(x, y, w, h, texto, costo, comprado) { fill(comprado ? color(35, 110, 55) : color(90, 45, 140)); noStroke(); rect(x, y, w, h, 8); fill(255); textAlign(CENTER, CENTER); textSize(11); textStyle(BOLD); text(texto, x + w/2, y + h/2); }
function seleccionarMensajeSukuna() { bossMensajeTimer = 90; let frases = ["¿Ese es todo tu infinito?", "¡Eres débil, mocoso!", "¡Te partiré en dos!", "Gojo Satoru ya no está aquí.", "¡Escala el abismo!"]; bossMensaje = frases[floor(random(frases.length))]; }
function resetFase2() { gatoX = cajaX + cajaW / 2; gatoY = cajaY + cajaH / 2; balas = []; misilesPropios = []; blastersLista = []; turnoJefe = true; ataqueTimer = 0; usarGravedad = false; gatoVy = 0; seleccionarMensajeSukuna(); jefeFaseActual = 1; indiceNotaMusica = 0; UT_ataqueDetenido = false; UT_lineaX = UT_barraX; if (modoFuriaActivo) { gatoHP = 60; gatoHPMax = 60; } else { bossHP = 100; gatoHP = 30; gatoHPMax = 30; } }

function actualizarAnimacionMuerteFuria() {
    background(5, 5, 12); animMuerteTimer++; let cX = cajaX + cajaW / 2, cY = cajaY + cajaH / 2;
    if (animMuerteTimer < 60) { push(); translate(cX, cY); fill(160, 30, 255); noStroke(); beginShape(); vertex(0, -6); bezierVertex(-7, -13, -14, -5, 0, 8); bezierVertex(14, -5, 7, -13, 0, -6); endShape(CLOSE); pop(); } 
    else if (animMuerteTimer >= 60 && animMuerteTimer < 120) { push(); translate(cX - 6, cY); fill(160, 30, 255); noStroke(); beginShape(); vertex(0, -6); bezierVertex(-7, -13, -14, -5, 0, 8); endShape(CLOSE); pop(); push(); translate(cX + 6, cY); fill(160, 30, 255); noStroke(); beginShape(); vertex(0, -6); bezierVertex(14, -5, 7, -13, 0, 8); endShape(CLOSE); pop(); } 
    else { modoFuriaActivo = true; ejecutandoAnimacionMuerteFuria = false; resetFase2(); }
}

function iniciarPartidaLimpia() {
    juegoVivo = true; puntos = 0; balasEsquivadasContador = 0; balasEsquivadasTotal = 0; balas = []; objetivos = []; misilesPropios = []; chispas = []; jefe = null; temporizadorJefe = 0; escudoActivo = false; gatoX = ancho / 2; puntosGlobalesTotal = 0; faseLastBreath = false; bossHP = 100; yaAlcanzoMitadVida = false; modoFuriaActivo = false;
}
