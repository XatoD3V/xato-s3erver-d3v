import { config } from '../config.js';
import { commands } from './commands.js';
import { logger } from '../logger.js';

export async function handleMessage(sock, msg) {
  const from = msg.key.remoteJid;
  if (!from || from.endsWith('@g.us')) return; // ignorar grupos por defecto

  const text =
    msg.message.conversation ||
    msg.message.extendedTextMessage?.text ||
    msg.message.imageMessage?.caption ||
    '';

  const trimmed = text.trim();
  if (!trimmed.startsWith(config.prefix)) return;

  const [rawCmd, ...args] = trimmed.slice(config.prefix.length).split(/\s+/);
  const cmdName = rawCmd.toLowerCase();

  const command = commands[cmdName];
  if (!command) return;

  logger.info({ cmd: cmdName, from }, 'Comando recibido');

  try {
    await command.execute({ sock, msg, from, args });
  } catch (err) {
    logger.error({ err, cmd: cmdName }, 'Error ejecutando comando');
    await sock.sendMessage(from, {
      text: `Error ejecutando ${config.prefix}${cmdName}`,
    });
  }
}