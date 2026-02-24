// ============================================================
// CONFIGURACIÓN
// ============================================================
const G_SCRIPT_URL = "/.netlify/functions/gym";

const rutinas = {
    1: {
        nombre: "Push", ejercicios: [  // Lunes
            { nombre: "Press banca con barra", series: 4, descanso: 120, sustituto: "Press banca con mancuernas" },
            { nombre: "Press inclinado con mancuernas", series: 3, descanso: 90, sustituto: "Press inclinado en máquina" },
            { nombre: "Aperturas en polea media", series: 3, descanso: 90, sustituto: "Aperturas en máquina" },
            { nombre: "Press militar en máquina", series: 3, descanso: 90, sustituto: "Press militar con mancuernas sentado" },
            { nombre: "Elevaciones laterales en polea", series: 3, descanso: 90, sustituto: "Elevaciones laterales con mancuernas" },
            { nombre: "Extensión de tríceps con barra en polea baja", descanso: 90, series: 3, sustituto: "Triceps en máquina" },
        ]
    },
    2: {
        nombre: "Pull", ejercicios: [  // Martes
            { nombre: "Dominadas asistidas", series: 4, descanso: 120, sustituto: "Dominadas libres" },
            { nombre: "Remo en polea baja agarre vertical", series: 3, descanso: 120, sustituto: "Remo en máquina" },
            { nombre: "Jalón al pecho", series: 3, descanso: 90, sustituto: "Pullover en polea alta" },
            { nombre: "Face pull", series: 3, descanso: 90, sustituto: "Pájaros en máquina" },
            { nombre: "Curl con mancuernas inclinado", series: 3, descanso: 90, sustituto: "Curl concentrado" },
            { nombre: "Curl predicador barra Z", series: 3, descanso: 90, sustituto: "Curl en polea baja con barra recta" },
        ]
    },
    3: {
        nombre: "Legs", ejercicios: [  // Miércoles
            { nombre: "Prensa de piernas 45º", series: 4, descanso: 120, sustituto: "Prensa de piernas" },
            { nombre: "Peso muerto rumano con mancuernas", series: 3, descanso: 120, sustituto: "llorar al fallo" },
            { nombre: "Curl femoral en máquina sentado", series: 3, descanso: 90, sustituto: "Curl femoral en máquina tumbado" },
            { nombre: "Extensión de cuádriceps en máquina", series: 3, descanso: 90, sustituto: "llorar al fallo" },
            { nombre: "Elevación de gemelos en máquina", series: 3, descanso: 90, sustituto: "Elevación de gemelos con mancuernas" },
            { nombre: "Abductores en máquina", series: 3, descanso: 90, sustituto: "llorar al fallo" },
        ]
    },
    4: {
        nombre: "Push", ejercicios: [  // Lunes
            { nombre: "Press banca con barra", series: 4, descanso: 120, sustituto: "Press banca con mancuernas" },
            { nombre: "Press inclinado con mancuernas", series: 3, descanso: 120, sustituto: "Press inclinado en máquina" },
            { nombre: "Aperturas en polea media", series: 3, descanso: 90, sustituto: "Aperturas en máquina" },
            { nombre: "Press militar en máquina", series: 3, descanso: 90, sustituto: "Press militar con mancuernas sentado" },
            { nombre: "Elevaciones laterales en polea", series: 3, descanso: 90, sustituto: "Elevaciones laterales con mancuernas" },
            { nombre: "Extensión de tríceps con barra en polea baja", series: 3, descanso: 90, sustituto: "Triceps en máquina" },
        ]
    },
    5: {
        nombre: "Pull", ejercicios: [  // Martes
            { nombre: "Dominadas asistidas", series: 4, descanso: 120, sustituto: "Dominadas libres" },
            { nombre: "Remo en polea baja agarre vertical", series: 3, descanso: 120, sustituto: "Remo en máquina" },
            { nombre: "Jalón al pecho", series: 3, descanso: 90, sustituto: "Pullover en polea alta" },
            { nombre: "Face pull", series: 3, descanso: 90, sustituto: "Pájaros en máquina" },
            { nombre: "Curl con mancuernas inclinado", series: 3, descanso: 90, sustituto: "Curl concentrado" },
            { nombre: "Curl predicador barra Z", series: 3, descanso: 90, sustituto: "Curl en polea baja con barra recta" },
        ]
    },
    6: null,  // Sábado — descanso
    0: null   // Domingo — descanso
};

const diaHoy = new Date().getDay();
const rutinaHoy = rutinas[diaHoy];

document.addEventListener('DOMContentLoaded', () => {

    // ============================================================
    // ESTADO
    // ============================================================
    let ejercicioActualIndex = 0;
    let serieActual = 1;
    let cacheFilas = null;
    let ejercicioSustituido = false;

    // sesion[ejercicioIdx][serie] = { ejercicio, peso, reps, rir }
    let sesion = {};

    function getSesionEntry(eIdx, serie) {
        return sesion[eIdx]?.[serie] || null;
    }

    function setSesionEntry(eIdx, serie, datos) {
        if (!sesion[eIdx]) sesion[eIdx] = {};
        sesion[eIdx][serie] = datos;
    }

    // ============================================================
    // DOM cacheado
    // ============================================================
    const input = document.querySelector('.weight-input');
    const btns = document.querySelectorAll('.nav-btn');
    const pages = document.querySelectorAll('.page');
    const serieDisplay = document.getElementById('serie-display');
    const ejercicioDisplay = document.getElementById('ejercicio-display');
    const btnNextSet = document.getElementById('btn-next-set');
    const trainingContainer = document.getElementById('training-container');
    const finishScreen = document.getElementById('finish-screen');
    const inputPeso = document.getElementById('input-peso');
    const inputReps = document.getElementById('input-reps');
    const inputRir = document.getElementById('input-rir');
    const ejercicioSelect = document.getElementById('ejercicio-select');
    const spinner = document.getElementById('loading-spinner');
    const graphCard = document.querySelector('#progreso .graph-card');
    const btnGuardarPeso = document.getElementById('btn-guardar-peso');
    const pesoFeedback = document.getElementById('peso-feedback');
    const btnSustituir = document.getElementById('btn-sustituir');

    btnSustituir.style.display = 'flex';

    if (!rutinaHoy) {
        trainingContainer.innerHTML = `
        <div class="container" style="text-align:center">
            <h1 style="font-size:48px; margin:0">😴</h1>
            <h2 style="color:var(--accent)">Día de descanso</h2>
            <p style="color:var(--text-muted)">Toca recuperar. Vuelve mañana.</p>
        </div>`;
    } else {
        document.querySelector('.ejercicio-titulo').textContent = rutinaHoy.ejercicios[0].nombre;
    }

    window.adjustWeight = function (delta) {
        const val = Math.round((parseFloat(input.value) + delta) * 20) / 20;
        input.value = val.toFixed(2);
    };

    // ============================================================
    // SPINNER
    // ============================================================
    function mostrarSpinner(visible) {
        if (spinner) spinner.style.display = visible ? 'block' : 'none';
        if (graphCard) graphCard.style.display = visible ? 'none' : 'block';
    }

    // ============================================================
    // NAVEGACIÓN
    // ============================================================
    btns.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('active'));
            pages.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            pages[index].classList.add('active');

            if (btn.id === 'progresoBtn' || index === 2) {
                if (cacheFilas) rellenarSelectYGrafico(cacheFilas);
            }
        });
    });

    // ============================================================
    // SALUDO Y FECHA
    // ============================================================
    function actualizarSaludo() {
        const ahora = new Date();
        const hora = ahora.getHours();

        let saludo;
        if (hora >= 6 && hora < 14) saludo = 'Buenos días,';
        else if (hora >= 14 && hora < 21) saludo = 'Buenas tardes,';
        else saludo = 'Buenas noches,';

        const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const diaSemana = DIAS[ahora.getDay()];
        const diaMes = ahora.getDate();
        const mes = MESES[ahora.getMonth()];

        const MENSAJES = {
            1: '¡Semana nueva, a tope!',
            2: '¡A entrenar!',
            3: '¡Mitad de semana, no pares!',
            4: '¡Casi viernes!',
            5: '¡Último empujón!',
            6: '¡Descansa!',
            0: '¡Descansa!'
        };
        const mensaje = MENSAJES[ahora.getDay()];

        const h1 = document.querySelector('.h1-hub');
        if (h1) h1.innerHTML = `${saludo} <br><span>Darío</span>`;

        const subtitle = document.querySelector('.subtitle');
        if (subtitle) subtitle.textContent = `${diaSemana}, ${diaMes} ${mes} • ${mensaje}`;
    }

    actualizarSaludo();

    // ============================================================
    // GRÁFICOS
    // ============================================================
    function crearGrafico(id, label, etiquetas, datos, color, mostrarEjeY = false) {
        const canvas = document.getElementById(id);
        if (!canvas) return null;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, `${color}80`);
        gradient.addColorStop(1, `${color}00`);
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: etiquetas,
                datasets: [{
                    label, data: datos,
                    borderColor: color, backgroundColor: gradient,
                    borderWidth: 3, pointBackgroundColor: '#1e293b',
                    pointBorderColor: color, pointRadius: 4, fill: true, tension: 0.4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
                    y: {
                        display: mostrarEjeY,
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#94a3b8' },
                        grace: '5%'
                    }
                }
            }
        });
    }

    window.miGraficoPeso = crearGrafico('pesoChart', 'Peso',
        ['Sem. 1', 'Sem. 2', 'Sem. 3'], [61.29, 62.04, 62.87], '#38bdf8', true);

    window.miGraficoVolumen = crearGrafico('volumenChart', 'Volumen total',
        ['Sem. 1', 'Sem. 2', 'Sem. 3', 'Sem. 4', 'Sem. 5', 'Sem. 6', 'Sem. 7'],
        [662.5, 687.5, 690, 680, 600, 540, 800], '#FF7F50', true);

    // ============================================================
    // ENVÍO A SHEETS — solo se llama al finalizar
    // ============================================================
    function enviarDatosASheets(datos) {
        return fetch(G_SCRIPT_URL, {
            method: "POST", mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });
    }

    async function enviarSesionCompleta() {
        const entradas = [];

        Object.keys(sesion).forEach(eIdx => {
            Object.keys(sesion[eIdx])
                .sort((a, b) => a - b)
                .forEach(serie => {
                    const entrada = sesion[eIdx][serie];
                    entradas.push({
                        ejercicio: entrada.ejercicio,
                        serie: parseInt(serie),
                        peso: entrada.peso,
                        reps: entrada.reps,
                        rir: entrada.rir
                    });
                });
        });

        await fetch(G_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(entradas)  // manda el array entero
        }).catch(err => console.error("Error enviando sesión:", err));
    }

    // ============================================================
    // FLUJO DE ENTRENAMIENTO
    // ============================================================
    btnSustituir.addEventListener('click', () => {
        ejercicioSustituido = !ejercicioSustituido;

        if (ejercicioSustituido) {
            btnSustituir.style.color = 'var(--accent)';
            btnSustituir.style.borderColor = 'var(--accent)';
            ejercicioDisplay.innerText =
                rutinaHoy.ejercicios[ejercicioActualIndex].sustituto;
        } else {
            btnSustituir.style.color = 'var(--text-muted)';
            btnSustituir.style.borderColor = 'rgba(255,255,255,0.1)';
            ejercicioDisplay.innerText =
                rutinaHoy.ejercicios[ejercicioActualIndex].nombre;
        }
    });
    document.getElementById('btn-back').addEventListener('click', () => {
        if (!rutinaHoy) return;
        if (serieActual > 1) {
            serieActual--;
        } else if (ejercicioActualIndex > 0) {
            ejercicioActualIndex--;
            serieActual = rutinaHoy.ejercicios[ejercicioActualIndex].series;
        }
        actualizarUI('back');
    });

    // Finalizar: envía todo a Sheets y resetea
    document.getElementById('finalizar-todo-btn').addEventListener('click', async () => {
        const btn = document.getElementById('finalizar-todo-btn');
        btn.textContent = 'Guardando...';
        btn.disabled = true;

        await enviarSesionCompleta();

        sesion = {};
        ejercicioActualIndex = 0;
        serieActual = 1;
        btn.textContent = 'Finalizar y Salir';
        btn.disabled = false;

        document.getElementById('hubBtn').click();
    });

    // Ver Resumen
    document.querySelector('.btn-secondary').addEventListener('click', () => {
        mostrarResumen();
    });

    btnNextSet.addEventListener('click', () => {
        if (!rutinaHoy) return;

        const nombreEjercicio = ejercicioSustituido
            ? rutinaHoy.ejercicios[ejercicioActualIndex].sustituto
            : rutinaHoy.ejercicios[ejercicioActualIndex].nombre;

        setSesionEntry(ejercicioActualIndex, serieActual, {
            ejercicio: nombreEjercicio,
            peso: parseFloat(inputPeso.value) || 0,
            reps: parseFloat(inputReps.value) || 0,
            rir: parseFloat(inputRir.value) || 0
        });

        const descansoBruto = rutinaHoy.ejercicios[ejercicioActualIndex]?.descanso ?? 90;

        const totalSeries = rutinaHoy.ejercicios[ejercicioActualIndex].series;

        // ¿Es la última serie del último ejercicio?
        const esUltimo = ejercicioActualIndex === rutinaHoy.ejercicios.length - 1
            && serieActual >= totalSeries;

        if (esUltimo) {
            mostrarPantallaFinal();
            return;
        }

        // Avanzar índices
        let direccion = 'next';
        if (serieActual < totalSeries) {
            serieActual++;
        } else {
            ejercicioActualIndex++;
            serieActual = 1;
        }

        // Mostrar cronómetro y luego actualizar UI

        // Si acabamos de avanzar de ejercicio, usamos el descanso del nuevo
        mostrarCronometro(descansoBruto, () => actualizarUI(direccion));
    });

    // ============================================================
    // RESUMEN EDITABLE
    // ============================================================
    function mostrarResumen() {
        if (!rutinaHoy) return;

        let html = `<div style="width:100%; overflow-y:auto; max-height:60vh;">`;

        rutinaHoy.ejercicios.forEach((ej, eIdx) => {
            const tieneDatos = sesion[eIdx] && Object.keys(sesion[eIdx]).length > 0;
            if (!tieneDatos) return;

            html += `<div style="margin-bottom:20px;">
                <h3 style="color:var(--accent); margin:0 0 10px; font-size:13px; text-transform:uppercase; letter-spacing:1px;">${ej.nombre}</h3>`;

            for (let s = 1; s <= ej.series; s++) {
                const entrada = getSesionEntry(eIdx, s);
                if (!entrada) continue;
                html += `
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px; background:var(--bg-main); border-radius:10px; padding:10px 12px;">
                    <span style="color:var(--text-muted); font-size:12px; width:48px; flex-shrink:0;">Serie ${s}</span>
                    <input type="number" data-eidx="${eIdx}" data-serie="${s}" data-campo="peso"
                        value="${entrada.peso}"
                        style="width:56px; padding:6px; border-radius:8px; background:var(--bg-card); border:1px solid rgba(255,255,255,0.1); color:var(--text-main); font-size:14px; text-align:center;">
                    <span style="color:var(--text-muted); font-size:12px;">kg</span>
                    <input type="number" data-eidx="${eIdx}" data-serie="${s}" data-campo="reps"
                        value="${entrada.reps}"
                        style="width:52px; padding:6px; border-radius:8px; background:var(--bg-card); border:1px solid rgba(255,255,255,0.1); color:var(--text-main); font-size:14px; text-align:center;">
                    <span style="color:var(--text-muted); font-size:12px;">reps</span>
                    <input type="number" data-eidx="${eIdx}" data-serie="${s}" data-campo="rir"
                        value="${entrada.rir}"
                        style="width:48px; padding:6px; border-radius:8px; background:var(--bg-card); border:1px solid rgba(255,255,255,0.1); color:var(--text-main); font-size:14px; text-align:center;">
                    <span style="color:var(--text-muted); font-size:12px;">rir</span>
                </div>`;
            }
            html += `</div>`;
        });

        html += `</div>`;

        finishScreen.innerHTML = `
            <h2 style="color:var(--accent); margin-bottom:4px;">Resumen</h2>
            <p style="color:var(--text-muted); font-size:13px; margin-bottom:16px;">Edita lo que necesites</p>
            ${html}
            <div class="finish-buttons" style="margin-top:16px;">
                <button class="nextBtn btn-secondary" id="btn-volver-resumen">← Volver</button>
                <button class="nextBtn" id="btn-confirmar-resumen">Confirmar y Salir</button>
            </div>`;

        // Actualizar sesión al editar cualquier campo
        finishScreen.querySelectorAll('input[data-campo]').forEach(inp => {
            inp.addEventListener('change', () => {
                const eIdx = parseInt(inp.dataset.eidx);
                const serie = parseInt(inp.dataset.serie);
                const campo = inp.dataset.campo;
                if (sesion[eIdx]?.[serie]) {
                    sesion[eIdx][serie][campo] = parseFloat(inp.value) || 0;
                }
            });
        });

        document.getElementById('btn-volver-resumen').addEventListener('click', restaurarFinishScreen);

        document.getElementById('btn-confirmar-resumen').addEventListener('click', async () => {
            const btn = document.getElementById('btn-confirmar-resumen');
            btn.textContent = 'Guardando...';
            btn.disabled = true;
            await enviarSesionCompleta();
            sesion = {};
            ejercicioActualIndex = 0;
            serieActual = 1;
            restaurarFinishScreen();
            document.getElementById('hubBtn').click();
        });
    }

    function restaurarFinishScreen() {
        finishScreen.innerHTML = `
            <h1 class="complete-icon">🎉</h1>
            <h2 class="complete-title">¡Entrenamiento Completado!</h2>
            <p class="complete-subtitle">Has machacado todas las series.</p>
            <div class="finish-buttons">
                <button class="nextBtn btn-secondary">Ver Resumen / Editar</button>
                <button class="nextBtn" id="finalizar-todo-btn">Finalizar y Salir</button>
            </div>`;

        finishScreen.querySelector('.btn-secondary').addEventListener('click', mostrarResumen);

        document.getElementById('finalizar-todo-btn').addEventListener('click', async () => {
            const btn = document.getElementById('finalizar-todo-btn');
            btn.textContent = 'Guardando...';
            btn.disabled = true;
            await enviarSesionCompleta();
            sesion = {};
            ejercicioActualIndex = 0;
            serieActual = 1;
            btn.textContent = 'Finalizar y Salir';
            btn.disabled = false;
            document.getElementById('hubBtn').click();
        });
    }

    // ============================================================
    // UI: animaciones
    // ============================================================
    // ============================================================
    // CRONÓMETRO DE DESCANSO
    // ============================================================
    let restTimer = null;

    function mostrarCronometro(segundos, onFin) {
        const overlay = document.getElementById('rest-overlay');
        const countdown = document.getElementById('rest-countdown');
        const ring = document.getElementById('rest-ring-progress');
        const btnSkip = document.getElementById('btn-skip-rest');

        const CIRCUNFERENCIA = 326.7; // 2 * π * 52
        let restante = segundos;

        function actualizar() {
            countdown.textContent = restante;
            const progreso = restante / segundos;
            ring.style.strokeDashoffset = CIRCUNFERENCIA * (1 - progreso);
            // Cambia color al 30%
            ring.style.stroke = progreso <= 0.3 ? '#f87171' : 'var(--accent)';
        }

        function terminar() {
            clearInterval(restTimer);
            overlay.style.display = 'none';
            // Vibra si disponible
            if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
            onFin();
        }

        // Resetear
        clearInterval(restTimer);
        ring.style.strokeDashoffset = 0;
        actualizar();
        overlay.style.display = 'flex';

        restTimer = setInterval(() => {
            restante--;
            actualizar();
            if (restante <= -1) terminar();
        }, 1000);

        // Un solo listener (clonar para evitar duplicados)
        const nuevoBtn = btnSkip.cloneNode(true);
        btnSkip.parentNode.replaceChild(nuevoBtn, btnSkip);
        nuevoBtn.addEventListener('click', terminar);
    }
    function actualizarUI(direccion = 'next') {
        const exitClass = direccion === 'next' ? 'slide-out-left' : 'slide-out-right';
        const enterClass = direccion === 'next' ? 'slide-in-right' : 'slide-in-left';
        const ejercicioAnterior = ejercicioActualIndex;
        trainingContainer.classList.add(exitClass, 'animating');
        setTimeout(() => {
            serieDisplay.innerText = `Serie ${serieActual}`;

            const mismoEjercicio = ejercicioActualIndex === ejercicioAnterior;
            ejercicioDisplay.innerText = (ejercicioSustituido && mismoEjercicio)
                ? rutinaHoy.ejercicios[ejercicioActualIndex].sustituto
                : rutinaHoy.ejercicios[ejercicioActualIndex].nombre;

            // Cargar datos guardados o limpiar
            const entrada = getSesionEntry(ejercicioActualIndex, serieActual);
            if (entrada) {
                inputPeso.value = entrada.peso || '';
                inputReps.value = entrada.reps || '';
                inputRir.value = entrada.rir || '';
            } else {
                inputPeso.value = inputReps.value = inputRir.value = '';
            }

            // Resetear sustitución solo si cambia ejercicio
            if (!mismoEjercicio) {
                ejercicioSustituido = false;
                btnSustituir.style.color = 'var(--text-muted)';
                btnSustituir.style.borderColor = 'rgba(255,255,255,0.1)';
            }

            btnSustituir.style.display = serieActual === 1 ? 'flex' : 'none';

            trainingContainer.classList.replace(exitClass, enterClass);
            setTimeout(() => trainingContainer.classList.remove(enterClass, 'animating'), 250);
        }, 250);
    }

    function mostrarPantallaFinal() {
        trainingContainer.classList.add('slide-out-left');
        setTimeout(() => {
            trainingContainer.style.display = 'none';
            trainingContainer.classList.remove('slide-out-left');
            finishScreen.style.display = 'flex';
            finishScreen.classList.remove('finish-pop');
            void finishScreen.offsetWidth;
            finishScreen.classList.add('finish-pop');
        }, 300);
    }

    // ============================================================
    // DATOS DESDE SHEETS
    // ============================================================
    async function cargarEjerciciosYGrafico() {
        try {
            if (cacheFilas) {
                rellenarSelectYGrafico(cacheFilas);
            } else {
                mostrarSpinner(true);
            }
            const filas = await (await fetch(G_SCRIPT_URL)).json();
            cacheFilas = filas;
            rellenarSelectYGrafico(filas);
        } catch (e) {
            console.error("Error cargando ejercicios:", e);
        } finally {
            mostrarSpinner(false);
        }
    }

    function rellenarSelectYGrafico(filas) {
        const ejerciciosUnicos = [...new Set(
            filas.map(f => f.ejercicio?.toString().trim()).filter(Boolean)
        )];
        if (!ejerciciosUnicos.length) { console.warn("Sin ejercicios en Sheets."); return; }

        const valorActual = ejercicioSelect.value;
        ejercicioSelect.innerHTML = ejerciciosUnicos
            .map(e => `<option value="${e.toLowerCase()}">${e}</option>`).join('');

        if (valorActual && ejerciciosUnicos.map(e => e.toLowerCase()).includes(valorActual)) {
            ejercicioSelect.value = valorActual;
        }

        actualizarGraficoConFilas(filas, ejercicioSelect.value);
    }

    function actualizarGraficosDesdeSheets(ejercicio) {
        if (cacheFilas) actualizarGraficoConFilas(cacheFilas, ejercicio);
    }

    function actualizarGraficoConFilas(filas, ejercicio) {
        const filtro = ejercicio.toLowerCase().trim();
        const datos = filas.filter(f => f.ejercicio?.toString().toLowerCase().trim() === filtro);
        if (!datos.length) { console.warn("Sin datos para:", filtro); return; }

        const volumenPorDia = datos.reduce((acc, f) => {
            const fecha = new Date(f.fecha).toLocaleDateString();
            acc[fecha] = (acc[fecha] || 0) + (parseFloat(f.peso) || 0) * (parseFloat(f.reps) || 0);
            return acc;
        }, {});

        const etiquetas = Object.keys(volumenPorDia).sort((a, b) => new Date(a) - new Date(b));
        const valores = etiquetas.map(f => volumenPorDia[f]);

        if (window.miGraficoVolumen) {
            window.miGraficoVolumen.data.labels = etiquetas;
            window.miGraficoVolumen.data.datasets[0].data = valores;
            window.miGraficoVolumen.update();
        }
    }

    if (ejercicioSelect) {
        ejercicioSelect.addEventListener('change', () => {
            actualizarGraficosDesdeSheets(ejercicioSelect.value);
        });
    }

    // ============================================================
    // GRÁFICO PESO CORPORAL
    // ============================================================
    function getWeekNumber(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        return Math.ceil((((d - new Date(d.getFullYear(), 0, 1)) / 86400000) + 1) / 7);
    }

    function procesarYRenderizarPeso(filas) {
        const porSemana = {};
        filas.forEach(f => {
            if (!f.Fecha || !f.Peso) return;
            const fecha = new Date(f.Fecha);
            if (isNaN(fecha)) return;
            const semana = `${fecha.getFullYear()}-S${String(getWeekNumber(fecha)).padStart(2, '0')}`;
            if (!porSemana[semana]) porSemana[semana] = { suma: 0, dias: 0 };
            porSemana[semana].suma += parseFloat(f.Peso) || 0;
            porSemana[semana].dias += 1;
        });

        const etiquetas = Object.keys(porSemana).sort();
        const valores = etiquetas.map(s =>
            Math.round((porSemana[s].suma / porSemana[s].dias) * 100) / 100
        );

        const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const etiquetasLegibles = etiquetas.map(s => {
            const [anyo, semNum] = s.split('-S');
            const primerDia = new Date(anyo, 0, 1 + (parseInt(semNum) - 1) * 7);
            const mes = primerDia.getMonth();
            const semanasMismoMes = etiquetas.filter(e => {
                const [a, n] = e.split('-S');
                const d = new Date(a, 0, 1 + (parseInt(n) - 1) * 7);
                return d.getMonth() === mes && d.getFullYear() === parseInt(anyo) && n <= semNum;
            }).length;
            return `${MESES[mes]} ${semanasMismoMes}`;
        });

        if (window.miGraficoPeso) {
            window.miGraficoPeso.data.labels = etiquetasLegibles;
            window.miGraficoPeso.data.datasets[0].data = valores;
            window.miGraficoPeso.update();
        }

        const badge = document.querySelector('.trend-badge');
        if (badge && valores.length >= 2) {
            const diff = valores[valores.length - 1] - valores[valores.length - 2];
            const signo = diff >= 0 ? '+' : '';
            const flecha = diff >= 0 ? '↗' : '↘';
            badge.textContent = '';
            badge.appendChild(Object.assign(document.createElement('span'), { textContent: flecha }));
            badge.appendChild(document.createTextNode(` ${signo}${diff.toFixed(2)} kg`));
            badge.classList.remove('up', 'down');
            badge.classList.add(diff >= 0 ? 'up' : 'down');
        } else if (badge && valores.length === 1) {
            badge.textContent = '— Sin datos anteriores';
            badge.classList.remove('up', 'down');
        }
    }

    btnGuardarPeso.addEventListener('click', async () => {
        const peso = parseFloat(input.value);
        if (!peso || isNaN(peso)) return;

        btnGuardarPeso.disabled = true;
        btnGuardarPeso.textContent = 'Guardando...';

        try {
            await fetch(G_SCRIPT_URL + '?accion=guardarPeso', {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Fecha: new Date().toISOString(), Peso: peso })
            });
            pesoFeedback.textContent = '✓ Peso guardado';
            pesoFeedback.style.color = '#38bdf8';
        } catch (e) {
            pesoFeedback.textContent = '✗ Error al guardar';
            pesoFeedback.style.color = '#ef4444';
        } finally {
            pesoFeedback.style.display = 'block';
            btnGuardarPeso.disabled = false;
            btnGuardarPeso.textContent = 'Guardar peso';
            setTimeout(() => pesoFeedback.style.display = 'none', 3000);
        }
    });


    async function iniciarCarga() {
        try {
            const [filasEjercicios, filasPeso] = await Promise.all([
                fetch(G_SCRIPT_URL).then(r => r.json()),
                fetch(G_SCRIPT_URL + '?hoja=pesaje').then(r => r.json())
            ]);

            cacheFilas = filasEjercicios;
            procesarYRenderizarPeso(filasPeso);

        } catch (e) {
            console.error("Error en carga inicial:", e);
        } finally {
            // Ocultar splash siempre, aunque falle la carga
            document.getElementById('splash-screen').classList.add('oculto');
        }
    }

    // ARRANQUE
    actualizarUI();
    iniciarCarga();

}); // fin DOMContentLoaded 