import { Router } from 'express';
import { serverManager } from '../serverManager.js';
import { sessionManager } from '../sessionManager.js';
import { config } from '../config.js';

export const apiRouter = Router();

// Estado global
apiRouter.get('/status', (req, res) => {
  res.json({
    system: config.systemName,
    bot: config.botName,
    prefix: config.prefix,
    servers: serverManager.getStatus(),
    sessions: sessionManager.getAll(),
  });
});

// Lista de servidores
apiRouter.get('/servers', (req, res) => {
  res.json(serverManager.getStatus());
});

// Registrar número y crear sesión
apiRouter.post('/register', async (req, res) => {
  const { number } = req.body || {};
  const normalized = String(number || '').replace(/\D/g, '');

  if (!normalized || normalized.length < 8 || normalized.length > 15) {
    return res.status(400).json({
      error: 'Número inválido (8-15 dígitos, sin símbolos)',
    });
  }

  try {
    const session = await sessionManager.createSession(normalized);
    res.json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Consultar sesión individual
apiRouter.get('/session/:id', (req, res) => {
  const s = sessionManager.getSession(req.params.id);
  if (!s) return res.status(404).json({ error: 'Sesión no encontrada' });
  res.json(s);
});

// Eliminar sesión
apiRouter.delete('/session/:id', (req, res) => {
  const ok = sessionManager.removeSession(req.params.id);
  res.json({ removed: ok });
});