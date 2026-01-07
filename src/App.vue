<template>
  <div class="app">
    <header class="top">
      <div>
        <h1>Notas PWA</h1>
        <p class="sub">Demo Vue + Service Worker + Manifiesto</p>
      </div>

      <button v-if="puedeInstalar" class="btn" @click="instalarPWA">
        Instalar
      </button>
    </header>

    <main class="card">
      <form class="fila" @submit.prevent="agregarNota">
        <input
          v-model.trim="texto"
          class="input"
          placeholder="Escribe una nota..."
          maxlength="120"
        />
        <button class="btn" :disabled="!texto">Agregar</button>
      </form>

      <p class="pista">
        Estado: <b>{{ enLinea ? "En línea" : "Sin conexión" }}</b>
        • Notas: <b>{{ notas.length }}</b>
      </p>

      <ul class="lista" v-if="notas.length">
        <li class="item" v-for="nota in notas" :key="nota.id">
          <span class="nota">{{ nota.texto }}</span>
          <button class="btn peligro" @click="eliminarNota(nota.id)">Eliminar</button>
        </li>
      </ul>

      <p v-else class="vacio">No hay notas aún.</p>

      <div v-if="actualizacionLista" class="actualizacion">
        <span>Hay una nueva versión disponible.</span>
        <button class="btn" @click="recargarParaActualizar">Actualizar</button>
      </div>
    </main>

    <footer class="pie">
      <small>Tip: DevTools → Application → Service Workers para ver el SW.</small>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

/* =========================
   VARIABLES PRINCIPALES
========================= */

// Texto que escribe el usuario
const texto = ref("");

// Lista de notas
const notas = ref([]);

// Estado de conexión
const enLinea = ref(navigator.onLine);

/* =========================
   VARIABLES PARA PWA
========================= */

// Controla si se muestra el botón "Instalar"
const puedeInstalar = ref(false);

// Guarda el evento de instalación
let eventoInstalacion = null;

// Controla si se muestra el aviso de actualización
const actualizacionLista = ref(false);

// Referencia al Service Worker nuevo
let swEnEspera = null;

// Contador simple para los IDs
let contadorId = 1;

/* =========================
   FUNCIONES DE NOTAS
========================= */

// Cargar notas guardadas
function cargarNotas() {
  const datos = localStorage.getItem("notas_pwa");

  if (datos) {
    notas.value = JSON.parse(datos);

    // Ajustar el contador para que no se repitan IDs
    let ultimoId = 0;
    for (let i = 0; i < notas.value.length; i++) {
      if (notas.value[i].id > ultimoId) {
        ultimoId = notas.value[i].id;
      }
    }
    contadorId = ultimoId + 1;
  }
}

// Guardar notas
function guardarNotas() {
  localStorage.setItem("notas_pwa", JSON.stringify(notas.value));
}

// Agregar nota
function agregarNota() {
  if (texto.value === "") return;

  notas.value.unshift({
    id: contadorId,
    texto: texto.value
  });

  contadorId++;
  texto.value = "";
  guardarNotas();
}

// Eliminar nota
function eliminarNota(id) {
  notas.value = notas.value.filter((nota) => nota.id !== id);
  guardarNotas();
}

/* =========================
   FUNCIONES PWA
========================= */

// Mostrar ventana de instalación
function instalarPWA() {
  if (!eventoInstalacion) return;

  eventoInstalacion.prompt();
  eventoInstalacion = null;
  puedeInstalar.value = false;
}

// Actualizar aplicación
function recargarParaActualizar() {
  if (swEnEspera) {
    swEnEspera.postMessage({ tipo: "SALTAR_ESPERA" });
  }
  window.location.reload();
}

/* =========================
   INICIO DE LA APLICACIÓN
========================= */

onMounted(async () => {
  // Cargar notas al iniciar
  cargarNotas();

  // Detectar conexión
  window.addEventListener("online", () => {
    enLinea.value = true;
  });

  window.addEventListener("offline", () => {
    enLinea.value = false;
  });

  // Habilitar instalación PWA
  window.addEventListener("beforeinstallprompt", (evento) => {
    evento.preventDefault();
    eventoInstalacion = evento;
    puedeInstalar.value = true;
  });

  // Registrar Service Worker
  if ("serviceWorker" in navigator) {
    try {
      const registro = await navigator.serviceWorker.register("/sw.js");

      // Detectar actualización
      registro.addEventListener("updatefound", () => {
        const nuevoSW = registro.installing;
        if (!nuevoSW) return;

        nuevoSW.addEventListener("statechange", () => {
          if (
            nuevoSW.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            actualizacionLista.value = true;
            swEnEspera = nuevoSW;
          }
        });
      });
    } catch {
      // Error ignorado en desarrollo
    }
  }
});
</script>


<style>
:root {
  --fondo: #0b1220;
  --tarjeta: #121b2f;
  --texto: #e7eefc;
  --muted: rgba(231, 238, 252, 0.7);
  --acento: #4f8cff;
  --peligro: #ff4f6d;
  --borde: rgba(255, 255, 255, 0.12);
}

* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial;
  background: var(--fondo);
  color: var(--texto);
}

.app {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  padding: 16px;
  gap: 14px;
  max-width: 900px;
  margin: 0 auto;
}

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid var(--borde);
  padding: 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
}

h1 { margin: 0; font-size: 20px; }
.sub { margin: 4px 0 0; color: var(--muted); font-size: 13px; }

.card {
  border: 1px solid var(--borde);
  background: var(--tarjeta);
  border-radius: 18px;
  padding: 14px;
}

.fila {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
}

.input {
  width: 100%;
  padding: 12px 12px;
  border-radius: 12px;
  border: 1px solid var(--borde);
  background: rgba(255, 255, 255, 0.04);
  color: var(--texto);
  outline: none;
}

.input:focus { border-color: rgba(79, 140, 255, 0.8); }

.btn {
  padding: 12px 14px;
  border: 0;
  border-radius: 12px;
  background: var(--acento);
  color: #071022;
  font-weight: 700;
  cursor: pointer;
}

.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn.peligro { background: var(--peligro); color: #20040a; }

.pista { margin: 12px 2px 0; color: var(--muted); font-size: 13px; }

.lista { list-style: none; padding: 0; margin: 12px 0 0; display: grid; gap: 10px; }

.item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--borde);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
}

.nota { overflow-wrap: anywhere; }
.vacio { margin: 16px 2px 0; color: var(--muted); }

.actualizacion {
  margin-top: 12px;
  border: 1px dashed rgba(79, 140, 255, 0.8);
  padding: 12px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.pie { color: var(--muted); text-align: center; }

@media (max-width: 520px) {
  .fila { grid-template-columns: 1fr; }
  .item { grid-template-columns: 1fr; }
  .top { flex-direction: column; align-items: flex-start; }
}
</style>
