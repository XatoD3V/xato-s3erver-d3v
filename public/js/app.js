const API = '/api';
let qrTimer = null;

async function loadStatus() {
  try {
    const res = await fetch(`${API}/status`);
    const data = await res.json();
    renderServers(data.servers);
    renderSessions(data.sessions);
    document.getElementById('global-status').textContent =
      `${data.servers.length} servidores activos`;
    document.getElementById('global-dot').className = 'dot online';
  } catch {
    document.getElementById('global-status').textContent = 'Sin conexión';
    document.getElementById('global-dot').className = 'dot offline';
  }
}

function renderServers(servers) {
  const grid = document.getElementById('servers-grid');
  grid.innerHTML = servers.map((s) => {
    const pct = (s.used / s.capacity) * 100;
    const state = s.used >= s.capacity ? 'full' : s.used >= s.capacity - 1 ? 'warn' : 'ok';
    const label =
      s.used >= s.capacity ? 'Lleno' :
      s.used >= s.capacity - 1 ? 'Casi lleno' : 'Activo';
    return `
      <div class="server-card">
        <div class="header">
          <span class="name">${s.name}</span>
          <span class="badge ${state}">${label}</span>
        </div>
        <div class="progress">
          <div class="${state === 'ok' ? '' : state}" style="width: ${pct}%"></div>
        </div>
        <p class="muted" style="margin-top:8px">${s.used} / ${s.capacity} registros</p>
      </div>
    `;
  }).join('');
  if (window.lucide) lucide.createIcons();
}

function renderSessions(sessions) {
  const list = document.getElementById('sessions-list');
  if (!sessions.length) {
    list.innerHTML = '<p class="muted">No hay sesiones activas.</p>';
    return;
  }
  list.innerHTML = sessions.map((s) => {
    const cls =
      s.status === 'connected' ? 'online' :
      s.status === 'awaiting_qr' ? 'warn' : 'offline';
    return `
      <div class="session-item">
        <div class="left">
          <span class="dot ${cls}"></span>
          <span>${s.number}</span>
        </div>
        <span class="muted">${s.serverId} · ${s.status}</span>
      </div>
    `;
  }).join('');
}

document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('phone');
  const btn = e.target.querySelector('button');
  const number = input.value.replace(/\D/g, '');

  if (!number || number.length < 8) {
    alert('Ingresa un número válido (8-15 dígitos)');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i data-lucide="loader"></i> Generando...';
  if (window.lucide) lucide.createIcons();

  try {
    const res = await fetch(`${API}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error desconocido');

    document.getElementById('qr-panel').classList.remove('hidden');
    document.getElementById('qr-hint').textContent =
      'Escanea el QR desde WhatsApp → Dispositivos vinculados';

    if (data.qr) document.getElementById('qr-image').src = data.qr;
    startQrPolling(data.id);

    input.value = '';
    loadStatus();
  } catch (err) {
    alert(err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="qr-code"></i> Generar QR';
    if (window.lucide) lucide.createIcons();
  }
});

function startQrPolling(sessionId) {
  if (qrTimer) clearInterval(qrTimer);
  qrTimer = setInterval(async () => {
    try {
      const res = await fetch(`${API}/session/${sessionId}`);
      const data = await res.json();
      if (data.status === 'connected') {
        clearInterval(qrTimer);
        document.getElementById('qr-panel').classList.add('hidden');
        loadStatus();
        return;
      }
      if (data.qr) document.getElementById('qr-image').src = data.qr;
    } catch {}
  }, 2500);
}

loadStatus();
setInterval(loadStatus, 5000);