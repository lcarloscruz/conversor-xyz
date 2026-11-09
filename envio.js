// envio.js — Envío de levantamientos a la oficina (receptor en Google Apps Script)
// Si no hay señal, el envío queda guardado en el celular y se reintenta al volver la conexión.

const CLAVE_CONFIG = "conversorxyz.config";
const CLAVE_COLA = "conversorxyz.cola";

function leerLocal(nombre, porDefecto) {
  try {
    const v = localStorage.getItem(nombre);
    return v ? JSON.parse(v) : porDefecto;
  } catch (e) {
    return porDefecto;
  }
}

function guardarLocal(nombre, valor) {
  try {
    localStorage.setItem(nombre, JSON.stringify(valor));
    return true;
  } catch (e) {
    return false;
  }
}

function leerConfig() { return leerLocal(CLAVE_CONFIG, { url: "", clave: "" }); }
function guardarConfig(url, clave) { return guardarLocal(CLAVE_CONFIG, { url: url.trim(), clave: clave.trim() }); }
function leerCola() { return leerLocal(CLAVE_COLA, []); }

function encolar(envio) {
  const cola = leerCola();
  cola.push(envio);
  return guardarLocal(CLAVE_COLA, cola);
}

// Envía un levantamiento al receptor y devuelve su respuesta
async function enviarUno(envio, config) {
  const resp = await fetch(config.url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" }, // evita la verificación previa (CORS)
    body: JSON.stringify({ clave: config.clave, registro: envio.registro, archivo: envio.archivo })
  });
  const datos = await resp.json();
  if (!datos.ok) {
    const error = new Error(datos.error || "El receptor rechazó el envío");
    error.delReceptor = true;
    throw error;
  }
  return datos;
}

// Envía todo lo pendiente, en orden. Se detiene en el primer error.
let enviando = false;
async function procesarCola(alTerminar) {
  if (enviando) return;
  const config = leerConfig();
  let cola = leerCola();
  if (!config.url || !config.clave) {
    if (alTerminar) alTerminar({ enviados: 0, pendientes: cola.length, error: "Falta configurar el envío (URL y clave)" });
    return;
  }
  enviando = true;
  let enviados = 0;
  let error = "";
  while (cola.length > 0) {
    try {
      await enviarUno(cola[0], config);
      cola.shift();
      guardarLocal(CLAVE_COLA, cola);
      enviados++;
    } catch (e) {
      error = e.delReceptor ? e.message : "sin señal";
      if (!e.delReceptor && !cola[0].registro.observaciones) {
        // Queda constancia en el registro de que el envío esperó a tener señal
        cola[0].registro.observaciones = "Sin señal en campo; enviado al recuperar conexión";
        guardarLocal(CLAVE_COLA, cola);
      }
      break;
    }
  }
  enviando = false;
  if (alTerminar) alTerminar({ enviados: enviados, pendientes: cola.length, error: error });
}
