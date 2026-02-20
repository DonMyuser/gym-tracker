// ============================================================
// CONFIGURACIÓN
// ============================================================
const G_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyLKdWELSwsTMM6gAmZmOk6UTc5KoUgSsWwOz24FvpnG7CsMBjuYjXxSEX9Ssoqdep8/exec";

const rutina = [
    { nombre: "Press Banca", series: 3 },
    { nombre: "Sentadilla", series: 4 },
    { nombre: "Dominadas", series: 3 }
];

document.addEventListener('DOMContentLoaded', () => {

    // ESTADO
    let ejercicioActualIndex = 0;
    let serieActual = 1;
    let cacheFilas = null;

    // DOM cacheado
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

    window.adjustWeight = function (delta) {
        const val = Math.round((parseFloat(input.value) + delta) * 20) / 20;
        input.value = val.toFixed(2);
    };

    // ============================================================
    // SPINNER — muestra/oculta el spinner y la gráfica
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
                cargarEjerciciosYGrafico();
            }
        });
    });

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
    // ENVÍO A SHEETS
    // ============================================================
    function enviarDatosASheets(datos) {
        fetch(G_SCRIPT_URL, {
            method: "POST", mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        }).catch(err => console.error("Error enviando datos:", err));
    }

    // ============================================================
    // FLUJO DE ENTRENAMIENTO
    // ============================================================
    btnNextSet.addEventListener('click', () => {
        enviarDatosASheets({
            ejercicio: rutina[ejercicioActualIndex].nombre,
            serie: serieActual,
            peso: parseFloat(inputPeso.value) || 0,
            reps: parseFloat(inputReps.value) || 0,
            rir: inputRir.value || 0
        });
        const totalSeries = rutina[ejercicioActualIndex].series;
        if (serieActual < totalSeries) {
            serieActual++;
        } else if (ejercicioActualIndex < rutina.length - 1) {
            ejercicioActualIndex++;
            serieActual = 1;
        } else {
            mostrarPantallaFinal();
            return;
        }
        actualizarUI('next');
    });

    document.getElementById('btn-back').addEventListener('click', () => {
        if (serieActual > 1) {
            serieActual--;
        } else if (ejercicioActualIndex > 0) {
            ejercicioActualIndex--;
            serieActual = rutina[ejercicioActualIndex].series;
        }
        actualizarUI('back');
    });

    document.getElementById('finalizar-todo-btn').addEventListener('click', () => {
        ejercicioActualIndex = 0;
        serieActual = 1;
        document.getElementById('hubBtn').click();
    });

    // ============================================================
    // UI: animaciones
    // ============================================================
    function actualizarUI(direccion = 'next') {
        const exitClass = direccion === 'next' ? 'slide-out-left' : 'slide-out-right';
        const enterClass = direccion === 'next' ? 'slide-in-right' : 'slide-in-left';
        trainingContainer.classList.add(exitClass, 'animating');
        setTimeout(() => {
            serieDisplay.innerText = `Serie ${serieActual}`;
            ejercicioDisplay.innerText = rutina[ejercicioActualIndex].nombre;
            inputPeso.value = inputReps.value = inputRir.value = '';
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
    // DATOS DESDE SHEETS — con spinner, caché y ocultación de gráfica
    // ============================================================
    async function cargarEjerciciosYGrafico() {
        try {
            if (cacheFilas) {
                // Con caché: mostrar datos al instante, sin spinner
                rellenarSelectYGrafico(cacheFilas);
            } else {
                // Sin caché: ocultar gráfica y mostrar spinner
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

    async function actualizarGraficosDesdeSheets(ejercicio) {
        try {
            mostrarSpinner(true);
            const filas = await (await fetch(G_SCRIPT_URL)).json();
            cacheFilas = filas;
            actualizarGraficoConFilas(filas, ejercicio);
        } catch (e) {
            console.error("Error actualizando gráfico:", e);
        } finally {
            mostrarSpinner(false);
        }
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

    function getWeekNumber(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        return Math.ceil((((d - new Date(d.getFullYear(), 0, 1)) / 86400000) + 1) / 7);
    }

    async function cargarGraficoPeso() {
        try {
            const filas = await (await fetch(G_SCRIPT_URL + '?hoja=pesaje')).json();

            const porSemana = {};
            filas.forEach(f => {
                if (!f.Fecha || !f.Peso) return;

                // Funciona con ISO, dd/mm/yyyy o cualquier formato
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

                // Contar cuántas semanas del mismo mes han pasado antes
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
        } catch (e) { console.error("Error cargando peso:", e); }
    }

    // ARRANQUE
    actualizarUI();
    cargarGraficoPeso();

}); // fin DOMContentLoaded