# Xato S3erver D3v

Sistema multi-servidor de automatización de WhatsApp con bot integrado **Xato Ds**.

- **3 servidores** independientes
- **5 registros máximo** por servidor (15 sesiones totales)
- **Generación de QR** para vincular números de WhatsApp
- **Bot Xato Ds** con comandos extensibles
- Dashboard **minimalista** con iconos profesionales

---

## Arquitectura

```
┌─────────────────────────────────────────────────┐
│              Xato S3erver D3v                   │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │Servidor01│  │Servidor02│  │Servidor03│      │
│  │ 5 slots  │  │ 5 slots  │  │ 5 slots  │      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
│       └─────────────┼─────────────┘            │
│                     │                           │
│              ┌──────▼──────┐                    │
│              │  Xato Ds   │                    │
│              │   Bot      │                    │
│              └────────────┘                     │
└─────────────────────────────────────────────────┘
```

---

## Instalación

### Requisitos
- Node.js 20+
- npm

### Pasos

```bash
git clone https://github.com/TU_USUARIO/xato-s3erver-d3v.git
cd xato-s3erver-d3v
npm install
cp .env.example .env
npm start
```

Abre el dashboard en: **http://localhost:3000**

---

## Uso

### Registrar un número

1. Ingresa el número con código de país (ej: `51987654321`)
2. Pulsa **Generar QR**
3. Escanea el QR desde *WhatsApp → Dispositivos vinculados*
4. La sesión se activa automáticamente

### Comandos del bot Xato Ds

| Comando | Descripción |
|---------|-------------|
| `!help` | Lista de comandos |
| `!ping` | Estado del bot |
| `!info` | Estado de los servidores |
| `!echo [texto]` | Repite el texto |

---

## Añadir un nuevo comando

Edita `src/bot/commands.js`:

```javascript
export const commands = {
  // ... comandos existentes

  miComando: {
    description: 'Descripción de mi comando',
    async execute({ sock, from, args }) {
      await sock.sendMessage(from, { text: 'Hola desde miComando' });
    },
  },
};
```

---

## Endpoints de la API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/status` | Estado global |
| GET | `/api/servers` | Lista de servidores |
| POST | `/api/register` | Registrar número |
| GET | `/api/session/:id` | Consultar sesión |
| DELETE | `/api/session/:id` | Eliminar sesión |

---

## Estructura del proyecto

```
.
├── index.js                    # Entry point
├── src/
│   ├── config.js               # Configuración global
│   ├── logger.js               # Logger
│   ├── serverManager.js        # Gestión de los 3 servidores
│   ├── sessionManager.js       # Sesiones de WhatsApp
│   ├── bot/
│   │   ├── index.js            # Router de comandos
│   │   └── commands.js         # Comandos del bot
│   └── routes/
│       └── api.js              # Endpoints REST
└── public/                     # Dashboard
```

---

## Advertencias

- **Uso responsable**: WhatsApp puede banear números que envíen spam. Respeta los límites y añade delays.
- **No usar para spam masivo**: Esta herramienta es para automatización personal o de negocios legítimos.
- **Persistencia**: Las sesiones se guardan localmente en `./sessions`. No lo subas a GitHub (ya está en `.gitignore`).

---

## Roadmap

- [ ] Persistencia SQLite de sesiones
- [ ] Autenticación de usuarios en el dashboard
- [ ] Comandos multimedia (`!sticker`, `!audio`)
- [ ] Webhooks para integración externa
- [ ] Dockerización
- [ ] Reconexión automática al reiniciar servidor

---

## Licencia

MIT