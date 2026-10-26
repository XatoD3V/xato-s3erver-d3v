import fs from 'fs';
import path from 'path';
import { config } from './config.js';
import { logger } from './logger.js';

class ServerManager {
  constructor() {
    this.servers = [];
    this.load();
  }

  load() {
    try {
      const raw = fs.readFileSync(config.dataFile, 'utf8');
      this.servers = JSON.parse(raw);
      logger.info(`[serverManager] ${this.servers.length} servidores cargados`);
    } catch {
      this.servers = [];
      for (let i = 1; i <= config.totalServers; i++) {
        this.servers.push({
          id: `server-0${i}`,
          name: `Servidor 0${i}`,
          capacity: config.slotsPerServer,
          slots: [],
        });
      }
      this.save();
      logger.info(`[serverManager] ${this.servers.length} servidores inicializados`);
    }
  }

  save() {
    const dir = path.dirname(config.dataFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(config.dataFile, JSON.stringify(this.servers, null, 2));
  }

  getStatus() {
    return this.servers.map((s) => ({
      id: s.id,
      name: s.name,
      used: s.slots.length,
      capacity: s.capacity,
      slots: s.slots.map((slot) => ({
        number: slot.number,
        sessionId: slot.sessionId,
        createdAt: slot.createdAt,
      })),
    }));
  }

  findAvailableServer() {
    let best = null;
    for (const s of this.servers) {
      if (s.slots.length < s.capacity) {
        if (!best || s.slots.length < best.slots.length) best = s;
      }
    }
    return best;
  }

  addSlot(number, sessionId) {
    const server = this.findAvailableServer();
    if (!server) throw new Error('Capacidad máxima alcanzada en todos los servidores');
    server.slots.push({
      number,
      sessionId,
      createdAt: new Date().toISOString(),
    });
    this.save();
    return server;
  }

  removeSlot(sessionId) {
    for (const s of this.servers) {
      const idx = s.slots.findIndex((x) => x.sessionId === sessionId);
      if (idx >= 0) {
        s.slots.splice(idx, 1);
        this.save();
        return true;
      }
    }
    return false;
  }

  findByNumber(number) {
    for (const s of this.servers) {
      const slot = s.slots.find((x) => x.number === number);
      if (slot) return { server: s, slot };
    }
    return null;
  }

  findBySessionId(sessionId) {
    for (const s of this.servers) {
      const slot = s.slots.find((x) => x.sessionId === sessionId);
      if (slot) return { server: s, slot };
    }
    return null;
  }
}

export const serverManager = new ServerManager();