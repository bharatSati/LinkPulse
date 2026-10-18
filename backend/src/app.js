import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import env from './config/env.js';
import routes from './routes/index.js';
import redirectRoutes from './routes/redirect.routes.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';
import { apiLimiter, redirectLimiter } from './middleware/rateLimit.middleware.js';
import sanitizeRequest from './middleware/sanitize.middleware.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  helmet({
    referrerPolicy: { policy: 'no-referrer' },
    crossOriginResourcePolicy: { policy: 'same-site' },
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        // The short-link pages are served from this origin but may be reached
        // over http and/or viewed through a proxy origin, so allow the public
        // backend/frontend origins explicitly. Otherwise the form submit can be
        // blocked by `form-action 'self'` once `upgrade-insecure-requests`
        // rewrites the action to https.
        'form-action': ["'self'", env.backendUrl, env.frontendUrl],
        // The password page pulls its favicon from the frontend origin.
        'img-src': ["'self'", 'data:', env.frontendUrl],
        // `upgrade-insecure-requests` rewrites relative form actions to https,
        // which no longer match `form-action 'self'` on an http document and
        // silently blocks the unlock POST. HTTPS is already enforced by the
        // host (Render 301 + HSTS), so this directive is redundant here.
        'upgrade-insecure-requests': null,
      },
    },
  })
);
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
    optionsSuccessStatus: 200,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(sanitizeRequest);

if (env.nodeEnv !== 'test') {
  // Only log server errors (5xx). Successful requests and expected client
  // errors (4xx) are intentionally silent to keep the console quiet.
  app.use(
    morgan(env.isProduction ? 'combined' : 'dev', {
      skip: (req, res) => res.statusCode < 500,
    })
  );
}

app.use('/api/v1', apiLimiter, routes);

app.use('/', redirectLimiter, redirectRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
