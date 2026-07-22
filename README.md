# Palm Health — Plataforma de Gestión Clínica y Seguimiento a Distancia

**Palm Health** es una plataforma web orientada al sector salud que conecta de manera eficiente a pacientes y profesionales médicos. Permite la gestión autónoma del tratamiento por parte del paciente y el seguimiento clínico a distancia en tiempo real por parte del médico.

---

## 🚀 Inicio Rápido con Docker (Recomendado)

El proyecto está 100% contenedorizado con **Docker y Docker Compose**, lo que garantiza que se pueda **ejecutar en cualquier computadora** (Windows, macOS o Linux) sin importar las versiones instaladas en el sistema operativo host.

### Requisitos previos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (o Docker en Linux/macOS) en ejecución.

### Comandos para ejecutar:

1. **Clonar o abrir la carpeta del proyecto**:
   ```bash
   cd palm-health-platform
   ```

2. **Construir e iniciar los contenedores**:
   ```bash
   docker compose up --build
   ```

   *(En caso de reconstrucción limpia o si realizaste cambios profundos)*:
   ```bash
   docker compose down
   docker compose build --no-cache
   docker compose up
   ```

3. **Acceder a la aplicación**:
   Abre tu navegador e ingresa a: **`http://localhost:3000`**

---

## 🔧 ¿Cómo cambiar los puertos manualmente si están ocupados?

Si en otra computadora los puertos `3000` (Web) o `5433` (PostgreSQL) están siendo utilizados por otra aplicación, puedes cambiarlos fácilmente editando el archivo `docker-compose.yml`:

- **Para cambiar el puerto de la aplicación web** (ejemplo: usar el puerto 8080):
  ```yaml
  app:
    ports:
      - "8080:3000"   # Ahora accederás por http://localhost:8080
  ```

- **Para cambiar el puerto de la base de datos PostgreSQL** (ejemplo: usar el puerto 5434):
  ```yaml
  postgres:
    ports:
      - "5434:5432"   # Puerto expuesto hacia tu computadora host
  ```

---

## 💻 Ejecución Local (Sin Docker)

Si prefieres ejecutar el proyecto de forma local directamente con Node.js y PostgreSQL en tu máquina:

### Requisitos previos
- Node.js 20+
- pnpm 9+
- Servidor PostgreSQL 15+ local

### Pasos:

1. **Instalar dependencias**:
   ```bash
   pnpm install
   ```

2. **Crear la base de datos PostgreSQL**:
   ```sql
   CREATE DATABASE palm_health;
   ```

3. **Configurar el archivo `.env`**:
   Copia `.env.example` a `backend/.env` o ajusta las variables de entorno para tu conexión de PostgreSQL.

4. **Ejecutar migraciones y catálogos**:
   ```bash
   bash scripts/run-migrations.sh
   ```

5. **Iniciar en modo desarrollo**:
   ```bash
   pnpm dev
   ```

---

## ✨ Funcionalidades Principales

### 👤 Módulo del Paciente
- **Registro y Autenticación Segura (JWT)**.
- **Diario de Síntomas Interactivo**: Registro de síntomas por categoría, intensidad (1 al 10), zona corporal y descripción detallada.
- **Calendario de Citas Médicas**: Agendamiento y consulta de citas.
- **Visualización de Tratamientos, Medicamentos y Rutinas**: Consulta de prescripciones y pautas asignadas por el médico.
- **Notificaciones con Indicador de Punto Rojo**: Campana de alertas con punto rojo para notificaciones no leídas que desaparece al marcarlas como leídas.
- **Gestión de Cuenta**: Opción de cambiar contraseña y opción de eliminar/desactivar cuenta en Preferencias.

### 🩺 Módulo del Profesional de la Salud (Médico)
- **Registro con Verificación de Cédula Profesional**.
- **Gestión y Vinculación de Pacientes**: Vinculación de pacientes por correo electrónico.
- **Panel Clínico y Agenda**: Visualización del historial de síntomas, citas y observaciones médicas.
- **Asignación de Tratamientos**: Prescripción de medicamentos del catálogo y asignación de rutinas personalizadas.
- **Restricción de Seguridad en Eliminación de Cuenta**: La opción de eliminar cuenta valida que el médico no tenga pacientes activos asignados antes de permitir la eliminación.

---

## 🛠️ Arquitectura y Tecnologías

```
palm-health-platform/
├── frontend/            # Single Page Application (Vanilla JS + Tailwind CSS v4)
│   ├── index.html       # Shell HTML principal
│   └── src/
│       ├── css/         # Estilos Tailwind CSS
│       └── js/          # Componentes, vistas, layouts, servicios API y router
├── backend/             # REST API (Node.js + Express.js)
│   └── src/
│       ├── config/      # Configuración de env y pool PostgreSQL
│       ├── controllers/ # Controladores HTTP
│       ├── services/    # Lógica de negocio y reglas de autorización
│       ├── repositories/# Consultas SQL parametrizadas directas (sin ORM)
│       ├── routes/      # Rutas de autenticación, pacientes y profesionales
│       ├── middlewares/ # Autenticación JWT, roles y manejo de errores
│       └── validators/  # Validaciones con express-validator
├── database/
│   ├── migrations/      # Migraciones SQL estructuradas (001 a 015)
│   └── seeds/           # Catálogos base de síntomas, medicamentos y rutinas
├── scripts/
│   └── run-migrations.sh# Script para aplicar migraciones y catálogos en orden
├── Dockerfile           # Configuración del contenedor Node.js
├── .dockerignore        # Exclusión de node_modules locales
└── docker-compose.yml   # Orquestación de PostgreSQL y API Backend
```

| Capa | Tecnología |
|---|---|
| **Frontend** | HTML5, CSS3, Tailwind CSS v4, JavaScript Vanilla (Módulos ES6+), History API SPA |
| **Backend** | Node.js, Express.js, JWT (`jsonwebtoken`), `bcrypt`, `helmet`, `cors`, `express-validator` |
| **Base de Datos** | PostgreSQL 15 (consultas SQL directas parametrizadas con `pg`, ACID) |
| **Contenedores** | Docker y Docker Compose |

---

## 📄 Licencia

Proyecto desarrollado para la plataforma Palm Health.
