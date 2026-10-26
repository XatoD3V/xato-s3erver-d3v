import { config } from '../config.js';
import { serverManager } from '../serverManager.js';

export const commands = {
  help: {
    description: 'Muestra la lista de comandos disponibles',
    async execute({ sock, from }) {
      const lines = Object.entries(commands).map(
        ([name, cmd]) => `${config.prefix}${name} — ${cmd.description}`
      );
      await sock.sendMessage(from, {
        text: `*${config.botName}* — Comandos\n\n${lines.join('\n')}`,
      });
    },
  },

  ping: {
    description: 'Verifica el estado del bot',
    async execute({ sock, from }) {
      const latency = Date.now();
      await sock.sendMessage(from, {
        text: `${config.botName} operativo\nLatencia: ${Date.now() - latency}ms`,
      });
    },
  },

  info: {
    description: 'Muestra el estado del sistema',
    async execute({ sock, from }) {
      const servers = serverManager.getStatus();
      const lines = servers.map(
        (s) => `${s.name}: ${s.used}/${s.capacity} sesiones`
      );
      await sock.sendMessage(from, {
        text: `*${config.systemName}*\n\n${lines.join('\n')}`,
      });
    },
  },

  echo: {
    description: 'Repite el texto enviado',
    async execute({ sock, from, args }) {
      const text = args.join(' ') || '(sin texto)';
      await sock.sendMessage(from, { text });
    },
  },
};