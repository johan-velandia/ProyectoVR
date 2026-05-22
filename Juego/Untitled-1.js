/**
 * ======================================================
 * ARCHIVO: nivel2.js
 * UBICACION: play-reorganizado/js/
 * VERSION: 1.2 - Navegacion por niveles
 * ULTIMA ACTUALIZACION: 2026-04-25 15:57
 *
 * PROPOSITO:
 * Contiene componentes A-Frame, estado y controles principales del nivel.
 * Extraido desde nivel2.html sin cambiar reglas de negocio del juego.
 *
 * ======================================================
 * REGLAS PARA PRODUCCION:
 * ---
 * - Console marcados con // @strip se eliminan en build para cliente
 * - Esta cabecera se elimina en version para cliente
 *
 * ======================================================
 * HISTORIAL DE CAMBIOS:
 * ---
 * [1.2] - 2026-04-25 15:57
 * - Se ajusta la meta del nivel 2 para avanzar a nivel3.html.
 *
 * [1.1] - 2026-04-25 15:50
 * - Se agregan bloques de lectura para estado, inicio, gameplay, camara y utilidades.
 *
 * [1.0] - 2026-04-25 15:41
 * - Archivo JS creado desde scripts embebidos del HTML original.
 * ======================================================
 */

// ======================================================
// BLOQUE 1: ESTADO GLOBAL DEL NIVEL
// Recupera el piloto y controla cuando el nivel puede procesar fisicas.
// ======================================================
let nombrePiloto = localStorage.getItem('nombrePiloto') || "AGENTE";
        let juegoIniciado = false;

        // ======================================================
        // BLOQUE 2: ARRANQUE DEL NIVEL 2
        // Activa UI, sonido, controles moviles y habilita gameplay.
        // ======================================================
        function iniciarNivel2() {
            document.querySelector('#pantalla-inicio').style.display = "none";
            document.querySelector('#ui-top').style.display = "block";
            document.querySelector('#user-display').innerText = nombrePiloto;

            var sonido = document.querySelector('#audio-fondo');
            if (sonido && sonido.components.sound) sonido.components.sound.playSound();

            if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
                document.querySelector('.controles-movil').style.display = "flex";
            }
            setTimeout(() => { juegoIniciado = true; }, 200);
        }

        // ======================================================
        // BLOQUE 3: MOTOR DE GAMEPLAY DEL NIVEL 2
        // Gestiona puntaje, vidas, colisiones, movimiento y transicion.
        // ======================================================
        AFRAME.registerComponent('motor-gameplay', {
            init: function () {
                const puntajeGuardado = localStorage.getItem('puntajeAcumulado');
                this.puntos = puntajeGuardado ? parseInt(puntajeGuardado) : 0;
                this.puedeSaltar = true;
                this.vidas = 3;
                this.alturaMax = 0;
                this.invulnerable = false;
                this.keys = {};

                this.actualizarUI();
                window.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
                window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });

                const bindTouch = (id, code) => {
                    const el = document.querySelector(id);
                    if (!el) return;
                    el.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys[code] = true; }, {passive: false});
                    el.addEventListener('touchend', (e) => { e.preventDefault(); this.keys[code] = false; }, {passive: false});
                };
                bindTouch('#m-up', 'KeyW');
                bindTouch('#m-down', 'KeyS');
                bindTouch('#m-left', 'KeyA');
                bindTouch('#m-right', 'KeyD');
                bindTouch('#m-jump', 'Space');

                this.el.addEventListener('collide', (e) => {
                    const target = e.detail.body.el;
                    if (!target || !juegoIniciado) return;

                    if (target.classList.contains('suelo')) {
                        let yActual = Math.round(target.object3D.position.y);
                        if (yActual > this.alturaMax) {
                            this.puntos += 400;
                            this.alturaMax = yActual;
                            this.actualizarUI();
                        }
                    }

                    if (target.classList.contains('peligro') && !this.invulnerable) {
                        this.perderVida();
                    }

                    if (target.id === 'meta2') {
                        this.puntos += 7000;
                        if (navigator.vibrate) navigator.vibrate([50, 50, 50, 50, 500]);
                        localStorage.setItem('puntajeAcumulado', this.puntos);
                        this.finalizarJuego("¡NIVEL 2 COMPLETADO!");
                        setTimeout(() => { window.location.href = "nivel3.html"; }, 2000);
                    }
                });
            },

            perderVida: function() {
                this.invulnerable = true;
                this.vidas--;
                this.actualizarUI();
                if (this.vidas <= 0) {
                    if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 300]);
                    localStorage.removeItem('puntajeAcumulado');
                    this.finalizarJuego("GAME OVER");
                } else {
                    if (navigator.vibrate) navigator.vibrate(200);
                    this.el.body.position.set(0, 3, 0);
                    this.el.body.velocity.set(0, 0, 0);
                    this.el.body.quaternion.set(0, 0, 0, 1);
                    setTimeout(() => { this.invulnerable = false; }, 1000);
                }
            },

            actualizarUI: function() {
                const puntosVal = document.querySelector('#puntos-val');
                const vidasVal = document.querySelector('#vidas-val');
                if (puntosVal) puntosVal.innerText = this.puntos;
                if (vidasVal) vidasVal.innerText = "❤️".repeat(this.vidas > 0 ? this.vidas : 0);
            },

            finalizarJuego: function(titulo) {
                juegoIniciado = false;
                document.querySelector('#game-over-screen').style.display = "flex";
                if (document.querySelector('.controles-movil'))
                    document.querySelector('.controles-movil').style.display = "none";
                document.querySelector('#final-title').innerText = titulo;
                document.querySelector('#final-score').innerText = `${nombrePiloto}, PUNTUACIÓN: ${this.puntos}`;
            },

            tick: function () {
                if (!this.el.body || !juegoIniciado) return;
                this.el.body.quaternion.set(0, 0, 0, 1);
                this.el.body.angularVelocity.set(0, 0, 0);
                let v = this.el.body.velocity;
                let f = 9;
                if (this.keys['KeyW']) v.z = -f; else if (this.keys['KeyS']) v.z = f; else v.z = 0;
                if (this.keys['KeyA']) v.x = -f; else if (this.keys['KeyD']) v.x = f; else v.x = 0;
                if (this.keys['Space']) {
                    if (Math.abs(v.y) < 0.1 && this.puedeSaltar) { v.y = 14; this.puedeSaltar = false; }
                } else { this.puedeSaltar = true; }
            }
        });

        // ======================================================
        // BLOQUE 4: SEGUIMIENTO DE CAMARA
        // Mantiene la camara vinculada al jugador y permite orientar la vista.
        // ======================================================
        AFRAME.registerComponent('seguimiento-camara', {
            init: function () {
                this.objetivo = document.querySelector('#jugador');
                this.keys = {};
                window.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
                window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
                this.currentRotation = { x: -20, y: 0, z: 0 };
            },
            tick: function () {
                if (!this.objetivo || !juegoIniciado) return;
                this.el.object3D.position.lerp(this.objetivo.object3D.position, 0.1);
                if (this.keys['ArrowLeft']) this.currentRotation.y += 2.0;
                if (this.keys['ArrowRight']) this.currentRotation.y -= 2.0;
                if (this.keys['ArrowUp']) this.currentRotation.x -= 1.0;
                if (this.keys['ArrowDown']) this.currentRotation.x += 1.0;
                this.currentRotation.x = Math.max(-60, Math.min(20, this.currentRotation.x));
                this.el.setAttribute('rotation', `${this.currentRotation.x} ${this.currentRotation.y} ${this.currentRotation.z}`);
            }
        });

        // ======================================================
        // BLOQUE 5: NAVEGACION
        // Limpia progreso acumulado y regresa al portal del juego.
        // ======================================================
        function irAlIndex() {
            localStorage.removeItem('puntajeAcumulado');
            window.location.href = "index.html";
        }