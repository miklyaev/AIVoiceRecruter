import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { initDatabase } from './db';
import settingsRouter from './routes/settings';
import interviewsRouter from './routes/interviews';
import adminRouter from './routes/admin';
import { ROLES } from './types';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000');

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Request logging (without secrets)
app.use((req, _res, next) => {
  const sanitizedUrl = req.url;
  console.log(`${new Date().toISOString()} ${req.method} ${sanitizedUrl}`);
  next();
});

// Audio files serving
const audioDir = path.join(__dirname, '..', 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}
app.use('/api/audio', express.static(audioDir));

// API routes
app.use('/api/settings', settingsRouter);
app.use('/api/interviews', interviewsRouter);
app.use('/api/admin', adminRouter);

// GET /api/roles
app.get('/api/roles', (_req, res) => {
  res.json(Object.entries(ROLES).map(([id, role]) => ({ id, title: role.title })));
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err.message);
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Слишком большой файл' });
  }
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

async function start() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

export default app;