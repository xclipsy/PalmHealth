/**
 * Wrapper para controladores asíncronos.
 *
 * Express 4 no reenvía promesas rechazadas al middleware de errores de forma
 * automática. Este helper envuelve cada controlador asíncrono para que los
 * AppErrors (y errores inesperados) lleguen siempre al manejador global,
 * eliminando el bloque try/catch en los controladores.
 */

/**
 * Envuelve un manejador de peticiones asíncrono y reenvía las promesas rechazadas a next().
 */

/**
 * Envuelve un manejador de peticiones asíncrono y reenvía las promesas rechazadas a next().
 *
 * @param {(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => Promise<*>} handler
 * @returns {import('express').RequestHandler}
 */
const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

module.exports = { asyncHandler };
