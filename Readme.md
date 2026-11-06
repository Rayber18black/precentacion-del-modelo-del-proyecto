# Gestor Académico de Notas - Sistema con Autenticación y Control de Roles

Este proyecto es una aplicación de terminal, interactiva tipo **CRUD** (Crear, Leer, Actualizar, Eliminar) desarrollada para gestionar el registro de calificaciones de estudiantes con sistema de **autenticación y roles de acceso**, cumpliendo con los objetivos pedagógicos del **Trayecto I - Trimestre II** de Programación.

## Datos del Equipo (Equipo 2) 👥
- **Integrante 1**: [Luiyu Crespo] - C.I. [32.715.886]
- **Integrante 2**: [Rayber Naranjo] - C.I. [32.325.413]
- **Integrante 3**: [Wilfredo Canelon] - C.I. [33.756.235]
- **Integrante 4**: [lisandro Viloria] - C.I. [32.461.110]

---

## Requerimientos Implementados

### 1. Sistema de Autenticación y Roles (RBAC)
Los usuarios inician sesión con su nombre de usuario y contraseña almacenados en `usuarios.json`. El acceso a cada operación se calcula de forma algebraica según su nivel de jerarquía:
- **Docente (Nivel 1)**: Consultar listados y registrar nuevos estudiantes con sus notas.
- **Admin (Nivel 2)**: Todas las funciones de docente + modificar datos/notas y eliminar estudiantes.
- **Root (Nivel 3)**: Acceso total al sistema + gestión de usuarios, asignación de roles y contraseñas.

#### Usuarios Preconfigurados:
- **rayber** / Clave: `123` (Rol: root)
- **carlos** / Clave: `123` (Rol: admin)
- **ana** / Clave: `123` (Rol: docente)

### 2. Registro de 3 Notas y Campos Estrictos
Cada estudiante se registra con los siguientes campos:
- **ID / Cédula de Identidad** (Texto, obligatorio y único para evitar duplicados)
- **Nombre Completo** (Texto, obligatorio)
- **3 Notas de Evaluaciones** (Evaluación 1, 2 y 3: números estrictamente en el rango del 0 al 20)

### 3. Cálculos y Transformaciones Lógicas
- El sistema calcula automáticamente el **Promedio Final** de las 3 evaluaciones con dos decimales.
- Determina automáticamente el estado del estudiante: **APROBADO** (promedio $\ge$ 10) o **REPROBADO** (promedio < 10).

### 4. Arquitectura Modular
- `db.js`: Módulo de persistencia y manejo de lectura/escritura de los archivos JSON (`estudiantes.json` y `usuarios.json`).
- `funciones.js`: Lógica de autenticación, verificación de permisos mediante Higher-Order Functions (`autorizar`), validaciones escolares (rango 0-20, exactamente 3 notas) y operaciones CRUD.
- `indes.js`: Interfaz de usuario interactiva por consola con menú guiado mediante el módulo nativo `readline`.

---

## Instrucciones de Ejecución

### 1. Iniciar la Aplicación
El sistema utiliza el módulo estándar nativo `readline` de Node.js, por lo que **no requiere dependencias externas obligatorias**. Simplemente ejecuta en la terminal:

```bash
node indes.js
```

### 2. Archivos de Datos
- `estudiantes.json`: Base de datos de estudiantes y sus 3 calificaciones.
- `usuarios.json`: Base de datos de credenciales y roles del sistema.
