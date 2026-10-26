import express from 'express';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { config } from './src/config.js';
import { logger } from './src/logger.js';
import { apiRouter } from './src/routes/api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', apiRouter);

// Manejo de errores global
app.use((err, req, res, next) => {
  logger.error({ err }, 'Error no controlado');
  res.status(500).json({ error: 'Error interno del servidor' });
});

const server = http.createServer(app);

server.listen(config.port, () => {
  logger.info(`[${config.systemName}] escuchando en http://localhost:${config.port}`);
  logger.info(`[${config.systemName}] bot activo: ${config.botName}`);
  logger.info(`[${config.systemName}] ${config.totalServers} servidores x ${config.slotsPerServer} slots = ${config.totalServers * config.slotsPerServer} sesiones max`);
});