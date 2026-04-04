// utils.js — Funciones compartidas (toast, formato, badges, delete)

// ============= UTILS =============
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => t.classList.remove('show'), 3000);
}

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function formatDate(d) {
  if (!d) return '—';
  return new Date(d + 'T12:00:00').toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });
}

function formatMoney(n) {
  if (n == null) return '—';
  return '$' + parseFloat(n).toLocaleString('es-MX', { minimumFractionDigits:2, maximumFractionDigits:2 });
}

function badge(val, map) {
  const cls = map[val] || '';
  return `<span class="badge ${cls}">${val || '—'}</span>`;
}

function switchTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  event.currentTarget.classList.add('active');
}

function loading(containerId) {
  document.getElementById(containerId).innerHTML = `<div class="loading"><div class="spinner"></div> Cargando datos...</div>`;
}

function emptyState(icon, msg) {
  return `<div class="empty-state"><div class="icon">${icon}</div><p>${msg}</p></div>`;
}

// ============= DELETE =============
async function deleteRecord(table, id, reloadFn) {
  if (!confirm('¿Seguro que deseas eliminar este registro?')) return;
  const { error } = await db.from(table).delete().eq('id', id);
  if (error) { showToast('Error al eliminar: ' + error.message, 'error'); return; }
  showToast('🗑 Registro eliminado');
  reloadFn();
}