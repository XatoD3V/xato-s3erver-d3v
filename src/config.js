import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT) || 3000,
  systemName: process.env.SYSTEM_NAME || 'Xato S3erver D3v',
  botName: process.env.BOT_NAME || 'Xato Ds',
  prefix: process.env.COMMAND_PREFIX || '!',
  totalServers: parseInt(process.env.TOTAL_SERVERS) || 3,
  slotsPerServer: parseInt(process.env.SLOTS_PER_SERVER) || 5,
  sessionsDir: process.env.SESSIONS_DIR || './sessions',
  dataFile: process.env.DATA_FILE || './data/registry.json',
  logLevel: process.env.LOG_LEVEL || 'info',
};