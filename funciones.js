const db = require('./db');

// 1. Pesos numéricos por rol y nivel requerido por cada acción
const PESO_ROLES = {
  docente: 1,
  admin: 2,
  root: 3
};

const NIVEL_ACCION = {
  CONSULTAR: 1,
  AGREGAR: 1,
  MODIFICAR: 2,
  ELIMINAR: 2,
  GESTIONAR_USUARIOS: 3
};

// 2. Funciones de autenticación y verificación de permisos
const autenticarUsuario = (username, password) => {
  const usuarios = db.leerUsuarios();
  const usuario = usuarios.find(
    (u) => u.username === username && u.password === password
  );
  if (!usuario) {
    throw new Error('Credenciales incorrectas (usuario o contraseña inválidos).');
  }
  return {
    username: usuario.username,
    rol: usuario.rol,
    nivel: PESO_ROLES[usuario.rol] || 0
  };
};

const calcularPermiso = (nivelUsuario, nivelRequerido) => {
  // Diferencia algebraica: si la resta es >= 0 el usuario tiene permiso suficiente
  return (nivelUsuario - nivelRequerido) >= 0;
};

// Función para calcular el promedio de notas
const calcularPromedio = (notas = []) => {
  if (notas.length === 0) return 0;
  const suma = notas.reduce((acc, n) => acc + Number(n), 0);
  return Number((suma / notas.length).toFixed(2));
};

// 3. Higher-Order Function para proteger las acciones según el rol
const autorizar = (nivelRequerido, fnOperacion) => {
  return (credenciales, ...args) => {
    const sesion = autenticarUsuario(credenciales.username, credenciales.password);

    if (!calcularPermiso(sesion.nivel, nivelRequerido)) {
      throw new Error(
        `Acceso denegado para el rol '${sesion.rol}' (Nivel ${sesion.nivel}). Se requiere Nivel ${nivelRequerido}.`
      );
    }
    return fnOperacion(...args);
  };
};

// 4. Operaciones del Sistema protegidas por Nivel

// Nivel 1: Docente, Admin y Root (Consultar y Agregar)
const consultarEstudiantes = autorizar(NIVEL_ACCION.CONSULTAR, () => {
  const estudiantes = db.leerEstudiantes();
  return estudiantes.map((e) => {
    // Si viene del formato anterior con nota1 y nota2, lo adaptamos a arreglo
    let notas = e.notas;
    if (!notas && (e.nota1 !== undefined || e.nota2 !== undefined)) {
      notas = [e.nota1, e.nota2].filter((n) => typeof n === 'number');
    }
    notas = notas || [];

    const prom = calcularPromedio(notas);
    return {
      id: e.id || e.cedula,
      nombre: e.nombre,
      notas: notas,
      promedio: prom,
      estado: prom >= 10 ? 'APROBADO' : 'REPROBADO'
    };
  });
});

const agregarEstudiante = autorizar(NIVEL_ACCION.AGREGAR, (nuevo) => {
  const estudiantes = db.leerEstudiantes();

  // Validar campos obligatorios
  if (!nuevo.id || !nuevo.nombre || String(nuevo.id).trim() === '' || String(nuevo.nombre).trim() === '') {
    throw new Error('El ID o Cédula y el nombre no pueden estar vacíos.');
  }

  const idNormalizado = String(nuevo.id).trim();

  // Validar que la cédula/ID no esté repetida
  if (estudiantes.some((e) => String(e.id).trim() === idNormalizado || String(e.cedula).trim() === idNormalizado)) {
    throw new Error(`Ya existe un estudiante registrado con el ID o Cédula '${nuevo.id}'.`);
  }

  // Validar que se ingresen exactamente 3 notas
  if (!nuevo.notas || nuevo.notas.length !== 3) {
    throw new Error('Debe ingresar exactamente 3 notas (Evaluación 1, 2 y 3).');
  }

  // Validar rango escolar de notas (0 a 20)
  for (let i = 0; i < nuevo.notas.length; i++) {
    const nota = Number(nuevo.notas[i]);
    if (isNaN(nota) || nota < 0 || nota > 20) {
      throw new Error(`La nota ${i + 1} (${nuevo.notas[i]}) no es válida. Debe ser un número entre 0 y 20.`);
    }
  }

  const notasLimpias = nuevo.notas.map(Number);
  const promedioFinal = calcularPromedio(notasLimpias);

  const registro = {
    id: idNormalizado,
    cedula: idNormalizado,
    nombre: String(nuevo.nombre).trim(),
    notas: notasLimpias,
    promedio: promedioFinal,
    aprobado: promedioFinal >= 10
  };

  estudiantes.push(registro);
  db.guardarEstudiantes(estudiantes);
  return registro;
});

// Nivel 2: Admin y Root (Modificar y Eliminar)
const modificarEstudiante = autorizar(NIVEL_ACCION.MODIFICAR, (id, nuevoNombre, nuevasNotas) => {
  const estudiantes = db.leerEstudiantes();
  const idBuscado = String(id).trim();

  const idx = estudiantes.findIndex(
    (e) => String(e.id).trim() === idBuscado || String(e.cedula).trim() === idBuscado
  );

  if (idx === -1) {
    throw new Error(`Estudiante con ID o Cédula '${id}' no encontrado.`);
  }

  if (nuevoNombre && String(nuevoNombre).trim() !== '') {
    estudiantes[idx].nombre = String(nuevoNombre).trim();
  }

  if (nuevasNotas && nuevasNotas.length > 0) {
    if (nuevasNotas.length !== 3) {
      throw new Error('Debe ingresar exactamente 3 notas para actualizar al estudiante.');
    }

    for (let i = 0; i < nuevasNotas.length; i++) {
      const nota = Number(nuevasNotas[i]);
      if (isNaN(nota) || nota < 0 || nota > 20) {
        throw new Error(`La nota ${i + 1} (${nuevasNotas[i]}) no es válida. Debe ser entre 0 y 20.`);
      }
    }

    const notasLimpias = nuevasNotas.map(Number);
    estudiantes[idx].notas = notasLimpias;
    estudiantes[idx].promedio = calcularPromedio(notasLimpias);
    estudiantes[idx].aprobado = estudiantes[idx].promedio >= 10;
  }

  db.guardarEstudiantes(estudiantes);
  return estudiantes[idx];
});

const eliminarEstudiante = autorizar(NIVEL_ACCION.ELIMINAR, (id) => {
  const estudiantes = db.leerEstudiantes();
  const idBuscado = String(id).trim();

  const filtrados = estudiantes.filter(
    (e) => String(e.id).trim() !== idBuscado && String(e.cedula).trim() !== idBuscado
  );

  if (estudiantes.length === filtrados.length) {
    throw new Error(`Estudiante con ID o Cédula '${id}' no existe.`);
  }

  db.guardarEstudiantes(filtrados);
  return { eliminado: id, restantes: filtrados.length };
});

// Nivel 3: Solo Root (Gestión de Usuarios y Roles)
const asignarRolYPassword = autorizar(
  NIVEL_ACCION.GESTIONAR_USUARIOS,
  (targetUsername, targetPassword, nuevoRol) => {
    const rolNormalizado = nuevoRol.toLowerCase().trim();
    if (!PESO_ROLES[rolNormalizado]) {
      throw new Error(`Rol inválido '${nuevoRol}'. Usa: docente, admin o root.`);
    }
    if (!targetUsername || !targetPassword) {
      throw new Error('Debes proporcionar un nombre de usuario y una contraseña válida.');
    }

    const usuarios = db.leerUsuarios();
    const idx = usuarios.findIndex((u) => u.username === targetUsername.trim());

    if (idx !== -1) {
      usuarios[idx].password = String(targetPassword).trim();
      usuarios[idx].rol = rolNormalizado;
      db.guardarUsuarios(usuarios);
      return { accion: 'actualizado', usuario: usuarios[idx] };
    } else {
      const nuevoUsuario = {
        id: `u${usuarios.length + 1}`,
        username: String(targetUsername).trim(),
        password: String(targetPassword).trim(),
        rol: rolNormalizado
      };
      usuarios.push(nuevoUsuario);
      db.guardarUsuarios(usuarios);
      return { accion: 'creado', usuario: nuevoUsuario };
    }
  }
);

const listarUsuarios = autorizar(NIVEL_ACCION.GESTIONAR_USUARIOS, () => {
  return db.leerUsuarios();
});

module.exports = {
  autenticarUsuario,
  consultarEstudiantes,
  agregarEstudiante,
  modificarEstudiante,
  eliminarEstudiante,
  asignarRolYPassword,
  listarUsuarios,
  calcularPromedio
};
