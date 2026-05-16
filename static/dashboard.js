// ── CPU & RAM History ─────────────────────────────
const cpuHistory = Array(60).fill(null);
const ramHistory = Array(60).fill(null);
const canvas     = document.getElementById('cpu-graph');
const ctx        = canvas.getContext('2d');
const ramCanvas  = document.getElementById('ram-graph');
const ramCtx     = ramCanvas.getContext('2d');
let hoveredIndex = null;
let lastLogTime  = 0;

// ── Session log ───────────────────────────────────
const sessionLog = [];

// ── Theme toggle ─────────────────────────────────
function toggleTheme() {
  const html = document.documentElement;
  const btn  = document.querySelector('.theme-toggle');
  if (html.dataset.theme === 'dark') {
    html.dataset.theme = 'light';
    btn.textContent    = '🌙 Dark Mode';
  } else {
    html.dataset.theme = 'dark';
    btn.textContent    = '☀️ Light Mode';
  }
}

// ── Export CSV ────────────────────────────────────
function exportCSV() {
  if (sessionLog.length === 0) {
    alert('No data logged yet — wait a few seconds and try again!');
    return;
  }
  const headers = 'Timestamp,Hostname,OS,CPU,RAM,Disk,Network Sent,Network Received';
  const rows    = sessionLog.map(s =>
    `${s.time},${s.hostname},${s.os},${s.cpu}%,${s.ram}%,${s.disk}%,${s.net_sent} MB,${s.net_recv} MB`
  );
  const csv  = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `devpulse-session-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Log snapshot every 5 seconds ─────────────────
function logSnapshot(data) {
  sessionLog.push({
    time:     new Date().toLocaleString(),
    hostname: data.hostname,
    os:       data.os,
    cpu:      data.cpu,
    ram:      data.ram,
    disk:     data.disk,
    net_sent: data.net_sent,
    net_recv: data.net_recv
  });
}

// ── Browser Notifications ────────────────────────
let notificationCooldown = false;

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function sendNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted' && !notificationCooldown) {
    new Notification(title, {
      body: body,
      icon: 'https://cdn-icons-png.flaticon.com/512/2947/2947656.png'
    });
    notificationCooldown = true;
    setTimeout(() => { notificationCooldown = false; }, 30000);
  }
}

// ── Colour coded bar (high = bad) ────────────────
function setBarColour(barEl, value) {
  barEl.classList.remove('low', 'medium', 'high');
  if      (value < 50) barEl.classList.add('low');
  else if (value < 80) barEl.classList.add('medium');
  else                 barEl.classList.add('high');
  barEl.style.width = value + '%';
}

// ── Battery bar (high = good) ─────────────────────
function setBatteryColour(barEl, value) {
  barEl.classList.remove('low', 'medium', 'high');
  if      (value > 50) barEl.classList.add('low');
  else if (value > 20) barEl.classList.add('medium');
  else                 barEl.classList.add('high');
  barEl.style.width = value + '%';
}

// ── Draw CPU graph ────────────────────────────────
function drawGraph() {
  canvas.width  = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const step = canvas.width / (cpuHistory.length - 1);

  // Grid lines + Y labels
  ctx.strokeStyle = '#252a38';
  ctx.lineWidth   = 1;
  for (let i = 0; i <= 4; i++) {
    const y = (canvas.height / 4) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
    ctx.fillStyle = '#64748b';
    ctx.font      = '10px Segoe UI';
    ctx.fillText(`${100 - i * 25}%`, 4, y + 12);
  }

  // CPU line
  ctx.beginPath();
  ctx.strokeStyle = '#00e5a0';
  ctx.lineWidth   = 2;
  let cpuStarted  = false;
  let lastX, lastY;
  cpuHistory.forEach((val, i) => {
    if (val === null) return;
    const x = i * step;
    const y = canvas.height - (val / 100) * canvas.height;
    if (!cpuStarted) { ctx.moveTo(x, y); cpuStarted = true; }
    else ctx.lineTo(x, y);
    lastX = x; lastY = y;
  });
  ctx.stroke();

  // Fill under line
  if (cpuStarted) {
    ctx.lineTo(lastX, canvas.height);
    const firstValid = cpuHistory.findIndex(v => v !== null);
    ctx.lineTo(firstValid * step, canvas.height);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 229, 160, 0.07)';
    ctx.fill();
  }

  // Hover tooltip
  if (hoveredIndex !== null && cpuHistory[hoveredIndex] !== null) {
    const val = cpuHistory[hoveredIndex];
    const x   = hoveredIndex * step;
    const y   = canvas.height - (val / 100) * canvas.height;

    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth   = 1;
    ctx.setLineDash([4, 4]);
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle   = '#00e5a0';
    ctx.fill();
    ctx.strokeStyle = '#0d0f14';
    ctx.lineWidth   = 2;
    ctx.stroke();

    const boxW  = 48;
    const boxH  = 26;
    let   boxX  = x + 10;
    let   boxY  = y - 18;
    if (boxX + boxW > canvas.width) boxX = x - boxW - 10;
    if (boxY < 0) boxY = 4;

    ctx.fillStyle   = '#1a1e2a';
    ctx.strokeStyle = '#00e5a0';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#00e5a0';
    ctx.font      = 'bold 12px Segoe UI';
    ctx.fillText(`${val}%`, boxX + 8, boxY + 17);
  }
}

// ── Draw RAM graph ────────────────────────────────
function drawRamGraph() {
  ramCanvas.width  = ramCanvas.offsetWidth;
  ramCanvas.height = ramCanvas.offsetHeight;
  ramCtx.clearRect(0, 0, ramCanvas.width, ramCanvas.height);

  const step = ramCanvas.width / (ramHistory.length - 1);

  // Grid lines + Y labels
  ramCtx.strokeStyle = '#252a38';
  ramCtx.lineWidth   = 1;
  for (let i = 0; i <= 4; i++) {
    const y = (ramCanvas.height / 4) * i;
    ramCtx.beginPath();
    ramCtx.moveTo(0, y);
    ramCtx.lineTo(ramCanvas.width, y);
    ramCtx.stroke();
    ramCtx.fillStyle = '#64748b';
    ramCtx.font      = '10px Segoe UI';
    ramCtx.fillText(`${100 - i * 25}%`, 4, y + 12);
  }

  // RAM line
  ramCtx.beginPath();
  ramCtx.strokeStyle = '#7c6dfa';
  ramCtx.lineWidth   = 2;
  let ramStarted     = false;
  let lastRX, lastRY;
  ramHistory.forEach((val, i) => {
    if (val === null) return;
    const x = i * step;
    const y = ramCanvas.height - (val / 100) * ramCanvas.height;
    if (!ramStarted) { ramCtx.moveTo(x, y); ramStarted = true; }
    else ramCtx.lineTo(x, y);
    lastRX = x; lastRY = y;
  });
  ramCtx.stroke();

  // Fill under line
  if (ramStarted) {
    ramCtx.lineTo(lastRX, ramCanvas.height);
    const firstValid = ramHistory.findIndex(v => v !== null);
    ramCtx.lineTo(firstValid * step, ramCanvas.height);
    ramCtx.closePath();
    ramCtx.fillStyle = 'rgba(124, 109, 250, 0.07)';
    ramCtx.fill();
  }
}

// ── Graph hover ───────────────────────────────────
canvas.addEventListener('mousemove', (e) => {
  const rect   = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const step   = canvas.width / (cpuHistory.length - 1);
  hoveredIndex = Math.round(mouseX / step);
  if (hoveredIndex < 0) hoveredIndex = 0;
  if (hoveredIndex >= cpuHistory.length) hoveredIndex = cpuHistory.length - 1;
  drawGraph();
});

canvas.addEventListener('mouseleave', () => {
  hoveredIndex = null;
  drawGraph();
});

// ── Update all stats ─────────────────────────────
function updateStats() {
  fetch('/api/stats')
    .then(r => r.json())
    .then(data => {

      document.getElementById('cpu').textContent  = data.cpu + '%';
      document.getElementById('ram').textContent  = data.ram + '%';
      document.getElementById('disk').textContent = data.disk + '%';

      setBarColour(document.getElementById('cpu-bar'),  data.cpu);
      setBarColour(document.getElementById('ram-bar'),  data.ram);
      setBarColour(document.getElementById('disk-bar'), data.disk);

      document.getElementById('ram-detail').textContent =
        `${data.ram_used} GB used of ${data.ram_total} GB`;

      document.getElementById('net-sent').textContent = data.net_sent + ' MB';
      document.getElementById('net-recv').textContent = data.net_recv + ' MB';

      document.getElementById('hostname').textContent = data.hostname;
      document.getElementById('os').textContent       = data.os;
      document.getElementById('uptime').textContent   = data.uptime;

      if (data.battery) {
        document.getElementById('battery-value').textContent = data.battery.percent + '%';
        document.getElementById('battery-status').textContent =
          data.battery.charging ? '⚡ Charging' : '🔋 On Battery';
        setBatteryColour(document.getElementById('battery-bar'), data.battery.percent);

        const battAlert = document.getElementById('battery-alert');
        if (data.battery.percent < 20 && !data.battery.charging) {
          battAlert.classList.remove('hidden');
        } else {
          battAlert.classList.add('hidden');
        }
      }

      const cpuAlert = document.getElementById('cpu-alert');
      if (data.cpu > 80) {
        cpuAlert.classList.remove('hidden');
        sendNotification('⚠️ DevPulse Alert', `High CPU usage! Currently at ${data.cpu}%`);
      } else {
        cpuAlert.classList.add('hidden');
      }

      cpuHistory.push(data.cpu);
      cpuHistory.shift();
      ramHistory.push(data.ram);
      ramHistory.shift();
      drawGraph();
      drawRamGraph();

      if (sessionLog.length === 0 || Date.now() - lastLogTime >= 5000) {
        logSnapshot(data);
        lastLogTime = Date.now();
      }

      document.getElementById('process-list').innerHTML =
        data.processes.map(p => `
          <div class="process-item">
            <span class="process-name">${p.name}</span>
            <span class="process-cpu">${p.cpu}%</span>
          </div>
        `).join('');
    });
}

// ── Live Clock ───────────────────────────────────
function updateClock() {
  const now = new Date();
  const h   = String(now.getHours()).padStart(2, '0');
  const m   = String(now.getMinutes()).padStart(2, '0');
  const s   = String(now.getSeconds()).padStart(2, '0');
  document.getElementById('clock').textContent = `${h}:${m}:${s}`;
}

// ── Start ────────────────────────────────────────
requestNotificationPermission();
setInterval(updateStats, 1000);
setInterval(updateClock, 1000);
updateStats();
updateClock();
window.addEventListener('resize', drawGraph);
window.addEventListener('resize', drawRamGraph);