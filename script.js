// ============================================================
// CONFIGURACIÓN
// ============================================================
const G_SCRIPT_URL = "/.netlify/functions/gym";

const rutinas = {
    1: {
        nombre: "Push", ejercicios: [
            { nombre: "Press banca con barra", series: 4, descanso: 120, sustituto: "Press banca con mancuernas" },
            { nombre: "Press inclinado con mancuernas", series: 3, descanso: 120, sustituto: "Press inclinado en máquina" },
            { nombre: "Aperturas en polea media", series: 3, descanso: 90, sustituto: "Aperturas en máquina" },
            { nombre: "Press militar en máquina", series: 3, descanso: 90, sustituto: "Press militar con mancuernas sentado" },
            { nombre: "Elevaciones laterales en polea", series: 3, descanso: 90, sustituto: "Elevaciones laterales con mancuernas" },
            { nombre: "Extensión de tríceps con barra en polea baja", series: 3, descanso: 90, sustituto: "Tríceps en máquina" },
        ]
    },
    2: {
        nombre: "Pull", ejercicios: [
            { nombre: "Dominadas asistidas", series: 4, descanso: 120, sustituto: "Dominadas libres" },
            { nombre: "Remo en polea baja agarre vertical", series: 3, descanso: 120, sustituto: "Remo en máquina" },
            { nombre: "Jalón al pecho", series: 3, descanso: 90, sustituto: "Pullover en polea alta" },
            { nombre: "Face pull", series: 3, descanso: 90, sustituto: "Pájaros en máquina" },
            { nombre: "Curl con mancuernas inclinado", series: 3, descanso: 90, sustituto: "Curl concentrado" },
            { nombre: "Curl predicador barra Z", series: 3, descanso: 90, sustituto: "Curl en polea baja con barra recta" },
        ]
    },
    3: {
        nombre: "Legs", ejercicios: [
            { nombre: "Prensa de piernas 45º", series: 4, descanso: 120, sustituto: "Prensa de piernas" },
            { nombre: "Peso muerto rumano con mancuernas", series: 3, descanso: 120, sustituto: "llorar al fallo" },
            { nombre: "Curl femoral en máquina sentado", series: 3, descanso: 90, sustituto: "Curl femoral en máquina tumbado" },
            { nombre: "Extensión de cuádriceps en máquina", series: 3, descanso: 90, sustituto: "llorar al fallo" },
            { nombre: "Elevación de gemelos en máquina", series: 3, descanso: 90, sustituto: "Elevación de gemelos con mancuernas" },
            { nombre: "Abductores en máquina", series: 3, descanso: 90, sustituto: "llorar al fallo" },
        ]
    },
    4: {
        nombre: "Push", ejercicios: [
            { nombre: "Press banca con barra", series: 4, descanso: 120, sustituto: "Press banca con mancuernas" },
            { nombre: "Press inclinado con mancuernas", series: 3, descanso: 120, sustituto: "Press inclinado en máquina" },
            { nombre: "Aperturas en polea media", series: 3, descanso: 90, sustituto: "Aperturas en máquina" },
            { nombre: "Press militar en máquina", series: 3, descanso: 90, sustituto: "Press militar con mancuernas sentado" },
            { nombre: "Elevaciones laterales en polea", series: 3, descanso: 90, sustituto: "Elevaciones laterales con mancuernas" },
            { nombre: "Extensión de tríceps con barra en polea baja", series: 3, descanso: 90, sustituto: "Triceps en máquina" },
        ]
    },
    5: {
        nombre: "Pull", ejercicios: [
            { nombre: "Dominadas asistidas", series: 4, descanso: 120, sustituto: "Dominadas libres" },
            { nombre: "Remo en polea baja agarre vertical", series: 3, descanso: 120, sustituto: "Remo en máquina" },
            { nombre: "Jalón al pecho", series: 3, descanso: 90, sustituto: "Pullover en polea alta" },
            { nombre: "Face pull", series: 3, descanso: 90, sustituto: "Pájaros en máquina" },
            { nombre: "Curl con mancuernas inclinado", series: 3, descanso: 90, sustituto: "Curl concentrado" },
            { nombre: "Curl predicador barra Z", series: 3, descanso: 90, sustituto: "Curl en polea baja con barra recta" },
        ]
    },
    6: null,
    0: null
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
    let restTimer = null;
    let sesion = {};

    // Recuperar sesión guardada si existe
    const sesionGuardada = localStorage.getItem('sesion_activa');
    if (sesionGuardada) {
        try {
            sesion = JSON.parse(sesionGuardada);
            // Calcular en qué ejercicio y serie estábamos
            const indices = Object.keys(sesion).map(Number);
            if (indices.length) {
                ejercicioActualIndex = Math.max(...indices);
                const seriesGuardadas = Object.keys(sesion[ejercicioActualIndex]).map(Number);
                serieActual = Math.max(...seriesGuardadas);
                // Si esa serie ya estaba completa, avanzar a la siguiente
                const totalSeries = rutinaHoy?.ejercicios[ejercicioActualIndex]?.series;
                if (totalSeries && serieActual >= totalSeries) {
                    if (ejercicioActualIndex < rutinaHoy.ejercicios.length - 1) {
                        ejercicioActualIndex++;
                        serieActual = 1;
                    }
                } else {
                    serieActual++;
                }
            }
        } catch (e) {
            console.error('Error recuperando sesión:', e);
            sesion = {};
        }
    }

    const getSesionEntry = (eIdx, serie) => sesion[eIdx]?.[serie] || null;
    const setSesionEntry = (eIdx, serie, datos) => {
        if (!sesion[eIdx]) sesion[eIdx] = {};
        sesion[eIdx][serie] = datos;
        localStorage.setItem('sesion_activa', JSON.stringify(sesion));
    };

    // ============================================================
    // DOM
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

    window.adjustWeight = (delta) => {
        input.value = (Math.round((parseFloat(input.value) + delta) * 20) / 20).toFixed(2);
    };

    // ============================================================
    // NAVEGACIÓN
    // ============================================================
    btns.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('active'));
            pages.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            pages[index].classList.add('active');
            if (index === 2 && cacheFilas) rellenarSelectYGrafico(cacheFilas);
        });
    });

    // ============================================================
    // SALUDO Y FECHA
    // ============================================================
    function actualizarSaludo() {
        const ahora = new Date();
        const hora = ahora.getHours();
        const saludo = hora < 14 ? 'Buenos días,' : hora < 21 ? 'Buenas tardes,' : 'Buenas noches,';

        const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const MENSAJES = { 1: '¡Semana nueva, a tope!', 2: '¡A entrenar!', 3: '¡Mitad de semana, no pares!', 4: '¡Casi viernes!', 5: '¡Último empujón!', 6: '¡Descansa!', 0: '¡Descansa!' };

        document.querySelector('.h1-hub').innerHTML = `${saludo} <br><span>Darío</span>`;
        document.querySelector('.subtitle').textContent =
            `${DIAS[ahora.getDay()]}, ${ahora.getDate()} ${MESES[ahora.getMonth()]} • ${MENSAJES[ahora.getDay()]}`;
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
                    y: { display: mostrarEjeY, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' }, grace: '5%' }
                }
            }
        });
    }

    window.miGraficoPeso = crearGrafico('pesoChart', 'Peso', ['Sem. 1', 'Sem. 2', 'Sem. 3'], [61.29, 62.04, 62.87], '#38bdf8', true);
    window.miGraficoVolumen = crearGrafico('volumenChart', 'Volumen total', ['Sem. 1', 'Sem. 2', 'Sem. 3', 'Sem. 4', 'Sem. 5', 'Sem. 6', 'Sem. 7'], [662.5, 687.5, 690, 680, 600, 540, 800], '#FF7F50', true);

    // ============================================================
    // ENVÍO A SHEETS
    // ============================================================
    async function enviarSesionCompleta() {
        const entradas = Object.keys(sesion).flatMap(eIdx =>
            Object.keys(sesion[eIdx]).sort((a, b) => a - b).map(serie => ({
                ejercicio: sesion[eIdx][serie].ejercicio,
                serie: parseInt(serie),
                peso: sesion[eIdx][serie].peso,
                reps: sesion[eIdx][serie].reps,
                rir: sesion[eIdx][serie].rir
            }))
        );

        await fetch(G_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entradas)
        }).catch(err => console.error('Error enviando sesión:', err));
    }

    function resetearSesion() {
        sesion = {};
        ejercicioActualIndex = 0;
        serieActual = 1;
        localStorage.removeItem('sesion_activa');
        localStorage.removeItem('sesion_progreso');
    }

    // ============================================================
    // FLUJO DE ENTRENAMIENTO
    // ============================================================
    btnSustituir.addEventListener('click', () => {
        if (!rutinaHoy) return;
        ejercicioSustituido = !ejercicioSustituido;
        ejercicioDisplay.innerText = ejercicioSustituido
            ? rutinaHoy.ejercicios[ejercicioActualIndex].sustituto
            : rutinaHoy.ejercicios[ejercicioActualIndex].nombre;
        btnSustituir.style.color = ejercicioSustituido ? 'var(--accent)' : 'var(--text-muted)';
        btnSustituir.style.borderColor = ejercicioSustituido ? 'var(--accent)' : 'rgba(255,255,255,0.1)';
    });

    document.getElementById('btn-back').addEventListener('click', () => {
        if (!rutinaHoy) return;

        if (serieActual === 1) {
            // Serie 1 → saltar al ejercicio anterior completo
            if (ejercicioActualIndex > 0) {
                ejercicioActualIndex--;
                serieActual = 1; // siempre vuelve a serie 1 del anterior
            }
        } else {
            serieActual--;
        }

        actualizarUI('back');
    });

    btnNextSet.addEventListener('click', () => {
        if (!rutinaHoy) return;

        const ejercicioActual = rutinaHoy.ejercicios[ejercicioActualIndex];
        const peso = parseFloat(inputPeso.value);
        const reps = parseFloat(inputReps.value);
        const hayDatos = peso && reps;

        // Si no hay datos y estamos en serie 1 → saltar ejercicio
        const saltarEjercicio = !hayDatos && serieActual === 1;

        if (hayDatos) {
            // Limpiar bordes de error si los había
            inputPeso.style.borderColor = '';
            inputReps.style.borderColor = '';

            setSesionEntry(ejercicioActualIndex, serieActual, {
                ejercicio: ejercicioSustituido ? ejercicioActual.sustituto : ejercicioActual.nombre,
                peso,
                reps,
                rir: parseFloat(inputRir.value) || 0
            });
        } else if (!saltarEjercicio) {
            // Hay datos en series anteriores pero esta serie está vacía → marcar error
            inputPeso.style.borderColor = !peso ? 'var(--danger)' : '';
            inputReps.style.borderColor = !reps ? 'var(--danger)' : '';
            return;
        }

        const esUltimo = ejercicioActualIndex === rutinaHoy.ejercicios.length - 1
            && (saltarEjercicio || serieActual >= ejercicioActual.series);

        if (esUltimo) { mostrarPantallaFinal(); return; }

        const descanso = ejercicioActual.descanso ?? 90;

        if (saltarEjercicio) {
            ejercicioActualIndex++;
            serieActual = 1;
            actualizarUI('next'); // sin cronómetro al saltar
        } else if (serieActual < ejercicioActual.series) {
            serieActual++;
            mostrarCronometro(descanso, () => actualizarUI('next'));
        } else {
            ejercicioActualIndex++;
            serieActual = 1;
            mostrarCronometro(descanso, () => actualizarUI('next'));
        }
    });
    // ============================================================
    // FINALIZAR
    // ============================================================
    async function finalizarYSalir(btn) {
        btn.textContent = 'Guardando...';
        btn.disabled = true;
        await enviarSesionCompleta();
        resetearSesion();
        btn.textContent = 'Finalizar y Salir';
        btn.disabled = false;
        document.getElementById('hubBtn').click();
    }

    document.getElementById('finalizar-todo-btn').addEventListener('click', function () {
        finalizarYSalir(this);
    });

    document.querySelector('.btn-secondary').addEventListener('click', mostrarResumen);

    // ============================================================
    // RESUMEN EDITABLE
    // ============================================================
    function mostrarResumen() {
        if (!rutinaHoy) return;

        let html = '<div style="width:100%; overflow-y:auto; max-height:60vh;">';

        rutinaHoy.ejercicios.forEach((ej, eIdx) => {
            if (!sesion[eIdx] || !Object.keys(sesion[eIdx]).length) return;

            html += `<div style="margin-bottom:20px;">
                <h3 style="color:var(--accent); margin:0 0 10px; font-size:13px; text-transform:uppercase; letter-spacing:1px;">${ej.nombre}</h3>`;

            for (let s = 1; s <= ej.series; s++) {
                const e = getSesionEntry(eIdx, s);
                if (!e) continue;
                const inputStyle = 'padding:6px; border-radius:8px; background:var(--bg-card); border:1px solid rgba(255,255,255,0.1); color:var(--text-main); font-size:14px; text-align:center;';
                html += `
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px; background:var(--bg-main); border-radius:10px; padding:10px 12px;">
                    <span style="color:var(--text-muted); font-size:12px; width:48px; flex-shrink:0;">Serie ${s}</span>
                    <input type="number" data-eidx="${eIdx}" data-serie="${s}" data-campo="peso"  value="${e.peso}" style="width:56px; ${inputStyle}">
                    <span style="color:var(--text-muted); font-size:12px;">kg</span>
                    <input type="number" data-eidx="${eIdx}" data-serie="${s}" data-campo="reps"  value="${e.reps}" style="width:52px; ${inputStyle}">
                    <span style="color:var(--text-muted); font-size:12px;">reps</span>
                    <input type="number" data-eidx="${eIdx}" data-serie="${s}" data-campo="rir"   value="${e.rir}"  style="width:48px; ${inputStyle}">
                    <span style="color:var(--text-muted); font-size:12px;">rir</span>
                </div>`;
            }
            html += '</div>';
        });

        finishScreen.innerHTML = `
            <h2 style="color:var(--accent); margin-bottom:4px;">Resumen</h2>
            <p style="color:var(--text-muted); font-size:13px; margin-bottom:16px;">Edita lo que necesites</p>
            ${html}</div>
            <div class="finish-buttons" style="margin-top:16px;">
                <button class="nextBtn btn-secondary" id="btn-volver-resumen">← Volver</button>
                <button class="nextBtn" id="btn-confirmar-resumen">Confirmar y Salir</button>
            </div>`;

        finishScreen.querySelectorAll('input[data-campo]').forEach(inp => {
            inp.addEventListener('change', () => {
                const { eidx, serie, campo } = inp.dataset;
                if (sesion[eidx]?.[serie]) sesion[eidx][serie][campo] = parseFloat(inp.value) || 0;
            });
        });

        document.getElementById('btn-volver-resumen').addEventListener('click', restaurarFinishScreen);
        document.getElementById('btn-confirmar-resumen').addEventListener('click', async function () {
            await finalizarYSalir(this);
            restaurarFinishScreen();
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
        document.getElementById('finalizar-todo-btn').addEventListener('click', function () {
            finalizarYSalir(this);
        });
    }

    // ============================================================
    // CRONÓMETRO DE DESCANSO
    // ============================================================
    function mostrarCronometro(segundos, onFin) {
        const overlay = document.getElementById('rest-overlay');
        const countdown = document.getElementById('rest-countdown');
        const ring = document.getElementById('rest-ring-progress');
        const CIRCUNFERENCIA = 326.7;
        let restante = segundos;

        function actualizar() {
            countdown.textContent = restante;
            const progreso = restante / segundos;
            ring.style.strokeDashoffset = CIRCUNFERENCIA * (1 - progreso);
            ring.style.stroke = progreso <= 0.3 ? '#f87171' : 'var(--accent)';
        }

        function terminar() {
            clearInterval(restTimer);
            overlay.style.display = 'none';
            desactivarWakeLock();  // ← añade esta línea
            if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
            onFin();
        }

        clearInterval(restTimer);
        ring.style.strokeDashoffset = 0;
        actualizar();
        overlay.style.display = 'flex';
        activarWakeLock();

        restTimer = setInterval(() => { restante--; actualizar(); if (restante <= -1) terminar(); }, 1000);

        const btnSkip = document.getElementById('btn-skip-rest');
        const nuevoBtn = btnSkip.cloneNode(true);
        btnSkip.parentNode.replaceChild(nuevoBtn, btnSkip);
        nuevoBtn.addEventListener('click', terminar);
    }

    // ============================================================
    // UI
    // ============================================================
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

            const entrada = getSesionEntry(ejercicioActualIndex, serieActual);
            inputPeso.value = entrada?.peso || '';
            inputReps.value = entrada?.reps || '';
            inputRir.value = entrada?.rir || '';

            if (!mismoEjercicio) {
                ejercicioSustituido = false;
                btnSustituir.style.color = 'var(--text-muted)';
                btnSustituir.style.borderColor = 'rgba(255,255,255,0.1)';
            }

            btnSustituir.style.display = serieActual === 1 ? 'flex' : 'none';

            trainingContainer.classList.replace(exitClass, enterClass);
            setTimeout(() => trainingContainer.classList.remove(enterClass, 'animating'), 250);
            btnNextSet.textContent = 'Siguiente Serie';
            // Texto dinámico del botón
            const esSerie1SinDatos = serieActual === 1 && !getSesionEntry(ejercicioActualIndex, serieActual);
            const esUltimoEjercicio = ejercicioActualIndex === rutinaHoy.ejercicios.length - 1;
            btnNextSet.textContent = (esSerie1SinDatos && !esUltimoEjercicio) ? 'Saltar ejercicio →' : 'Siguiente Serie';
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
    // PROGRESO — datos desde Sheets
    // ============================================================
    function rellenarSelectYGrafico(filas) {
        const ejerciciosUnicos = [...new Set(filas.map(f => f.ejercicio?.toString().trim()).filter(Boolean))];
        if (!ejerciciosUnicos.length) return;

        const valorActual = ejercicioSelect.value;
        ejercicioSelect.innerHTML = ejerciciosUnicos.map(e => `<option value="${e.toLowerCase()}">${e}</option>`).join('');
        if (valorActual && ejerciciosUnicos.map(e => e.toLowerCase()).includes(valorActual)) {
            ejercicioSelect.value = valorActual;
        }
        actualizarGraficoConFilas(filas, ejercicioSelect.value);
    }

    function actualizarGraficoConFilas(filas, ejercicio) {
        const filtro = ejercicio.toLowerCase().trim();
        const datos = filas.filter(f => f.ejercicio?.toString().toLowerCase().trim() === filtro);
        if (!datos.length) return;

        const volumenPorDia = datos.reduce((acc, f) => {
            const fecha = new Date(f.fecha).toLocaleDateString();
            acc[fecha] = (acc[fecha] || 0) + (parseFloat(f.peso) || 0) * (parseFloat(f.reps) || 0);
            return acc;
        }, {});

        const etiquetas = Object.keys(volumenPorDia).sort((a, b) => new Date(a) - new Date(b));
        window.miGraficoVolumen.data.labels = etiquetas;
        window.miGraficoVolumen.data.datasets[0].data = etiquetas.map(f => volumenPorDia[f]);
        window.miGraficoVolumen.update();
    }

    ejercicioSelect?.addEventListener('change', () => {
        if (cacheFilas) actualizarGraficoConFilas(cacheFilas, ejercicioSelect.value);
    });

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
            porSemana[semana].dias++;
        });

        const etiquetas = Object.keys(porSemana).sort();
        const valores = etiquetas.map(s => Math.round((porSemana[s].suma / porSemana[s].dias) * 100) / 100);

        const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const etiquetasLegibles = etiquetas.map(s => {
            const [anyo, semNum] = s.split('-S');
            const primerDia = new Date(anyo, 0, 1 + (parseInt(semNum) - 1) * 7);
            const mes = primerDia.getMonth();
            const nSemana = etiquetas.filter(e => {
                const [a, n] = e.split('-S');
                const d = new Date(a, 0, 1 + (parseInt(n) - 1) * 7);
                return d.getMonth() === mes && d.getFullYear() === parseInt(anyo) && n <= semNum;
            }).length;
            return `${MESES[mes]} ${nSemana}`;
        });

        window.miGraficoPeso.data.labels = etiquetasLegibles;
        window.miGraficoPeso.data.datasets[0].data = valores;
        window.miGraficoPeso.update();

        const badge = document.querySelector('.trend-badge');
        if (!badge) return;
        if (valores.length >= 2) {
            const diff = valores.at(-1) - valores.at(-2);
            const signo = diff >= 0 ? '+' : '';
            badge.textContent = '';
            badge.appendChild(Object.assign(document.createElement('span'), { textContent: diff >= 0 ? '↗' : '↘' }));
            badge.appendChild(document.createTextNode(` ${signo}${diff.toFixed(2)} kg`));
            badge.className = `trend-badge ${diff >= 0 ? 'up' : 'down'}`;
        } else if (valores.length === 1) {
            badge.textContent = '— Sin datos anteriores';
            badge.className = 'trend-badge';
        }
    }

    // ============================================================
    // GUARDAR PESO
    // ============================================================
    btnGuardarPeso.addEventListener('click', async () => {
        const peso = parseFloat(input.value);
        if (!peso || isNaN(peso)) return;

        btnGuardarPeso.disabled = true;
        btnGuardarPeso.textContent = 'Guardando...';

        try {
            await fetch(`${G_SCRIPT_URL}?accion=guardarPeso`, {
                method: 'POST', mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Fecha: new Date().toISOString(), Peso: peso })
            });
            pesoFeedback.textContent = '✓ Peso guardado';
            pesoFeedback.style.color = '#38bdf8';
        } catch {
            pesoFeedback.textContent = '✗ Error al guardar';
            pesoFeedback.style.color = '#ef4444';
        } finally {
            pesoFeedback.style.display = 'block';
            btnGuardarPeso.disabled = false;
            btnGuardarPeso.textContent = 'Guardar peso';
            setTimeout(() => pesoFeedback.style.display = 'none', 3000);
        }
    });

    // ============================================================
    // ARRANQUE
    // ============================================================
    async function iniciarCarga() {
        try {
            const filasPeso = await fetch(`${G_SCRIPT_URL}?hoja=pesaje`).then(r => r.json());
            procesarYRenderizarPeso(filasPeso);
        } catch (e) {
            console.error('Error cargando peso:', e);
        } finally {
            document.getElementById('splash-screen').classList.add('oculto');
        }

        try {
            cacheFilas = await fetch(G_SCRIPT_URL).then(r => r.json());
        } catch (e) {
            console.error('Error cargando ejercicios:', e);
        }
    }


    // ============================================================
    // WAKE LOCK — mantener pantalla encendida durante el descanso
    // ============================================================
    let wakeLockVideo = null;

    function activarWakeLock() {
        if (wakeLockVideo) return;

        wakeLockVideo = document.createElement('video');
        wakeLockVideo.setAttribute('playsinline', '');
        wakeLockVideo.setAttribute('muted', '');
        wakeLockVideo.style.display = 'none';

        // Video de 1x1 pixel en loop — solo para mantener la pantalla activa
        wakeLockVideo.src = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAA';
        wakeLockVideo.loop = true;
        document.body.appendChild(wakeLockVideo);
        wakeLockVideo.play().catch(() => { });
    }

    function desactivarWakeLock() {
        if (!wakeLockVideo) return;
        wakeLockVideo.pause();
        wakeLockVideo.remove();
        wakeLockVideo = null;
    }

    actualizarUI();
    iniciarCarga();

});