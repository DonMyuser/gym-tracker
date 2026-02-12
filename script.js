// Sustituye con tu URL de la implementación de Apps Script
const G_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwVEMAp-4u_goWHGmgY8XB8Co1ttP0H0Naf5BjmxydXBWW4zP-o8PY11xFa3qIQ5std/exec";

// Función para enviar cada serie a la base de datos
function enviarDatosASheets(datos) {
    fetch(G_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
    });
}

const input = document.querySelector('.weight-input');
function adjustWeight(delta) {
    let val = parseFloat(input.value);
    val = Math.round((val + delta) * 20) / 20;
    input.value = val.toFixed(2);
}

const btns = document.querySelectorAll('.nav-btn');
const pages = document.querySelectorAll('.page');

btns.forEach((btn, index) => {
    btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        pages.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        pages[index].classList.add('active');
    });
});

function crearGrafico(id, label, etiquetas, datos, color, mostrarEjeY = false) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, color + '80');
    gradient.addColorStop(1, color + '00');
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: etiquetas,
            datasets: [{
                label: label,
                data: datos,
                borderColor: color,
                backgroundColor: gradient,
                borderWidth: 3,
                pointBackgroundColor: '#1e293b',
                pointBorderColor: color,
                pointRadius: 4,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
                y: { display: mostrarEjeY, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}

// Antes: crearGrafico('pesoChart', ...)
// Ahora:
window.miGraficoPeso = crearGrafico('pesoChart', 'Peso', ['Sem. 1', 'Sem. 2', 'Sem. 3'], [61.29, 62.04, 62.87], '#38bdf8', false);

window.miGraficoVolumen = crearGrafico('volumenChart', 'Volumen total', ['Sem. 1', 'Sem. 2', 'Sem. 3', 'Sem. 4', 'Sem. 5', 'Sem. 6', 'Sem. 7'], [662.5 , 687.5, 690, 680, 600, 540, 800], '#FF7F50', true);

const rutina = [
    { nombre: "Press Banca", series: 3 },
    { nombre: "Sentadilla", series: 4 },
    { nombre: "Dominadas", series: 3 }
];

let ejercicioActualIndex = 0;
let serieActual = 1;

const serieDisplay = document.getElementById('serie-display');
const ejercicioDisplay = document.getElementById('ejercicio-display');
const btnNextSet = document.getElementById('btn-next-set');
const trainingContainer = document.getElementById('training-container');
const finishScreen = document.getElementById('finish-screen');

const inputPeso = document.getElementById('input-peso');
const inputReps = document.getElementById('input-reps');
const inputRir = document.getElementById('input-rir');

btnNextSet.addEventListener('click', () => {
    // 1. PRIMERO CAPTURAMOS Y ENVIAMOS LOS DATOS
    const datosSerie = {
        ejercicio: rutina[ejercicioActualIndex].nombre,
        serie: serieActual,
        peso: parseFloat(inputPeso.value) || 0,
        reps: parseFloat(inputReps.value) || 0,
        rir: inputRir.value || 0
    };
    
    // Llamamos a la función que conecta con Google
    enviarDatosASheets(datosSerie); 

    // 2. DESPUÉS HACEMOS LA NAVEGACIÓN (lo que ya tenías)
    const ejercicioTotalSeries = rutina[ejercicioActualIndex].series;
    
    if (serieActual < ejercicioTotalSeries) {
        serieActual++;
        actualizarUI('next');
    } else if (ejercicioActualIndex < rutina.length - 1) {
        ejercicioActualIndex++;
        serieActual = 1;
        actualizarUI('next');
    } else {
        mostrarPantallaFinal();
    }
});

function actualizarUI(direccion = 'next') {
    let exitClass = (direccion === 'next') ? 'slide-out-left' : 'slide-out-right';
    let enterClass = (direccion === 'next') ? 'slide-in-right' : 'slide-in-left';
    trainingContainer.classList.add(exitClass, 'animating');
    setTimeout(() => {
        serieDisplay.innerText = `Serie ${serieActual}`;
        ejercicioDisplay.innerText = rutina[ejercicioActualIndex].nombre;
        inputPeso.value = '';
        inputReps.value = '';
        inputRir.value = '';
        trainingContainer.classList.remove(exitClass);
        trainingContainer.classList.add(enterClass);
        setTimeout(() => {
            trainingContainer.classList.remove(enterClass, 'animating');
        }, 250);
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

document.getElementById('finalizar-todo-btn').addEventListener('click', () => {
    ejercicioActualIndex = 0;
    serieActual = 1;
    document.getElementById('hubBtn').click(); 
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

actualizarUI();

async function actualizarGraficosDesdeSheets() {
    try {
        const response = await fetch(G_SCRIPT_URL);
        const filas = await response.json();

        // 1. Filtrar por el ejercicio que quieras mostrar (ej: Press Banca)
        const ejercicioFiltro = "Press Banca";
        const datosEjercio = filas.filter(f => f.ejercicio === ejercicioFiltro);

        // 2. Agrupar por fecha para calcular volumen diario
        // Esto asume que tienes una columna de fecha en el JSON
        const volumenPorDia = {};
        datosEjercio.forEach(f => {
            const fecha = new Date(f.fecha).toLocaleDateString();
            const vol = f.peso * f.reps;
            volumenPorDia[fecha] = (volumenPorDia[fecha] || 0) + vol;
        });

        const etiquetas = Object.keys(volumenPorDia);
        const valores = Object.values(volumenPorDia);

        // 3. Actualizar tu gráfico existente (volumenChart)
        // Nota: Tendrás que guardar la instancia del gráfico en una variable global para hacer esto
        if (window.miGraficoVolumen) {
            window.miGraficoVolumen.data.labels = etiquetas;
            window.miGraficoVolumen.data.datasets[0].data = valores;
            window.miGraficoVolumen.update();
        }
    } catch (e) {
        console.error("Error cargando datos:", e);
    }
}

btns.forEach((btn, index) => {
    btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        pages.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        pages[index].classList.add('active');

        // SI PULSA EL BOTÓN DE PROGRESO (asumiendo que es el índice 1 o 2)
        if (btn.id === 'progresoBtn' || index === 2) { 
            actualizarGraficosDesdeSheets();
        }
    });
});