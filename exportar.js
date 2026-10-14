// exportar.js — Genera los archivos de salida para Civil 3D / AutoCAD

// CSV delimitado por comas: Punto,Norte,Este,Cota,Descripción (PNEZD)
function generarCSV(puntos) {
  return puntos.map(p =>
    [p.punto, p.norte.toFixed(3), p.este.toFixed(3), p.cota.toFixed(3), p.descripcion || ""].join(",")
  ).join("\r\n") + "\r\n";
}

// TXT delimitado por espacios: Punto Norte Este Cota (PNEZ)
function generarTXT(puntos) {
  return puntos.map(p =>
    [p.punto, p.norte.toFixed(3), p.este.toFixed(3), p.cota.toFixed(3)].join(" ")
  ).join("\r\n") + "\r\n";
}

// Descarga un texto como archivo
function descargar(nombre, contenido) {
  const blob = new Blob([contenido], { type: "text/plain" });
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(blob);
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(enlace.href);
}