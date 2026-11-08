// parser.js — Lector de archivos de la estación Topcon (formato GTS)
// Lee dos variantes:
//   .xyz : +PUNTO _ x+NORTE_ yESTE_ z+COTA_            (milímetros, sin código)
//   .raw : +PUNTO_ /NORTE ESTE COTA m... d..._*CÓDIGO_,ALTURA_  (0,1 mm, con código)

// 1. Unir los bloques: quitar STX, ETX, saltos de línea y los 4 dígitos de control
function unirBloques(texto) {
  let datos = "";
  const bloques = texto.match(/\x02[\s\S]*?\x03/g);
  if (bloques) {
    for (const b of bloques) datos += b.slice(1, -1).slice(0, -4);
  } else {
    for (const linea of texto.split(/\r?\n/)) {
      if (linea.length > 4) datos += linea.slice(0, -4);
    }
  }
  return datos;
}

// Convierte un campo de 11 caracteres (signo + 10 dígitos, en décimas de mm) a metros con 3 decimales.
// Si el valor pasa de 999999,9999 m, el primer carácter es un dígito y no un signo.
function campoGTS(campo) {
  const decimasMm = parseInt(campo, 10);          // "+9496412402" -> 9496412402
  return Math.round(decimasMm / 10) / 1000;       // redondea a milímetros
}

function parsearXYZ(texto) {
  const datos = unirBloques(texto);
  const puntos = [];
  let m;

  // Variante .raw (con código y altura del prisma)
  const patronRaw = /\+(\d+)_ \/([+\-\d]\d{10})([+\-\d]\d{10})([+\-\d]\d{10})m\d+d\d+_\*([^_]*)_,([\d.]+)_/g;
  while ((m = patronRaw.exec(datos)) !== null) {
    puntos.push({
      punto: parseInt(m[1], 10),
      norte: campoGTS(m[2]),
      este:  campoGTS(m[3]),
      cota:  campoGTS(m[4]),
      descripcion: m[5].trim(),
      alturaPrisma: parseFloat(m[6])
    });
  }
  if (puntos.length > 0) return puntos;

  // Variante .xyz (sin código)
  const patronXyz = /\+(\d+)\s*_\s*x([+-]?\d+)_\s*y([+-]?\d+)_\s*z([+-]?\d+)_/g;
  while ((m = patronXyz.exec(datos)) !== null) {
    puntos.push({
      punto: parseInt(m[1], 10),
      norte: parseInt(m[2], 10) / 1000,
      este:  parseInt(m[3], 10) / 1000,
      cota:  parseInt(m[4], 10) / 1000,
      descripcion: ""
    });
  }
  return puntos;
}