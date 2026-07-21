/**
 * Configuración de la aplicación Express.
 *
 * Responsabilidad: ensamblar el flujo de middlewares, montar las rutas
 * de la API, servir el frontend SPA y registrar el manejo de errores.
 * No contiene lógica de negocio; esta pertenece a los servicios
 * (ver /src/services).
 *
 * Flujo de solicitudes (Parte 6 de la especificación):
 *   Router -> Middlewares -> Validadores -> Controlador -> Servicio -> Repositorio -> PostgreSQL
 */
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');

const { env } = require('./config/env.config');
const apiRoutes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');

const app = express();

/* ------------------------------------------------------------------ */
/* Middlewares de seguridad y utilidades                              */
/* ------------------------------------------------------------------ */

// Helmet configura encabezados HTTP relacionados con la seguridad.
// contentSecurityPolicy se mantiene permisivo para el MVP porque la SPA
// carga Google Fonts y estilos inline generados por Tailwind.
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

/**
 * Registro de solicitudes. Formato 'dev' en desarrollo y 'combined'
 * en producción.
 *
 * Morgan nunca registra los cuerpos de las solicitudes, por lo que los
 * datos médicos no llegan a los logs.
 */
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

/* ------------------------------------------------------------------ */
/* Rutas de la API                                                     */
/* ------------------------------------------------------------------ */

// La ruta base es /api (sin versión para el MVP, preparada para usar
// /api/v1 en el futuro).
app.use('/api', apiRoutes);

/* ------------------------------------------------------------------ */
/* Alojamiento estático de la SPA                                      */
/* ------------------------------------------------------------------ */

// La SPA en Vanilla JS es servida por este mismo servidor Express en el MVP.
// Toda solicitud GET que no sea de la API continúa hacia index.html para
// que el router del cliente (History API) pueda resolver la ruta.
const frontendDir = path.resolve(__dirname, '../../frontend');
app.use(express.static(frontendDir));

app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

/* ------------------------------------------------------------------ */
/* Manejo de errores (debe registrarse al final)                       */
/* ------------------------------------------------------------------ */
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
