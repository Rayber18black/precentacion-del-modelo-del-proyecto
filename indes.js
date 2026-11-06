const readline = require('readline');
const {
  autenticarUsuario,
  consultarEstudiantes,
  agregarEstudiante,
  modificarEstudiante,
  eliminarEstudiante,
  asignarRolYPassword,
  listarUsuarios
} = require('./funciones');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const preguntar = (texto) => new Promise((resolve) => rl.question(texto, resolve));

let credencialesActivas = null;
let sesionInfo = null;

// Menú de Login Inicial
const iniciarSesionMenu = async () => {
  console.log('\n=========================================');
  console.log('   SISTEMA DE GESTIÓN DE NOTAS - LOGIN   ');
  console.log('=========================================');
  const username = (await preguntar('Usuario (o escribe "salir" para cerrar): ')).trim();
  if (username.toLowerCase() === 'salir') {
    console.log('Cerrando aplicación...');
    rl.close();
    return;
  }
  const password = (await preguntar('Contraseña: ')).trim();

  try {
    sesionInfo = autenticarUsuario(username, password);
    credencialesActivas = { username, password };
    console.log(`\n✅ Bienvenido, ${sesionInfo.username} | Rol: ${sesionInfo.rol.toUpperCase()} (Nivel ${sesionInfo.nivel})`);
    await mostrarMenuPrincipal();
  } catch (error) {
    console.log(`\n❌ ${error.message}`);
    await iniciarSesionMenu();
  }
};

// Menú Principal Interactivo
const mostrarMenuPrincipal = async () => {
  console.log('\n-----------------------------------------');
  console.log(`Usuario activo: ${sesionInfo.username} [${sesionInfo.rol.toUpperCase()}]`);
  console.log('-----------------------------------------');
  console.log('1. Consultar estudiantes y promedios (Docente / Admin / Root)');
  console.log('2. Agregar nuevo estudiante y 3 notas (Docente / Admin / Root)');
  console.log('3. Modificar estudiante / 3 notas     (Admin / Root)');
  console.log('4. Eliminar estudiante               (Admin / Root)');
  console.log('5. Crear/Asignar rol y contraseña    (Solo Root)');
  console.log('6. Ver lista de usuarios y claves    (Solo Root)');
  console.log('7. Cerrar sesión (Cambiar de usuario)');
  console.log('0. Salir del programa');
  console.log('-----------------------------------------');

  const opcion = (await preguntar('Selecciona una opción: ')).trim();

  try {
    switch (opcion) {
      case '1': {
        const lista = consultarEstudiantes(credencialesActivas);
        console.log('\n📋 LISTA DE ESTUDIANTES:');
        if (lista.length === 0) {
          console.log('No hay estudiantes registrados actualmente.');
        } else {
          console.table(lista);
        }
        break;
      }

      case '2': {
        console.log('\n--- REGISTRO DE NUEVO ESTUDIANTE ---');
        const id = (await preguntar('ID o Cédula del estudiante: ')).trim();
        const nombre = (await preguntar('Nombre completo: ')).trim();
        const notasStr = await preguntar('Ingrese las 3 notas separadas por coma (ej: 14, 16, 18): ');
        const notas = notasStr
          .split(',')
          .map((n) => parseFloat(n.trim()))
          .filter((n) => !isNaN(n));

        const creado = agregarEstudiante(credencialesActivas, { id, nombre, notas });
        console.log('\n✅ Estudiante registrado con éxito:');
        console.log(`   ID/Cédula : ${creado.id}`);
        console.log(`   Nombre    : ${creado.nombre}`);
        console.log(`   Notas     : [${creado.notas.join(', ')}]`);
        console.log(`   Promedio  : ${creado.promedio}`);
        console.log(`   Estado    : ${creado.aprobado ? 'APROBADO' : 'REPROBADO'}`);
        break;
      }

      case '3': {
        console.log('\n--- MODIFICAR ESTUDIANTE ---');
        const id = (await preguntar('ID o Cédula del estudiante a modificar: ')).trim();
        const nuevoNombre = (await preguntar('Nuevo nombre (deja vacío para mantener actual): ')).trim();
        const notasStr = (await preguntar('Nuevas 3 notas separadas por coma (ej: 18, 19, 20) o vacío para mantener: ')).trim();
        const nuevasNotas = notasStr
          ? notasStr.split(',').map((n) => parseFloat(n.trim())).filter((n) => !isNaN(n))
          : [];

        const actualizado = modificarEstudiante(credencialesActivas, id, nuevoNombre, nuevasNotas);
        console.log('\n✅ Estudiante actualizado con éxito:');
        console.log(`   ID/Cédula : ${actualizado.id}`);
        console.log(`   Nombre    : ${actualizado.nombre}`);
        console.log(`   Notas     : [${actualizado.notas.join(', ')}]`);
        console.log(`   Promedio  : ${actualizado.promedio}`);
        console.log(`   Estado    : ${actualizado.aprobado ? 'APROBADO' : 'REPROBADO'}`);
        break;
      }

      case '4': {
        console.log('\n--- ELIMINAR ESTUDIANTE ---');
        const id = (await preguntar('ID o Cédula del estudiante a eliminar: ')).trim();
        const confirmar = (await preguntar(`¿Seguro que desea eliminar al estudiante con ID ${id}? (Escriba 'SI' para confirmar): `)).trim().toUpperCase();

        if (confirmar === 'SI') {
          const res = eliminarEstudiante(credencialesActivas, id);
          console.log(`\n🗑️ Estudiante '${res.eliminado}' eliminado permanentemente. Total restantes: ${res.restantes}`);
        } else {
          console.log('\nOperación de eliminación cancelada.');
        }
        break;
      }

      case '5': {
        console.log('\n--- ASIGNAR ROL Y CONTRASEÑA (SOLO ROOT) ---');
        const targetUser = (await preguntar('Nombre del usuario (nuevo o existente): ')).trim();
        const targetPass = (await preguntar('Asignar contraseña: ')).trim();
        const targetRol = (await preguntar('Asignar rol (docente / admin / root): ')).trim();

        const resultado = asignarRolYPassword(credencialesActivas, targetUser, targetPass, targetRol);
        console.log(`\n✅ Usuario ${resultado.accion} correctamente:`);
        console.log(`   ID: ${resultado.usuario.id} | Usuario: ${resultado.usuario.username} | Rol: ${resultado.usuario.rol}`);
        break;
      }

      case '6': {
        const usuarios = listarUsuarios(credencialesActivas);
        console.log('\n🔐 USUARIOS REGISTRADOS EN EL SISTEMA:');
        console.table(usuarios);
        break;
      }

      case '7': {
        credencialesActivas = null;
        sesionInfo = null;
        console.log('\n🔒 Sesión cerrada con éxito.');
        return await iniciarSesionMenu();
      }

      case '0': {
        console.log('\n👋 Saliendo del sistema de notas...');
        rl.close();
        return;
      }

      default:
        console.log('\n⚠️ Opción no válida. Por favor seleccione una opción del menú.');
    }
  } catch (error) {
    console.log(`\n❌ [OPERACIÓN BLOQUEADA]: ${error.message}`);
  }

  await mostrarMenuPrincipal();
};

// Iniciar la aplicación
iniciarSesionMenu();
