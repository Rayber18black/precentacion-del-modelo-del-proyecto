const fs = require('fs');
const path = require('path');

// Rutas absolutas a los archivos JSON para evitar problemas de ruta al ejecutar
const RUTA_ESTUDIANTES = path.join(__dirname, 'estudiantes.json');
const RUTA_USUARIOS = path.join(__dirname, 'usuarios.json');

// Función genérica para leer datos de los JSON
const leerJSON = (ruta) => {
  if (!fs.existsSync(ruta)) return [];
  const contenido = fs.readFileSync(ruta, 'utf-8').trim();
  return contenido ? JSON.parse(contenido) : [];
};

// Función genérica para escribir datos formateados
const escribirJSON = (ruta, datos) => {
  fs.writeFileSync(ruta, JSON.stringify(datos, null, 2), 'utf-8');
};

module.exports = {
  leerEstudiantes: () => leerJSON(RUTA_ESTUDIANTES),
  guardarEstudiantes: (datos) => escribirJSON(RUTA_ESTUDIANTES, datos),
  leerUsuarios: () => leerJSON(RUTA_USUARIOS),
  guardarUsuarios: (datos) => escribirJSON(RUTA_USUARIOS, datos),
  // Funciones de compatibilidad por si se usan con el nombre anterior
  cargarDatos: () => leerJSON(RUTA_ESTUDIANTES),
  guardarDatos: (datos) => escribirJSON(RUTA_ESTUDIANTES, datos)
};
