import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import pino from 'pino';
import path from 'path';
import fs from 'fs';
import { config } from './config.js';
import { logger } from './logger.js';
import { serverManager } from './serverManager.js';
import { handleMessage } from './bot/index.js';

const silentLogger = pino({ level: 'silent' });

class SessionManager {
  constructor() {
    this.sessions = new Map();
  }

  async createSession(number) {
    if (serverManager.findByNumber(number)) {
      throw new Error('El número ya está registrado');
    }

    const sessionId = `${number}_${Date.now()}`;
    const server = serverManager.addSlot(number, sessionId);

    const sessionDir = path.join(config.sessionsDir, sessionId);
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: silentLogger,
      browser: [`${config.systemName}`, 'Chrome', '1.0.0'],
    });

    const sessionData = {
      id: sessionId,
      number,
      serverId: server.id,
      sock,
      qr: null,
      status: 'connecting',
      createdAt: Date.now(),
    };
    this.sessions.set(sessionId, sessionData);

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          const qrDataUrl = await QRCode.toDataURL(qr, { width: 300, margin: 2 });
          sessionData.qr = qrDataUrl;
          sessionData.status = 'awaiting_qr';
          logger.info({ sessionId }, 'QR generado');
        } catch (err) {
          logger.error({ err }, 'Error generando QR');
        }
      }

      if (connection === 'open') {
        sessionData.status = 'connected';
        sessionData.qr = null;
        logger.info({ sessionId, number }, 'Sesión conectada');
      }

      if (connection === 'close') {
        const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
        if (code === DisconnectReason.loggedOut) {
          logger.warn({ sessionId }, 'Sesión cerrada por el usuario');
          this.removeSession(sessionId);
        } else {
          sessionData.status = 'reconnecting';
          logger.info({ sessionId }, 'Reconectando en 5s...');
          setTimeout(() => {
            if (this.sessions.has(sessionId)) {
              this.reconnect(sessionId);
            }
          }, 5000);
        }
      }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;
      for (const msg of messages) {
        if (!msg.message || msg.key.fromMe) continue;
        try {
          await handleMessage(sock, msg);
        } catch (err) {
          logger.error({ err }, 'Error manejando mensaje');
        }
      }
    });

    return this.getSession(sessionId);
  }

  async reconnect(sessionId) {
    const existing = this.sessions.get(sessionId);
    if (!existing) return;
    const { number } = existing;
    this.sessions.delete(sessionId);
    serverManager.removeSlot(sessionId);
    try {
      await this.createSession(number);
    } catch (err) {
      logger.error({ err }, 'Error al reconectar');
    }
  }

  getSession(sessionId) {
    const s = this.sessions.get(sessionId);
    if (!s) return null;
    return {
      id: s.id,
      number: s.number,
      serverId: s.serverId,
      status: s.status,
      qr: s.qr,
    };
  }

  getAll() {
    return Array.from(this.sessions.values()).map((s) => this.getSession(s.id));
  }

  removeSession(sessionId) {
    const s = this.sessions.get(sessionId);
    if (!s) return false;
    try { s.sock?.end?.(undefined); } catch {}
    this.sessions.delete(sessionId);
    serverManager.removeSlot(sessionId);
    const dir = path.join(config.sessionsDir, sessionId);
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
    logger.info({ sessionId }, 'Sesión eliminada');
    return true;
  }
}

export const sessionManager = new SessionManager();