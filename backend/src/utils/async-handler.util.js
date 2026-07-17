/**
 * Async controller wrapper.
 *
 * Express 4 does not forward rejected promises to the error middleware
 * automatically. Every async controller is wrapped with this helper so
 * thrown AppErrors (and unexpected errors) always reach the global
 * error handler — no try/catch boilerplate inside controllers.
 */

/**
 * Wraps an async request handler and pipes rejections to next().
 *
 * @param {(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => Promise<*>} handler
 * @returns {import('express').RequestHandler}
 */
const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

module.exports = { asyncHandler };
