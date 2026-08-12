import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import path from 'node:path';

import authRoutes from './routes/auth.routes.js';
import listingsRoutes from './routes/listings.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(compression());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());
  app.use(pinoHttp());

  // Ảnh upload — cache lâu vì filename có hash/timestamp nên không đổi nội dung
  app.use(
    '/uploads',
    express.static(path.resolve('uploads'), {
      maxAge: '30d',
      immutable: true,
    }),
  );

  app.use('/api/auth', authRoutes);
  app.use('/api/listings', listingsRoutes);

  // --- Từ tuần 8: serve React build ở đây (monolith) ---
  const clientDist = path.resolve('../client/dist');
  app.use(express.static(clientDist, { maxAge: '1y' }));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));

  app.use(errorHandler);

  return app;
}
