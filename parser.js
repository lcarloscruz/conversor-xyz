// parser.js — Lector de archivos .xyz (Topcon GTS)

function parsearXYZ(texto) {
  // 1. Unir los bloques: quitar STX, ETX, saltos de línea y los 4 dígitos de control
  let datos = "";
  const bloques = texto.match(/\x02[\s\S]*?\x03/g);

  if (bloques) {
    // Formato con caracteres de control (archivo original del equipo)
    for (const b of bloques) {
      datos += b.slice(1, -1).slice(0, -4);   // sin STX/ETX y sin los 4 dígitos
    }
  } else {
    // Formato sin caracteres de control (texto copiado y pegado)
    for (const linea of texto.split(/\r?\n/)) {
      if (linea.length > 4) datos += linea.slice(0, -4);
    }
  }

  // 2. Leer cada punto: +ID _ x+NORTE_ yESTE_ z+COTA_
  const patron = /\+(\d+)\s*_\s*x([+-]?\d+)_\s*y([+-]?\d+)_\s*z([+-]?\d+)_/g;
  const puntos = [];
  let m;
  while ((m = patron.exec(datos)) !== null) {
    puntos.push({
      punto: parseInt(m[1], 10),
      norte: parseInt(m[2], 10) / 1000,
      este:  parseInt(m[3], 10) / 1000,
      cota:  parseInt(m[4], 10) / 1000
    });
  }
  return puntos;
}